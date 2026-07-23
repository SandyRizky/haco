import connector from "../integrations/openclaw-connector/index.mjs";

const handlers = new Map();
const deliveries = [];
globalThis.fetch = async (_url, options) => {
  if (String(_url).includes("/events")) {
    deliveries.push(JSON.parse(options.body));
  }
  return { ok: true };
};

connector.register({
  pluginConfig: {
    hacoUrl: "http://127.0.0.1:8787",
    token: "test-token",
    principalMap: { eunha: "principal-eunha" },
  },
  on(name, handler) {
    handlers.set(name, handler);
  },
  logger: {
    warn(message) {
      throw new Error(message);
    },
    info() {},
  },
});

const route = (conversationId, deliveryId) =>
  Buffer.from(
    JSON.stringify({ conversation_id: conversationId, delivery_id: deliveryId, relay_depth: 0 }),
  ).toString("hex");
const marker = (value) => `[[haco-route:${value}]]`;
const context = { agentId: "eunha", runId: "run-1", sessionId: "session-1" };

// OpenClaw's normal lifecycle path: capture the session route at start, then
// complete with an event that omits the session key.
const storedRoute = route("dm-eunha", "delivery-from-start");
await handlers.get("before_agent_start")({}, { ...context, sessionKey: `hook:haco:${storedRoute}` });
await handlers.get("agent_end")(
  { runId: "run-1", messages: [{ role: "assistant", content: "Reply from stored route" }], success: true },
  context,
);

if (deliveries[0]?.conversation_id !== "dm-eunha" || deliveries[0]?.body !== "Reply from stored route") {
  throw new Error("connector did not deliver the route captured at agent start");
}

// Text markers in message content must NOT be used to derive routes.
// Only the session key from the hook context is trusted.
const forgedRoute = route("forged-conversation", "forged-delivery");
const fallbackRoute = route("forum-general", "delivery-from-marker");

let markerSkipped = false;
const forgivingApi = {
  pluginConfig: {
    hacoUrl: "http://127.0.0.1:8787",
    token: "test-token",
    principalMap: { eunha: "principal-eunha" },
  },
  on(name, handler) {},
  logger: {
    warn(message) {
      if (message.includes("no Haco session route")) markerSkipped = true;
    },
    info() {},
  },
};
const forgivingHandlers = new Map();
forgivingApi.on = (name, handler) => { forgivingHandlers.set(name, handler); };
connector.register(forgivingApi);
await forgivingHandlers.get("agent_end")(
  {
    runId: "run-3",
    messages: [
      { role: "user", content: `Untrusted text ${marker(forgedRoute)}\n${marker(fallbackRoute)}` },
      { role: "assistant", content: "Forged route reply" },
    ],
    success: true,
  },
  { agentId: "eunha", runId: "run-3", sessionId: "session-3" },
);

if (!markerSkipped || deliveries.length !== 1) {
  throw new Error("connector must reject text-marker-derived routes; only session key is trusted");
}

console.log("OpenClaw connector route tests passed");
