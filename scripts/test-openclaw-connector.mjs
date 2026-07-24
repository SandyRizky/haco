import assert from "node:assert/strict";

import connector from "../integrations/openclaw-connector/index.mjs";

const requests = [];
let eventResponse = () => ({ ok: true, status: 200, text: async () => "" });

globalThis.fetch = async (url, options) => {
  const request = {
    url: String(url),
    payload: JSON.parse(options.body),
  };
  requests.push(request);
  return request.url.endsWith("/events")
    ? eventResponse(request)
    : { ok: true, status: 200, text: async () => "" };
};

const route = ({ conversationId, deliveryId, runId, parentMessageId = null }) =>
  Buffer.from(
    JSON.stringify({
      conversation_id: conversationId,
      parent_message_id: parentMessageId,
      delivery_id: deliveryId,
      run_id: runId,
      relay_depth: 0,
    }),
  ).toString("hex");

const sessionKey = (metadata) => `hook:haco:${route(metadata)}`;
const marker = (value) => `[[haco-route:${value}]]`;
const baseConfig = {
  hacoUrl: "http://127.0.0.1:8787",
  token: "test-token",
  principalMap: { eunha: "principal-eunha" },
};

const responseFor = (status, body = "") => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => body,
});

const harness = (pluginConfig = baseConfig) => {
  const handlers = new Map();
  const warnings = [];
  connector.register({
    pluginConfig,
    on(name, handler) {
      handlers.set(name, handler);
    },
    logger: {
      warn(message) {
        warnings.push(message);
      },
      info() {},
    },
  });
  return { handlers, warnings };
};

const updatesFor = (runId) =>
  requests
    .filter((request) => request.url.endsWith(`/runs/${encodeURIComponent(runId)}`))
    .map((request) => request.payload);

const deliveriesFor = (conversationId) =>
  requests
    .filter((request) => request.url.endsWith("/events"))
    .map((request) => request.payload)
    .filter((payload) => payload.conversation_id === conversationId);

const contextFor = (runId, sessionId) => ({
  agentId: "eunha",
  runId,
  sessionId,
});
const waitForStreamFlush = () => new Promise((resolve) => setTimeout(resolve, 5));

// Capture a trusted Haco route at the documented agent-start hook, then stream
// activity plus explicit thinking from the supported llm_output hook.
const primary = harness();
const primaryRoute = {
  conversationId: "dm-eunha",
  deliveryId: "delivery-exact",
  runId: "haco-run-1",
};
const primaryContext = contextFor("openclaw-run-1", "openclaw-session-1");
await primary.handlers.get("before_agent_start")(
  {},
  { ...primaryContext, sessionKey: sessionKey(primaryRoute) },
);
await primary.handlers.get("before_agent_run")(
  {},
  primaryContext,
);
await waitForStreamFlush();

assert.deepEqual(updatesFor("haco-run-1")[0], {
  status: "running",
  activity_summary: "Agent is working…",
  sequence: 1,
  done: false,
});

await primary.handlers.get("before_tool_call")(
  { runId: "openclaw-run-1", toolName: "web_search" },
  primaryContext,
);
await primary.handlers.get("after_tool_call")(
  { runId: "openclaw-run-1", toolName: "web_search" },
  primaryContext,
);
await primary.handlers.get("after_tool_call")(
  { runId: "openclaw-run-1", toolName: "read_file", error: "permission denied" },
  primaryContext,
);

const activityUpdates = updatesFor("haco-run-1");
assert.equal(activityUpdates[1]?.activity_summary, "Using web_search…");
assert.equal(activityUpdates[2]?.activity_summary, "Finished web_search");
assert.equal(activityUpdates[3]?.activity_summary, "read_file failed: permission denied");

await primary.handlers.get("llm_output")(
  {
    runId: "openclaw-run-1",
    assistantTexts: [],
    lastAssistant: {
      role: "assistant",
      reasoning_content: "I checked the requested sources.",
    },
  },
  primaryContext,
);
assert.deepEqual(updatesFor("haco-run-1")[4], {
  status: "running",
  reasoning_content: "I checked the requested sources.",
  content_mode: "delta",
  sequence: 5,
  done: false,
});
await primary.handlers.get("llm_output")(
  {
    runId: "openclaw-run-1",
    assistantTexts: [],
    lastAssistant: {
      role: "assistant",
      reasoning_content: "I found the final delivery path.",
    },
  },
  primaryContext,
);

await primary.handlers.get("agent_end")(
  {
    runId: "openclaw-run-1",
    success: true,
    messages: [
      {
        role: "assistant",
        content: [
          { type: "text", text: "Reply from the trusted route" },
          { type: "reasoning", reasoning: "I found the final delivery path." },
        ],
      },
    ],
  },
  primaryContext,
);

