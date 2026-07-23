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

const messagesFromRun = (event, context) => [
  event?.messages,
  context?.messages,
  event?.context?.messages,
  context?.result?.messages,
  event?.result?.messages
].flatMap((messages) => Array.isArray(messages) ? messages : []);

const finalAssistantMessage = (event, context, messages) => {
  const explicitFinals = [
    event?.finalMessage,
    event?.assistantMessage,
    event?.result?.finalMessage,
    event?.result?.assistantMessage,
    context?.finalMessage,
    context?.assistantMessage,
    context?.result?.finalMessage,
    context?.result?.assistantMessage
  ].filter(Boolean);
  return [...messages].reverse().find((message) => message?.role === "assistant")
    ?? [...explicitFinals].reverse().find((message) => textFromMessage(message));
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

const postRunUpdate = async (hacoUrl, token, runId, payload) => {
  try {
    await fetch(String(hacoUrl).replace(/\/$/, "") + "/api/integrations/openclaw/runs/" + runId, {
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
  return [...new Set(candidates.filter((value) => /^https?:\/\//i.test(value)))].map((url, index) => {
    let fileName = "agent-attachment-" + (index + 1);
    try { fileName = decodeURIComponent(new URL(url).pathname.split("/").pop()) || fileName; } catch {}
    return { id: crypto.randomUUID(), file_name: fileName, media_type: mediaTypeFromUrl(url), byte_size: 0, url };
  });
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
    const routes = new Map();
    const routeKeys = (event, context) => [
      context?.runId, event?.runId, event?.context?.runId,
      context?.sessionId, event?.sessionId, event?.context?.sessionId
    ].filter((value) => typeof value === "string" && value.length > 0);
    const sessionRoute = (event, context) => decodeRoute(
      context?.sessionKey ?? context?.session?.key ?? event?.sessionKey ?? event?.session?.key ?? event?.context?.sessionKey
    );
    const rememberRoute = (event, context) => {
      const route = sessionRoute(event, context);
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
      const config = context?.pluginConfig ?? event?.context?.pluginConfig ?? api.pluginConfig ?? {};
      const route = rememberRoute(event, context)
        ?? routeKeys(event, context).map((key) => routes.get(key)).find(Boolean);
      const agentId = context?.agentId ?? context?.agent?.id ?? event?.context?.agentId ?? event?.agentId ?? event?.agent?.id;
      const principalId = config.principalMap?.[agentId];
      const runId = route?.run_id;
      const hasConfig = config.hacoUrl && config.token && config.principalMap;

      if (!route?.conversation_id) {
        forgetRoute(event, context);
        api.logger?.warn?.("Haco reply skipped: the agent run has no Haco session route.");
        return;
      }

      let terminalStatus = event?.success === false ? "failed" : "completed";
      let terminalError = null;

      if (!hasConfig || !principalId) {
        if (runId && hasConfig) {
          await postRunUpdate(config.hacoUrl, config.token, runId, {
            status: "delivery_failed",
            error: principalId ? "connector configuration is incomplete" : "OpenClaw agent is not mapped (" + String(agentId ?? "unknown") + ")",
            done: true
          });
        }
        forgetRoute(event, context);
        if (!hasConfig) api.logger?.warn?.("Haco reply skipped: connector configuration is incomplete.");
        else api.logger?.warn?.("Haco reply skipped: OpenClaw agent is not mapped (" + String(agentId ?? "unknown") + ").");
        return;
      }

      const messages = messagesFromRun(event, context);
      const final = finalAssistantMessage(event, context, messages);
      const body = textFromMessage(final);
      const reasoning = reasoningFromMessage(final);
      const attachments = await attachmentsFromMessage(final, config.hacoUrl, config.token, principalId);

      if (!body && !attachments.length) {
        if (runId) {
          await postRunUpdate(config.hacoUrl, config.token, runId, {
            status: "failed",
            error: "the completed agent run has no assistant text",
            done: true
          });
        }
        forgetRoute(event, context);
        api.logger?.warn?.("Haco reply skipped: the completed agent run has no assistant text.");
        return;
      }

      const endpoint = String(config.hacoUrl).replace(/\/$/, "") + "/api/integrations/openclaw/events";
      try {
        if (reasoning && runId) {
          await postRunUpdate(config.hacoUrl, config.token, runId, {
            reasoning_content: reasoning,
            content_mode: "snapshot",
            sequence: 1,
            done: false
          });
        }
        const fallbackRunId = context?.runId ?? event?.context?.runId ?? event?.runId ?? crypto.randomUUID();
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
            delivery_id: route.delivery_id ? String(route.delivery_id) + ":" + String(agentId) : String(fallbackRunId) + ":" + String(agentId),
            test_id: route.test_id ?? null,
            relay_depth: Number(route.relay_depth || 0) + 1
        });
        api.logger?.info?.("Haco reply delivered for OpenClaw agent " + String(agentId));
        terminalStatus = event?.success === false ? "failed" : "completed";
      } catch (error) {
        terminalStatus = "delivery_failed";
        terminalError = error instanceof Error ? error.message : String(error);
        api.logger?.warn?.("Haco delivery failed: " + terminalError);
      } finally {
        if (runId && hasConfig) {
          await postRunUpdate(config.hacoUrl, config.token, runId, {
            status: terminalError ? terminalStatus : null,
            error: terminalError,
            reasoning_content: terminalError ? null : reasoning,
            content_mode: reasoning ? "snapshot" : "snapshot",
            sequence: reasoning ? 2 : 1,
            done: true
          });
        }
        forgetRoute(event, context);
      }
    }, { timeoutMs: 30000 });
  }
};
