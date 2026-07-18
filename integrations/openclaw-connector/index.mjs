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
    const encoded = sessionKey.slice(prefix.length).replace(/-/g, "+").replace(/_/g, "/");
    const padded = encoded + "=".repeat((4 - encoded.length % 4) % 4);
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
      const sessionKey = context?.sessionKey ?? event?.context?.sessionKey ?? event?.sessionKey;
      const route = decodeRoute(sessionKey);
      if (!route?.conversation_id) return;
      const config = event?.context?.pluginConfig ?? context?.pluginConfig ?? {};
      const agentId = context?.agentId ?? event?.context?.agentId ?? event?.agentId;
      const principalId = config.principalMap?.[agentId];
      if (!principalId || !config.hacoUrl || !config.token) return;
      const messages = Array.isArray(event?.messages) ? event.messages : [];
      const final = [...messages].reverse().find((message) => message?.role === "assistant");
      const body = textFromMessage(final);
      if (!body) return;
      const endpoint = String(config.hacoUrl).replace(/\/$/, "") + "/api/integrations/openclaw/events";
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
        api.logger.warn("Haco delivery failed (" + response.status + "): " + await response.text());
      }
    }, { timeoutMs: 30000 });
  }
};