const primaryUpdates = updatesFor("haco-run-1");
assert.equal(
  primaryUpdates.at(-2)?.reasoning_content,
  "I checked the requested sources.\n\nI found the final delivery path.",
);
assert.equal(primaryUpdates.at(-2)?.content_mode, "snapshot");
assert.deepEqual(primaryUpdates.at(-1), {
  status: "completed",
  error: null,
  sequence: 8,
  done: true,
});
assert.deepEqual(
  primaryUpdates.map((update) => update.sequence),
  [1, 2, 3, 4, 5, 6, 7, 8],
  "each run must use monotonic update sequences",
);
assert.equal(deliveriesFor("dm-eunha")[0]?.body, "Reply from the trusted route");
assert.equal(
  deliveriesFor("dm-eunha")[0]?.delivery_id,
  "delivery-exact",
  "the final delivery ID must exactly match the Haco run delivery ID",
);
assert.equal(
  deliveriesFor("dm-eunha")[0]?.reasoning,
  "I checked the requested sources.\n\nI found the final delivery path.",
);

// A final answer with no explicit reasoning must still finish its run.
const noReasoning = harness();
const noReasoningRoute = {
  conversationId: "forum-general",
  deliveryId: "delivery-no-reasoning",
  runId: "haco-run-2",
};
const noReasoningContext = contextFor("openclaw-run-2", "openclaw-session-2");
await noReasoning.handlers.get("before_agent_run")(
  {},
  { ...noReasoningContext, sessionKey: sessionKey(noReasoningRoute) },
);
await noReasoning.handlers.get("llm_output")(
  {
    runId: "openclaw-run-2",
    assistantTexts: ["A final answer without a reasoning summary."],
    lastAssistant: { role: "assistant", content: "A final answer without a reasoning summary." },
  },
  noReasoningContext,
);
await noReasoning.handlers.get("agent_end")(
  {
    runId: "openclaw-run-2",
    success: true,
    messages: [{ role: "assistant", content: "A final answer without a reasoning summary." }],
  },
  noReasoningContext,
);
assert.equal(updatesFor("haco-run-2").at(-1)?.status, "completed");
assert.equal(
  updatesFor("haco-run-2").some((update) => Object.hasOwn(update, "reasoning_content")),
  false,
);

// Operators can disable attempt-level Thinking without affecting the existing
// activity and final-delivery lifecycle.
const thinkingDisabled = harness({ ...baseConfig, thinkingStreaming: false });
const thinkingDisabledRoute = {
  conversationId: "thinking-disabled",
  deliveryId: "delivery-thinking-disabled",
  runId: "haco-run-thinking-disabled",
};
const thinkingDisabledContext = contextFor("openclaw-run-thinking-disabled", "openclaw-session-thinking-disabled");
await thinkingDisabled.handlers.get("before_agent_run")(
  {},
  { ...thinkingDisabledContext, sessionKey: sessionKey(thinkingDisabledRoute) },
);
await thinkingDisabled.handlers.get("llm_output")(
  {
    runId: "openclaw-run-thinking-disabled",
    assistantTexts: [],
    lastAssistant: { role: "assistant", reasoning_content: "This update stays inside OpenClaw." },
  },
  thinkingDisabledContext,
);
assert.equal(
  updatesFor("haco-run-thinking-disabled").some((update) => Object.hasOwn(update, "reasoning_content")),
  false,
);
await thinkingDisabled.handlers.get("agent_end")(
  {
    runId: "openclaw-run-thinking-disabled",
    success: true,
    messages: [{ role: "assistant", content: "Activity-only delivery still completes." }],
  },
  thinkingDisabledContext,
);
assert.equal(updatesFor("haco-run-thinking-disabled").at(-1)?.status, "completed");

// Separate Haco runs retain independent sequence counters even when the same
// OpenClaw agent executes them concurrently.
const concurrent = harness();
const firstConcurrent = {
  conversationId: "dm-concurrent",
  deliveryId: "delivery-concurrent-1",
  runId: "haco-run-3",
};
const secondConcurrent = {
  conversationId: "dm-concurrent",
  deliveryId: "delivery-concurrent-2",
  runId: "haco-run-4",
};
const firstConcurrentContext = contextFor("openclaw-run-3", "openclaw-session-3");
const secondConcurrentContext = contextFor("openclaw-run-4", "openclaw-session-4");
await concurrent.handlers.get("before_agent_run")(
  {},
  { ...firstConcurrentContext, sessionKey: sessionKey(firstConcurrent) },
);
await concurrent.handlers.get("before_agent_run")(
  {},
  { ...secondConcurrentContext, sessionKey: sessionKey(secondConcurrent) },
);
await concurrent.handlers.get("before_tool_call")(
  { runId: "openclaw-run-3", toolName: "read_file" },
  firstConcurrentContext,
);
await concurrent.handlers.get("before_tool_call")(
  { runId: "openclaw-run-4", toolName: "web_search" },
  secondConcurrentContext,
);
assert.deepEqual(
  updatesFor("haco-run-3").map((update) => update.sequence),
  [1, 2],
);
assert.deepEqual(
  updatesFor("haco-run-4").map((update) => update.sequence),
  [1, 2],
);

