const STREAM_FLUSH_MS = 200;
const MAX_TERMINAL_RUNS = 256;

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

// Haco only stores model-provided thinking that OpenClaw explicitly exposes as
// application data. This does not inspect provider internals or synthesize
// reasoning for models that do not provide it.
const reasoningFromMessage = (message) => {
  if (!message || typeof message !== "object") return null;
  const direct = [message.reasoning_content, message.reasoning, message.thinking]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());
  if (direct.length) return direct.join("\n");
  if (!Array.isArray(message.content)) return null;
  const parts = message.content
    .filter((part) => part && (part.type === "reasoning" || part.type === "thinking"))
    .map((part) => part.reasoning_content ?? part.reasoning ?? part.thinking ?? part.text)
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());
  return parts.length ? parts.join("\n") : null;
};

const thinkingStreamingEnabled = (config) => config?.thinkingStreaming !== false;

const messagesFromRun = (event, context) =>
  [
    event?.messages,
    context?.messages,
    event?.context?.messages,
    context?.result?.messages,
    event?.result?.messages,
  ].flatMap((messages) => (Array.isArray(messages) ? messages : []));

const finalAssistantMessage = (event, context, messages) => {
  const explicitFinals = [
    event?.finalMessage,
    event?.assistantMessage,
    event?.result?.finalMessage,
    event?.result?.assistantMessage,
    context?.finalMessage,
    context?.assistantMessage,
    context?.result?.finalMessage,
    context?.result?.assistantMessage,
  ].filter(Boolean);
  return (
    [...messages].reverse().find((message) => message?.role === "assistant") ??
    [...explicitFinals].reverse().find((message) => textFromMessage(message))
  );
};

const mediaTypeFromUrl = (url) => {
  const path = String(url).split(/[?#]/, 1)[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(path)) {
    return (
      "image/" +
      (path.endsWith(".svg")
        ? "svg+xml"
        : path.match(/\.([a-z0-9]+)$/)?.[1]?.replace("jpg", "jpeg"))
    );
  }
  if (/\.(mp4|webm|mov)$/.test(path)) {
    return "video/" + (path.endsWith(".mov") ? "quicktime" : path.match(/\.([a-z0-9]+)$/)?.[1]);
  }
  if (/\.(mp3|wav|ogg|m4a|flac)$/.test(path)) {
    return "audio/" + (path.match(/\.([a-z0-9]+)$/)?.[1] || "mpeg");
  }
  if (/\.pdf$/i.test(path)) return "application/pdf";
  if (/\.(zip|tar|gz|tgz|rar|7z)$/i.test(path)) {
    return "application/" + (path.match(/\.([a-z0-9]+)$/)?.[1] || "zip");
  }
  if (/\.(doc|docx)$/i.test(path)) return "application/msword";
  if (/\.(xls|xlsx)$/i.test(path)) return "application/vnd.ms-excel";
  if (/\.csv$/i.test(path)) return "text/csv";
  if (/\.json$/i.test(path)) return "application/json";
  return "application/octet-stream";
};

const attachmentsFromMessage = async (message) => {
  const candidates = [];
  if (typeof message?.mediaUrl === "string") candidates.push(message.mediaUrl);
  if (Array.isArray(message?.mediaUrls)) candidates.push(...message.mediaUrls);
  for (const part of Array.isArray(message?.content) ? message.content : []) {
    const value = part?.url ?? part?.mediaUrl ?? part?.path ?? part?.filePath ?? part?.source?.url;
    if (typeof value === "string") candidates.push(value);
  }
  return [...new Set(candidates.filter((value) => /^https?:\/\//i.test(value)))].map((url, index) => {
    let fileName = "agent-attachment-" + (index + 1);
    try {
      fileName = decodeURIComponent(new URL(url).pathname.split("/").pop()) || fileName;
    } catch {}
    return {
      id: crypto.randomUUID(),
      file_name: fileName,
      media_type: mediaTypeFromUrl(url),
      byte_size: 0,
      url,
    };
  });
};

const responseText = async (response) => {
  try {
    return typeof response?.text === "function" ? await response.text() : "";
  } catch {
    return "";
  }
};

const errorText = (error) => (error instanceof Error ? error.message : String(error));

// Intermediate updates are deliberately best-effort. Terminal updates pass
// required: true so the caller records a prominent warning instead of hiding a
// failed completion transition.
const postRunUpdate = async (hacoUrl, token, runId, payload, options = {}) => {
  const { required = false, logger } = options;
  try {
    if (!hacoUrl || !token || !runId) {
      throw new Error("Haco run update skipped: connector configuration is incomplete.");
    }
    const response = await fetch(
      String(hacoUrl).replace(/\/$/, "") + "/api/integrations/openclaw/runs/" + encodeURIComponent(runId),
      {
        method: "POST",
        headers: { authorization: "Bearer " + token, "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response?.ok) {
      const detail = await responseText(response);
      throw new Error("Haco run update failed (" + String(response?.status ?? 0) + "): " + detail);
    }
    return true;
  } catch (error) {
    if (required) throw error;
    logger?.warn?.("Haco run update skipped: " + errorText(error));
    return false;
  }
};

const deliverWithRetry = async (endpoint, token, payload) => {
  const delays = [0, 500, 1500, 3500];
  let lastError;
  for (const delay of delays) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { authorization: "Bearer " + token, "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      lastError = error;
      continue;
    }
    if (response?.ok) return;

    const status = Number(response?.status) || 0;
    const detail = await responseText(response);
    lastError = new Error("Haco delivery failed (" + status + "): " + detail);
    if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
      throw lastError;
    }
  }
  throw lastError ?? new Error("Haco delivery failed");
};

const decodeRoute = (sessionKey) => {
  const prefix = "hook:haco:";
  if (typeof sessionKey !== "string" || !sessionKey.startsWith(prefix)) return null;
  try {
    const encoded = sessionKey.slice(prefix.length);
    const decoded =
      /^[0-9a-f]+$/i.test(encoded) && encoded.length % 2 === 0
        ? Buffer.from(encoded, "hex").toString("utf8")
        : Buffer.from(
            encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (encoded.length % 4)) % 4),
            "base64",
          ).toString("utf8");
    const route = JSON.parse(decoded);
    return route && typeof route === "object" && !Array.isArray(route) ? route : null;
  } catch {
    return null;
  }
};

