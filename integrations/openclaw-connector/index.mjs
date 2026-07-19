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

const mediaTypeFromUrl = (url) => {
  const path = String(url).split(/[?#]/, 1)[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(path)) return "image/" + (path.endsWith(".svg") ? "svg+xml" : path.match(/\.([a-z0-9]+)$/)?.[1]?.replace("jpg", "jpeg"));
  if (/\.(mp4|webm|mov)$/.test(path)) return "video/" + (path.endsWith(".mov") ? "quicktime" : path.match(/\.([a-z0-9]+)$/)?.[1]);
  if (/\.(mp3|wav|ogg|m4a)$/.test(path)) return "audio/" + (path.match(/\.([a-z0-9]+)$/)?.[1] || "mpeg");
  return "application/octet-stream";
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
      lastError = new Error("Haco delivery failed (" + response.status + "): " + detail);
      if (response.status < 500 && response.status !== 408 && response.status !== 429) throw lastError;
    } catch (error) {
      lastError = error;
      if (error?.message?.includes("Haco delivery failed (4") && !error?.message?.includes("408") && !error?.message?.includes("429")) throw error;
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

export default {
  id: "haco-connector",
  name: "Haco Connector",
  description: "Routes OpenClaw results back to Haco.",
  register(api) {
    api.on("agent_end", async (event, context) => {
      // OpenClaw resolves plugin configuration per hook invocation. The API-level
      // fallback supports older runtimes while the hook context is authoritative.
      const config = context?.pluginConfig ?? event?.context?.pluginConfig ?? api.pluginConfig ?? {};
      const sessionKey = context?.sessionKey ?? event?.context?.sessionKey ?? event?.sessionKey;
      const route = decodeRoute(sessionKey);
      if (!route?.conversation_id) {
        api.logger?.warn?.("Haco reply skipped: the agent run has no Haco session route.");
        return;
      }
      const agentId = context?.agentId ?? event?.context?.agentId ?? event?.agentId;
      const principalId = config.principalMap?.[agentId];
      if (!config.hacoUrl || !config.token || !config.principalMap) {
        api.logger?.warn?.("Haco reply skipped: connector configuration is incomplete.");
        return;
      }
      if (!principalId) {
        api.logger?.warn?.("Haco reply skipped: OpenClaw agent is not mapped (" + String(agentId ?? "unknown") + ").");
        return;
      }
      const messages = Array.isArray(event?.messages) ? event.messages : [];
      const final = [...messages].reverse().find((message) => message?.role === "assistant");
      const body = textFromMessage(final);
      const attachments = await attachmentsFromMessage(final, config.hacoUrl, config.token, principalId);
      if (!body && !attachments.length) {
        api.logger?.warn?.("Haco reply skipped: the completed agent run has no assistant text.");
        return;
      }
      const endpoint = String(config.hacoUrl).replace(/\/$/, "") + "/api/integrations/openclaw/events";
      try {
        const runId = context?.runId ?? event?.context?.runId ?? event?.runId ?? crypto.randomUUID();
        await deliverWithRetry(endpoint, config.token, {
            agent_id: principalId,
            conversation_id: route.conversation_id,
            parent_message_id: route.parent_message_id ?? null,
            body: body || "Shared an attachment.",
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
      }
    }, { timeoutMs: 30000 });
  }
};
