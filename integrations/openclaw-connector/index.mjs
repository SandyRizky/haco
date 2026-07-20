import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const textFromMessage = (message) => {
  if (!message) return "";
  if (typeof message.content === "string") return message.content.trim();
  if (!Array.isArray(message.content)) return "";
  return message.content
    .filter((part) => part && part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
};

const reasoningFromMessage = (message) => {
  if (!message) return null;
  if (typeof message.reasoning === "string" && message.reasoning.trim()) return message.reasoning.trim();
  if (!Array.isArray(message.content)) return null;
  const parts = message.content.filter((part) => part && part.type === "reasoning" && typeof part.reasoning === "string" && part.reasoning.trim());
  if (parts.length) return parts.map((part) => part.reasoning).join("\n").trim();
  return null;
};

const mediaTypeFromUrl = (url) => {
  const path = String(url).split(/[?#]/, 1)[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(path)) return "image/" + (path.endsWith(".svg") ? "svg+xml" : path.match(/\.([a-z0-9]+)$/)?.[1]?.replace("jpg", "jpeg"));
  if (/\.(mp4|webm|mov)$/.test(path)) return "video/" + (path.endsWith(".mov") ? "quicktime" : path.match(/\.([a-z0-9]+)$/)?.[1]);
  if (/\.(mp3|wav|ogg|m4a|flac)$/.test(path)) return "audio/" + (path.match(/\.([a-z0-9]+)$/)?.[1] || "mpeg");
  if (/\.pdf$/i.test(path)) return "application/pdf";
  if (/\.(zip|tar|gz|tgz|rar|7z)$/i.test(path)) return "application/" + (path.match(/\.([a-z0-9]+)$/)?.[1] || "zip");
  if (/\.(doc|docx)$/i.test(path)) return "application/msword";
  if (/\.(xls|xlsx)$/i.test(path)) return "application/vnd.ms-excel";
  if (/\.(csv)$/i.test(path)) return "text/csv";
  if (/\.(json)$/i.test(path)) return "application/json";
  return "application/octet-stream";
};

const postThinking = async (hacoUrl, token, payload) => {
  try {
    await fetch(String(hacoUrl).replace(/\/$/, "") + "/api/integrations/openclaw/thinking", {
      method: "POST",
      headers: { "authorization": "Bearer " + token, "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {}
};

const attachmentsFromMessage = async (message, hacoUrl, token, principalId) => {
  const candidates = [];
  if (typeof message?.mediaUrl === "string") candidates.push(message.mediaUrl);
  if (Array.isArray(message?.mediaUrls)) candidates.push(...message.mediaUrls);
  for (const part of Array.isArray(message?.content) ? message.content : []) {
    const value = part?.url ?? part?.mediaUrl ?? part?.path ?? part?.filePath ?? part?.source?.url;
    if (typeof value === "string") candidates.push(value);
  }
  for (const match of textFromMessage(message).matchAll(/(?:MEDIA|FILE):\s*(\S+)/gi)) {
    candidates.push(match[1].replace(/^['"]|['"]$/g, ""));
  }
  const attachments = [...new Set(candidates.filter((value) => /^https?:\/\//i.test(value)))].map((url, index) => {
    let fileName = "agent-attachment-" + (index + 1);
    try { fileName = decodeURIComponent(new URL(url).pathname.split("/").pop()) || fileName; } catch {}
    return { id: crypto.randomUUID(), file_name: fileName, media_type: mediaTypeFromUrl(url), byte_size: 0, url };
  });
  for (const value of [...new Set(candidates.filter((item) => typeof item === "string" && (/^file:\/\//i.test(item) || item.startsWith("/"))))]) {
    try {
      const path = value.startsWith("file://") ? decodeURIComponent(new URL(value).pathname) : value;
      const bytes = await readFile(path);
      const form = new FormData();
      form.append("agent_id", principalId);
      form.append("file", new Blob([bytes]), basename(path));
      const response = await fetch(String(hacoUrl).replace(/\/$/, "") + "/api/integrations/openclaw/uploads", {
        method: "POST", headers: { "authorization": "Bearer " + token }, body: form
      });
      if (response.ok) attachments.push(await response.json());
    } catch {}
  }
  return attachments;
};

const deliverWithRetry = async (endpoint, token, payload) => {
  const delays = [0, 500, 1500, 3500];
  let lastStatus = 0;
  let lastError;
  for (const delay of delays) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "authorization": "Bearer " + token, "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) return;
      const detail = await response.text();
      lastStatus = response.status;
      lastError = new Error("Haco delivery failed (" + response.status + "): " + detail);
      if (response.status < 500 && response.status !== 408 && response.status !== 429) throw lastError;
    } catch (error) {
      if (error instanceof TypeError && error.message === "fetch failed") {
        lastError = error;
        continue;
      }
      lastError = error;
      if (lastStatus >= 400 && lastStatus < 500 && lastStatus !== 408 && lastStatus !== 429) throw error;
      if (!lastStatus && error?.message?.startsWith("Haco delivery failed (")) {
        if (!error.message.includes("(5") && !error.message.includes("(408") && !error.message.includes("(429")) throw error;
      }
    }
  }
  throw lastError ?? new Error("Haco delivery failed");
};

const decodeRoute = (sessionKey) => {
  const prefix = "hook:haco:";
  if (typeof sessionKey !== "string" || !sessionKey.startsWith(prefix)) return null;
  try {
    const encoded = sessionKey.slice(prefix.length);
    if (/^[0-9a-f]+$/i.test(encoded) && encoded.length % 2 === 0) {
      return JSON.parse(Buffer.from(encoded, "hex").toString("utf8"));
    }
    // Accept an older route only when its original mixed case survives, so an
    // in-flight request from a pre-hex Haco server can still complete.
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
};

const routeFromMessages = (messages) => {
  let discovered = null;
  for (const message of Array.isArray(messages) ? messages : []) {
    for (const match of textFromMessage(message).matchAll(/\[\[haco-route:([0-9a-f]+)\]\]/gi)) {
      const route = decodeRoute("hook:haco:" + match[1]);
      if (route?.conversation_id) discovered = route;
    }
  }
  return discovered;
};

export default {
  id: "haco-connector",
  name: "Haco Connector",
  description: "Routes OpenClaw results back to Haco.",
  register(api) {
    // OpenClaw's hook-agent completion event can omit its session key. Capture
    // the trusted Haco route at the start of the same run, then resolve it again
    // by run/session ID when the final assistant answer is available.
    const routes = new Map();
    const routeKeys = (event, context) => [
      context?.runId, event?.runId, context?.sessionId, event?.sessionId
    ].filter((value) => typeof value === "string" && value.length > 0);
    const sessionRoute = (event, context) => decodeRoute(
      context?.sessionKey ?? event?.sessionKey ?? event?.context?.sessionKey
    );
    const rememberRoute = (event, context) => {
      const route = sessionRoute(event, context) ?? routeFromMessages(event?.messages);
      if (route?.conversation_id) {
        for (const key of routeKeys(event, context)) routes.set(key, route);
      }
      return route;
    };
    const forgetRoute = (event, context) => {
      for (const key of routeKeys(event, context)) routes.delete(key);
    };

    api.on("before_agent_start", (event, context) => {
      rememberRoute(event, context);
    }, { timeoutMs: 30000 });

    api.on("agent_end", async (event, context) => {
      // OpenClaw resolves plugin configuration per hook invocation. The API-level
      // fallback supports older runtimes while the hook context is authoritative.
      const config = context?.pluginConfig ?? event?.context?.pluginConfig ?? api.pluginConfig ?? {};
      const route = rememberRoute(event, context)
        ?? routeKeys(event, context).map((key) => routes.get(key)).find(Boolean);
      if (!route?.conversation_id) {
        forgetRoute(event, context);
        api.logger?.warn?.("Haco reply skipped: the agent run has no Haco session route.");
        return;
      }
      const agentId = context?.agentId ?? event?.context?.agentId ?? event?.agentId;
      const principalId = config.principalMap?.[agentId];
      if (!config.hacoUrl || !config.token || !config.principalMap) {
        forgetRoute(event, context);
        api.logger?.warn?.("Haco reply skipped: connector configuration is incomplete.");
        return;
      }
      if (!principalId) {
        forgetRoute(event, context);
        api.logger?.warn?.("Haco reply skipped: OpenClaw agent is not mapped (" + String(agentId ?? "unknown") + ").");
        return;
      }
      const messages = Array.isArray(event?.messages) ? event.messages : [];
      const final = [...messages].reverse().find((message) => message?.role === "assistant");
      const body = textFromMessage(final);
      const reasoning = reasoningFromMessage(final);
      const attachments = await attachmentsFromMessage(final, config.hacoUrl, config.token, principalId);
      if (!body && !attachments.length) {
        forgetRoute(event, context);
        api.logger?.warn?.("Haco reply skipped: the completed agent run has no assistant text.");
        return;
      }
      if (reasoning) {
        await postThinking(config.hacoUrl, config.token, {
          conversation_id: route.conversation_id,
          agent_id: principalId,
          content: reasoning,
          done: true
        });
      }
      const endpoint = String(config.hacoUrl).replace(/\/$/, "") + "/api/integrations/openclaw/events";
      try {
        const runId = context?.runId ?? event?.context?.runId ?? event?.runId ?? crypto.randomUUID();
        await deliverWithRetry(endpoint, config.token, {
            agent_id: principalId,
            conversation_id: route.conversation_id,
            parent_message_id: route.parent_message_id ?? null,
            body: body || "Shared an attachment.",
            reasoning,
            activity: {
              status: event?.success === false ? "failed" : "completed",
              summary: "Completed an OpenClaw task requested from Haco.",
              tool_name: "openclaw.agent"
            },
            attachments,
            delivery_id: route.delivery_id ? String(route.delivery_id) + ":" + String(agentId) : String(runId) + ":" + String(agentId),
            test_id: route.test_id ?? null,
            relay_depth: Number(route.relay_depth || 0) + 1
        });
        api.logger?.info?.("Haco reply delivered for OpenClaw agent " + String(agentId));
      } catch (error) {
        api.logger?.warn?.("Haco delivery failed: " + (error instanceof Error ? error.message : String(error)));
      } finally {
        forgetRoute(event, context);
      }
    }, { timeoutMs: 30000 });
  }
};
