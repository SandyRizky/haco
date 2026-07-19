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
      if (!body) {
        api.logger?.warn?.("Haco reply skipped: the completed agent run has no assistant text.");
        return;
      }
      const endpoint = String(config.hacoUrl).replace(/\/$/, "") + "/api/integrations/openclaw/events";
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "authorization": "Bearer " + config.token,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            agent_id: principalId,
            conversation_id: route.conversation_id,
            parent_message_id: route.parent_message_id ?? null,
            body,
            activity: {
              status: event?.success === false ? "failed" : "completed",
              summary: "Completed an OpenClaw task requested from Haco.",
              tool_name: "openclaw.agent"
            },
            attachments: []
          })
        });
        if (!response.ok) {
          api.logger?.warn?.("Haco delivery failed (" + response.status + "): " + await response.text());
          return;
        }
        api.logger?.info?.("Haco reply delivered for OpenClaw agent " + String(agentId));
      } catch (error) {
        api.logger?.warn?.("Haco delivery failed: " + (error instanceof Error ? error.message : String(error)));
      }
    }, { timeoutMs: 30000 });
  }
};