const configFor = (api, event, context) =>
  context?.pluginConfig ?? event?.context?.pluginConfig ?? api.pluginConfig ?? {};

const agentIdFor = (event, context) =>
  context?.agentId ??
  context?.agent?.id ??
  event?.context?.agentId ??
  event?.agentId ??
  event?.agent?.id;

const toolNameFor = (event) =>
  typeof event?.toolName === "string" && event.toolName.trim() ? event.toolName.trim() : "tool";

const toolErrorFor = (event) => {
  const error = event?.error;
  if (!error) return "";
  const value = typeof error === "string" ? error : error?.message ?? String(error);
  return String(value).trim().slice(0, 160);
};

export default {
  id: "haco-connector",
  name: "Haco Connector",
  description: "Routes OpenClaw results back to Haco.",
  register(api) {
    const routes = new Map();
    const runStreams = new Map();
    const terminalRuns = new Map();

    const routeKeys = (event, context) =>
      [
        context?.runId,
        event?.runId,
        event?.context?.runId,
        context?.sessionId,
        event?.sessionId,
        event?.context?.sessionId,
      ].filter((value) => typeof value === "string" && value.length > 0);

    const sessionRoute = (event, context) =>
      decodeRoute(
        context?.sessionKey ??
          context?.session?.key ??
          event?.sessionKey ??
          event?.session?.key ??
          event?.context?.sessionKey,
      );

    const rememberRoute = (event, context) => {
      const route = sessionRoute(event, context);
      if (typeof route?.conversation_id === "string" && route.conversation_id) {
        for (const key of routeKeys(event, context)) routes.set(key, route);
        return route;
      }
      return null;
    };

    const routeFor = (event, context) =>
      rememberRoute(event, context) ?? routeKeys(event, context).map((key) => routes.get(key)).find(Boolean);

    const forgetRoute = (event, context, knownRoute) => {
      for (const key of routeKeys(event, context)) routes.delete(key);
      if (knownRoute) {
        for (const [key, route] of routes) {
          if (route === knownRoute) routes.delete(key);
        }
      }
    };

    const streamFor = (runId) => {
      let stream = runStreams.get(runId);
      if (!stream) {
        stream = {
          sequence: 0,
          reasoningBuffer: "",
          thinkingContent: "",
          pendingActivity: null,
          lastActivity: "",
          lastFlushAt: 0,
          flushTimer: null,
          queue: Promise.resolve(),
          terminal: false,
        };
        runStreams.set(runId, stream);
      }
      return stream;
    };

    const nextSequence = (runId) => {
      const stream = streamFor(runId);
      stream.sequence += 1;
      return stream.sequence;
    };

    const enqueueRunUpdate = (config, runId, payload, options = {}) => {
      const stream = streamFor(runId);
      const queued = stream.queue
        .catch(() => undefined)
        .then(() =>
          postRunUpdate(config?.hacoUrl, config?.token, runId, payload, {
            required: options.required === true,
            logger: api.logger,
          }),
        );
      stream.queue = queued;
      return queued;
    };

    const flushRunStream = async (config, runId) => {
      if (!runId) return;
      const stream = streamFor(runId);
      if (stream.flushTimer) {
        clearTimeout(stream.flushTimer);
        stream.flushTimer = null;
      }

      const reasoning = stream.reasoningBuffer;
      const activity = stream.pendingActivity;
      stream.reasoningBuffer = "";
      stream.pendingActivity = null;
      if (!reasoning && (!activity || activity === stream.lastActivity)) return stream.queue;

      stream.lastFlushAt = Date.now();
      if (reasoning) {
        await enqueueRunUpdate(config, runId, {
          status: "running",
          reasoning_content: reasoning,
          content_mode: "delta",
          sequence: nextSequence(runId),
          done: false,
        });
      }
      if (activity && activity !== stream.lastActivity) {
        stream.lastActivity = activity;
        await enqueueRunUpdate(config, runId, {
          status: "running",
          activity_summary: activity,
          sequence: nextSequence(runId),
          done: false,
        });
      }
      return stream.queue;
    };

    const scheduleRunFlush = (config, runId) => {
      const stream = streamFor(runId);
      if (stream.flushTimer || stream.terminal) return;
      const delay = Math.max(0, STREAM_FLUSH_MS - (Date.now() - stream.lastFlushAt));
      stream.flushTimer = setTimeout(() => {
        stream.flushTimer = null;
        void flushRunStream(config, runId);
      }, delay);
      stream.flushTimer.unref?.();
    };

    const queueActivity = async (config, runId, activity, options = {}) => {
      if (!runId || !activity) return;
      const stream = streamFor(runId);
      if (stream.terminal) return;
      if (options.immediate && stream.pendingActivity && stream.pendingActivity !== activity) {
        await flushRunStream(config, runId);
      }
      stream.pendingActivity = activity;
      if (options.immediate) return flushRunStream(config, runId);
      scheduleRunFlush(config, runId);
    };

    // `llm_output` contains one completed model attempt. A tool-using agent can
    // produce several attempts, so retain each distinct explicit thinking block
    // in run order. If a runtime reports a cumulative snapshot, append only its
    // new suffix instead of duplicating the previous block.
    const mergeThinkingSnapshot = (stream, thinking) => {
      const next = typeof thinking === "string" ? thinking.trim() : "";
      if (!next) return "";
      const current = stream.thinkingContent;
      if (!current) {
        stream.thinkingContent = next;
        return next;
      }
      if (current === next || current.startsWith(next) || current.endsWith(next)) return "";
      if (next.startsWith(current)) {
        const delta = next.slice(current.length);
        stream.thinkingContent = next;
        return delta;
      }
      const delta = "\n\n" + next;
      stream.thinkingContent = current + delta;
      return delta;
    };

    const queueThinkingSnapshot = async (config, runId, thinking) => {
      if (!runId) return;
      const stream = streamFor(runId);
      if (stream.terminal) return;
      const hadThinking = Boolean(stream.thinkingContent);
      const delta = mergeThinkingSnapshot(stream, thinking);
      if (!delta) return;
      stream.reasoningBuffer += delta;
      if (!hadThinking) return flushRunStream(config, runId);
      scheduleRunFlush(config, runId);
    };

    const flushFinalReasoning = async (config, runId, reasoning) => {
      if (!runId) return;
      const stream = streamFor(runId);
      const delta = mergeThinkingSnapshot(stream, reasoning);
      if (delta) stream.reasoningBuffer += delta;
      await flushRunStream(config, runId);
      if (!stream.thinkingContent) return;
      await enqueueRunUpdate(config, runId, {
        status: "running",
        reasoning_content: stream.thinkingContent,
        content_mode: "snapshot",
        sequence: nextSequence(runId),
        done: false,
      });
    };

    const finishRun = async (config, runId, status, error) => {
      if (!runId) return;
      const stream = streamFor(runId);
      stream.terminal = true;
      await flushRunStream(config, runId);
      await stream.queue.catch(() => undefined);
      return enqueueRunUpdate(
        config,
        runId,
        {
          status,
          error: error ?? null,
          sequence: nextSequence(runId),
          done: true,
        },
        { required: true },
      );
    };

    const forgetRun = (runId) => {
      const stream = runStreams.get(runId);
      if (stream?.flushTimer) clearTimeout(stream.flushTimer);
      runStreams.delete(runId);
    };

    const rememberTerminal = (key, completion) => {
      terminalRuns.set(key, completion);
      while (terminalRuns.size > MAX_TERMINAL_RUNS) {
        terminalRuns.delete(terminalRuns.keys().next().value);
      }
    };

    // OpenClaw retains this legacy hook as a compatibility path. It only records
    // the trusted session route; live progress starts at before_agent_run.
    api.on(
      "before_agent_start",
      (event, context) => {
        rememberRoute(event, context);
      },
      { timeoutMs: 5000 },
    );

    api.on(
      "before_agent_run",
      async (event, context) => {
        const route = routeFor(event, context);
        const runId = route?.run_id;
        const config = configFor(api, event, context);
        if (runId && config?.hacoUrl && config?.token) {
          // Coalesce start-of-run activity in the current tick. Tool lifecycle
          // events flush immediately, while any future supported progress source
          // uses the same 200 ms stream throttle.
          await queueActivity(config, runId, "Agent is working…");
        }
      },
      { timeoutMs: 5000 },
    );

    api.on(
      "before_tool_call",
      async (event, context) => {
        const route = routeFor(event, context);
        const runId = route?.run_id;
        if (!runId) return;
        await queueActivity(configFor(api, event, context), runId, "Using " + toolNameFor(event) + "…", {
          immediate: true,
        });
      },
      { timeoutMs: 5000 },
    );

    api.on(
      "after_tool_call",
      async (event, context) => {
        const route = routeFor(event, context);
        const runId = route?.run_id;
        if (!runId) return;
        const toolName = toolNameFor(event);
        const toolError = toolErrorFor(event);
        await queueActivity(
          configFor(api, event, context),
          runId,
          toolError ? toolName + " failed: " + toolError : "Finished " + toolName,
          { immediate: true },
        );
      },
      { timeoutMs: 5000 },
    );

    // OpenClaw only invokes this hook when the active model attempt has an
    // output. Models that do not expose structured thinking simply produce no
    // Haco update, leaving the normal activity stream unchanged.
    api.on(
      "llm_output",
      async (event, context) => {
        const config = configFor(api, event, context);
        if (!thinkingStreamingEnabled(config)) return;
        const route = routeFor(event, context);
        const runId = route?.run_id;
        const thinking = reasoningFromMessage(event?.lastAssistant);
        if (!runId || !thinking) return;
        await queueThinkingSnapshot(config, runId, thinking);
      },
      { timeoutMs: 5000 },
    );

    const completeAgentEnd = async (event, context, route) => {
      const config = configFor(api, event, context);
      const runId = typeof route?.run_id === "string" && route.run_id ? route.run_id : null;
      const agentId = agentIdFor(event, context);
      const principalId = typeof agentId === "string" ? config?.principalMap?.[agentId] : null;
      const canPostRunUpdate = Boolean(config?.hacoUrl && config?.token);
      let terminalStatus = event?.success === false ? "failed" : "completed";
      let terminalError =
        event?.success === false ? String(event?.error || "OpenClaw agent run failed") : null;

      try {
        if (!config?.hacoUrl || !config?.token || !config?.principalMap || !principalId) {
          terminalStatus = "delivery_failed";
          terminalError = !config?.hacoUrl || !config?.token || !config?.principalMap
            ? "connector configuration is incomplete"
            : "OpenClaw agent is not mapped (" + String(agentId ?? "unknown") + ")";
          api.logger?.warn?.("Haco reply skipped: " + terminalError + ".");
          return;
        }

        const messages = messagesFromRun(event, context);
        const final = finalAssistantMessage(event, context, messages);
        const body = textFromMessage(final);
        const reasoning = reasoningFromMessage(final);
        const attachments = await attachmentsFromMessage(final);
        let deliveredThinking = reasoning;

        if (!body && !attachments.length) {
          terminalStatus = "failed";
          terminalError = "the completed agent run has no assistant text";
          api.logger?.warn?.("Haco reply skipped: " + terminalError + ".");
          return;
        }

        if (runId) {
          await flushFinalReasoning(config, runId, reasoning);
          deliveredThinking = streamFor(runId).thinkingContent || reasoning;
        }

        const endpoint = String(config.hacoUrl).replace(/\/$/, "") + "/api/integrations/openclaw/events";
        const deliveryId =
          typeof route?.delivery_id === "string" && route.delivery_id.trim()
            ? route.delivery_id
            : undefined;
        await deliverWithRetry(endpoint, config.token, {
          agent_id: principalId,
          conversation_id: route.conversation_id,
          parent_message_id: route.parent_message_id ?? null,
          body: body || "Shared an attachment.",
          reasoning: deliveredThinking,
          activity: {
            status: event?.success === false ? "failed" : "completed",
            summary:
              event?.success === false
                ? "OpenClaw agent run failed."
                : "Completed an OpenClaw task requested from Haco.",
            tool_name: "openclaw.agent",
          },
          attachments,
          ...(deliveryId ? { delivery_id: deliveryId } : {}),
          test_id: route.test_id ?? null,
          relay_depth: Number(route.relay_depth || 0) + 1,
        });
        api.logger?.info?.("Haco reply delivered for OpenClaw agent " + String(agentId));
      } catch (error) {
        terminalStatus = "delivery_failed";
        terminalError = errorText(error);
        api.logger?.warn?.("Haco delivery failed: " + terminalError);
      } finally {
        if (runId && canPostRunUpdate) {
          try {
            await finishRun(config, runId, terminalStatus, terminalError);
          } catch (error) {
            api.logger?.warn?.(
              "Haco terminal run update failed for " + runId + ": " + errorText(error),
            );
          }
        } else if (runId) {
          api.logger?.warn?.("Haco terminal run update skipped: connector configuration is incomplete.");
        }
        if (runId) forgetRun(runId);
        forgetRoute(event, context, route);
      }
    };

    api.on(
      "agent_end",
      async (event, context) => {
        const route = routeFor(event, context);
        if (!route?.conversation_id) {
          forgetRoute(event, context);
          api.logger?.warn?.("Haco reply skipped: the agent run has no Haco session route.");
          return;
        }

        const terminalKey =
          (typeof route.run_id === "string" && route.run_id) ||
          (typeof route.delivery_id === "string" && route.delivery_id
            ? "delivery:" + route.delivery_id
            : null);
        if (terminalKey && terminalRuns.has(terminalKey)) {
          return terminalRuns.get(terminalKey);
        }

        const completion = completeAgentEnd(event, context, route);
        if (terminalKey) rememberTerminal(terminalKey, completion);
        return completion;
      },
      { timeoutMs: 30000 },
    );

    // before_agent_start is retained only for legacy route capture. Live Haco
    // updates use documented lifecycle hooks plus llm_output for explicit,
    // model-provided thinking. Models without structured thinking fall back to
    // activity updates and any final summary already present on agent_end.
  },
};