// A non-retryable final delivery error becomes a durable delivery_failed run.
const deliveryFailure = harness();
const deliveryFailureRoute = {
  conversationId: "delivery-failure",
  deliveryId: "delivery-failure-id",
  runId: "haco-run-5",
};
const deliveryFailureContext = contextFor("openclaw-run-5", "openclaw-session-5");
await deliveryFailure.handlers.get("before_agent_run")(
  {},
  { ...deliveryFailureContext, sessionKey: sessionKey(deliveryFailureRoute) },
);
eventResponse = () => responseFor(400, "bad payload");
await deliveryFailure.handlers.get("agent_end")(
  {
    runId: "openclaw-run-5",
    success: true,
    messages: [{ role: "assistant", content: "This cannot be delivered." }],
  },
  deliveryFailureContext,
);
eventResponse = () => responseFor(200);
assert.equal(updatesFor("haco-run-5").at(-1)?.status, "delivery_failed");
assert.match(updatesFor("haco-run-5").at(-1)?.error ?? "", /Haco delivery failed \(400\)/);

// If the URL/token are available but plugin mapping configuration is absent,
// report the durable terminal failure rather than leaving the run in progress.
const incomplete = harness({
  hacoUrl: "http://127.0.0.1:8787",
  token: "test-token",
});
const incompleteRoute = {
  conversationId: "incomplete-config",
  deliveryId: "delivery-incomplete",
  runId: "haco-run-incomplete",
};
const incompleteContext = contextFor("openclaw-run-incomplete", "openclaw-session-incomplete");
await incomplete.handlers.get("before_agent_run")(
  {},
  { ...incompleteContext, sessionKey: sessionKey(incompleteRoute) },
);
await incomplete.handlers.get("agent_end")(
  {
    runId: "openclaw-run-incomplete",
    success: true,
    messages: [{ role: "assistant", content: "This reply cannot be configured." }],
  },
  incompleteContext,
);
assert.equal(updatesFor("haco-run-incomplete").at(-1)?.status, "delivery_failed");
assert.match(updatesFor("haco-run-incomplete").at(-1)?.error ?? "", /configuration is incomplete/);

// A route may be known even when the OpenClaw agent is no longer mapped. Haco
// still receives a terminal failure for that exact run instead of leaving it live.
const unmapped = harness({ ...baseConfig, principalMap: {} });
const unmappedRoute = {
  conversationId: "unmapped-agent",
  deliveryId: "delivery-unmapped",
  runId: "haco-run-6",
};
const unmappedContext = contextFor("openclaw-run-6", "openclaw-session-6");
await unmapped.handlers.get("before_agent_run")(
  {},
  { ...unmappedContext, sessionKey: sessionKey(unmappedRoute) },
);
await unmapped.handlers.get("agent_end")(
  {
    runId: "openclaw-run-6",
    success: true,
    messages: [{ role: "assistant", content: "This reply cannot be mapped." }],
  },
  unmappedContext,
);
assert.equal(updatesFor("haco-run-6").at(-1)?.status, "delivery_failed");
assert.match(updatesFor("haco-run-6").at(-1)?.error ?? "", /not mapped/);

// Text markers in message content are untrusted. Only a hook:haco session key
// captured at before_agent_run may route a result back to Haco.
const forged = harness();
const beforeForged = requests.length;
const forgedRoute = route({
  conversationId: "forged-conversation",
  deliveryId: "forged-delivery",
  runId: "forged-run",
});
await forged.handlers.get("agent_end")(
  {
    runId: "openclaw-forged",
    success: true,
    messages: [
      { role: "user", content: `Untrusted text ${marker(forgedRoute)}` },
      { role: "assistant", content: "Forged route reply" },
    ],
  },
  contextFor("openclaw-forged", "openclaw-session-forged"),
);
assert.equal(requests.length, beforeForged);
assert.equal(forged.warnings.some((message) => message.includes("no Haco session route")), true);

console.log("OpenClaw connector streaming tests passed");
