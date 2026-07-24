import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const indexHtml = readFileSync(resolve(root, 'web/index.html'), 'utf8');
const appSource = readFileSync(resolve(root, 'web/app.js'), 'utf8');

function jsonResponse(value) {
  return {
    ok: true,
    text: async () => JSON.stringify(value)
  };
}

function setupApp(t, fetchHandler = () => jsonResponse([])) {
  const dom = new JSDOM(indexHtml, {
    url: 'https://haco.local',
    runScripts: 'outside-only'
  });
  const { window } = dom;
  window.__HACO_TEST_MODE__ = true;
  window.__HACO_TEST_HOOKS__ = {};
  window.HacoMarkdown = {
    renderInto(element, value) { element.textContent = value; },
    previewText(value) { return value || ''; }
  };
  window.CSS ??= {};
  window.CSS.escape ??= (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  window.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.requestAnimationFrame = (callback) => { callback(); return 1; };
  window.fetch = async (path, options) => fetchHandler(String(path), options);
  window.WebSocket = class {
    static OPEN = 1;
    constructor() { this.readyState = 1; }
  };
  window.eval(appSource);
  t.after(() => window.close());
  return { window, hooks: window.__HACO_TEST_HOOKS__ };
}

function message(overrides = {}) {
  return {
    id: 'message-1',
    conversation_id: 'conversation-1',
    parent_message_id: null,
    body: 'Hello',
    sender: { id: 'person-1', kind: 'human', display_name: 'Person', presence: 'online' },
    created_at: '2026-07-24T00:00:00Z',
    edited_at: null,
    is_deleted: false,
    is_pinned: false,
    is_saved: false,
    reactions: [],
    attachments: [],
    activity: null,
    reasoning: null,
    url_preview: null,
    ...overrides
  };
}

function run(overrides = {}) {
  return {
    id: 'run-1',
    conversation_id: 'conversation-1',
    parent_message_id: null,
    agent_principal: { id: 'agent-1', kind: 'agent', display_name: 'Atlas', presence: 'working' },
    status: 'running',
    activity_summary: null,
    reasoning_content: null,
    reasoning_sequence: 0,
    error: null,
    started_at: '2026-07-24T00:00:00Z',
    completed_at: null,
    ...overrides
  };
}

function prepareConversation(hooks, kind = 'direct') {
  hooks.state.currentUser = { id: 'person-1', kind: 'human', display_name: 'Person', presence: 'online' };
  hooks.state.selected = 'conversation-1';
  hooks.state.conversations = [{ id: 'conversation-1', kind, title: 'Conversation', member_count: 2 }];
  hooks.state.messages = [];
  hooks.state.agentRuns = new Map();
}

describe('live agent run cards', () => {
  it('renders an active direct-message run in the main feed', (t) => {
    const { hooks } = setupApp(t);
    prepareConversation(hooks);
    hooks.state.agentRuns.set('run-1', run());

    hooks.renderMessages();

    const node = hooks.dom.feed.querySelector('[data-run-id="run-1"]');
    assert.ok(node);
    assert.match(node.textContent, /Agent is working/);
  });

  it('renders a parent-bound direct-message run in the main feed', (t) => {
    const { hooks } = setupApp(t);
    prepareConversation(hooks);
    hooks.state.agentRuns.set('run-1', run({ parent_message_id: 'agent-message-1' }));

    hooks.renderMessages();

    assert.ok(hooks.dom.feed.querySelector('[data-run-id="run-1"]'));
  });

  it('updates a live card in place and preserves an expanded-state choice', (t) => {
    const { hooks } = setupApp(t);
    prepareConversation(hooks);
    hooks.state.agentRuns.set('run-1', run({ reasoning_content: 'First summary', reasoning_sequence: 1 }));
    hooks.renderMessages();

    const original = hooks.dom.feed.querySelector('[data-run-id="run-1"]');
    const details = original.querySelector('.reasoning-trace');
    details.open = false;
    hooks.handleRealtimeUpdate({
      type: 'agent_run_updated',
      data: run({
        reasoning_content: 'First summary\nSecond summary',
        reasoning_sequence: 2,
        activity_summary: 'Searching repository files'
      })
    });

    const updated = hooks.dom.feed.querySelector('[data-run-id="run-1"]');
    assert.strictEqual(updated, original);
    assert.equal(updated.querySelector('.reasoning-trace').open, false);
    assert.match(updated.querySelector('.thinking-content').textContent, /Second summary/);
    assert.match(updated.querySelector('.activity-content').textContent, /Searching repository files/);
  });

  for (const kind of ['channel', 'group']) {
    it(`renders an active ${kind} thread run in the thread panel`, (t) => {
      const { hooks } = setupApp(t);
      prepareConversation(hooks, kind);
      const root = message({ id: `${kind}-root` });
      hooks.state.messages = [root];
      hooks.state.threadRoot = root;
      hooks.state.agentRuns.set('run-1', run({ parent_message_id: root.id }));

      hooks.renderThread();

      assert.ok(hooks.dom.threadMessages.querySelector('[data-run-id="run-1"]'));
      assert.equal(hooks.dom.threadMessages.querySelector('.thread-empty'), null);
      assert.equal(hooks.dom.feed.querySelector('[data-run-id="run-1"]'), null);
    });
  }

  it('keeps simultaneous runs separate and cleans up only the terminal run card', (t) => {
    const { hooks } = setupApp(t);
    prepareConversation(hooks);
    hooks.state.agentRuns.set('run-1', run());
    hooks.state.agentRuns.set('run-2', run({ id: 'run-2' }));
    hooks.renderMessages();
    assert.equal(hooks.dom.feed.querySelectorAll('[data-run-id]').length, 2);

    hooks.handleRealtimeUpdate({
      type: 'agent_run_updated',
      data: run({ id: 'run-1', status: 'completed', completed_at: '2026-07-24T00:00:03Z' })
    });

    const completed = hooks.dom.feed.querySelector('[data-run-id="run-1"]');
    assert.ok(completed);
    assert.ok(completed.classList.contains('thinking-done'));
    assert.ok(hooks.dom.feed.querySelector('[data-run-id="run-2"]'));

    hooks.state.agentRuns.delete('run-1');
    hooks.renderMessages();
    assert.equal(hooks.dom.feed.querySelector('[data-run-id="run-1"]'), null);
    assert.ok(hooks.dom.feed.querySelector('[data-run-id="run-2"]'));
  });

  it('keeps a terminal failure visible with its error before cleanup', (t) => {
    const { hooks } = setupApp(t);
    prepareConversation(hooks);
    hooks.state.agentRuns.set('run-1', run());
    hooks.renderMessages();

    hooks.handleRealtimeUpdate({
      type: 'agent_run_updated',
      data: run({
        status: 'delivery_failed',
        error: 'Haco delivery failed',
        completed_at: '2026-07-24T00:00:03Z'
      })
    });

    const failed = hooks.dom.feed.querySelector('[data-run-id="run-1"]');
    assert.ok(failed?.classList.contains('thinking-done'));
    assert.match(failed.textContent, /Haco delivery failed/);
  });

  it('does not complete every same-agent run when one final message arrives', (t) => {
    const { hooks } = setupApp(t);
    prepareConversation(hooks);
    hooks.state.agentRuns.set('run-1', run());
    hooks.state.agentRuns.set('run-2', run({ id: 'run-2' }));

    hooks.handleRealtimeUpdate({
      type: 'message_created',
      data: message({
        id: 'final-1',
        sender: { id: 'agent-1', kind: 'agent', display_name: 'Atlas', presence: 'online' },
        body: 'Final answer'
      })
    });

    assert.equal(hooks.state.agentRuns.get('run-1').status, 'running');
    assert.equal(hooks.state.agentRuns.get('run-2').status, 'running');
  });

  it('does not let an older active-run snapshot resurrect a terminal update', (t) => {
    const { hooks } = setupApp(t);
    prepareConversation(hooks);
    const beforeRequest = run({
      reasoning_sequence: 3,
      updated_at: '2026-07-24T00:00:03Z'
    });
    hooks.state.agentRuns.set('run-1', run({
      status: 'delivery_failed',
      error: 'Delivery failed',
      reasoning_sequence: 4,
      updated_at: '2026-07-24T00:00:04Z',
      completed_at: '2026-07-24T00:00:04Z'
    }));

    hooks.mergeAgentRunSnapshot([run({
      status: 'running',
      reasoning_sequence: 3,
      updated_at: '2026-07-24T00:00:03Z'
    })], 'conversation-1', new Map([['run-1', beforeRequest]]));

    assert.equal(hooks.state.agentRuns.get('run-1').status, 'delivery_failed');
    assert.equal(hooks.state.agentRuns.get('run-1').error, 'Delivery failed');
  });

  it('removes a stale local active run when a recovery snapshot omits it', (t) => {
    const { hooks } = setupApp(t);
    prepareConversation(hooks);
    const beforeRequest = run({ reasoning_sequence: 3, updated_at: '2026-07-24T00:00:03Z' });
    hooks.state.agentRuns.set('run-1', beforeRequest);

    hooks.mergeAgentRunSnapshot([], 'conversation-1', new Map([['run-1', beforeRequest]]));

    assert.equal(hooks.state.agentRuns.has('run-1'), false);
  });

  it('ignores a recovery response after switching conversations', async (t) => {
    let resolveRuns;
    const pendingResponse = new Promise((resolve) => { resolveRuns = resolve; });
    const { hooks } = setupApp(t, (path) => {
      if (path === '/api/conversations/conversation-1/agent-runs') return pendingResponse;
      return jsonResponse([]);
    });
    prepareConversation(hooks);
    hooks.state._selectGeneration = 1;
    const pending = hooks.catchUpAgentRuns();

    hooks.state.selected = 'conversation-2';
    hooks.state._selectGeneration = 2;
    hooks.state.conversations = [{ id: 'conversation-2', kind: 'direct', title: 'Other', member_count: 2 }];
    hooks.state.agentRuns = new Map([['run-2', run({ id: 'run-2', conversation_id: 'conversation-2' })]]);
    resolveRuns(jsonResponse([run()]));
    await pending;

    assert.equal(hooks.state.agentRuns.has('run-1'), false);
    assert.equal(hooks.state.agentRuns.get('run-2')?.conversation_id, 'conversation-2');
  });

  it('uses bootstrap active runs as the initial durable state', async (t) => {
    const bootstrapRun = run({ id: 'bootstrap-run' });
    const { hooks } = setupApp(t, (path) => {
      if (path === '/api/bootstrap') {
        return jsonResponse({
          current_user: { id: 'person-1', kind: 'human', display_name: 'Person', presence: 'online' },
          conversations: [{ id: 'conversation-1', kind: 'direct', title: 'Conversation', member_count: 2 }],
          initial_messages: [],
          active_runs: [bootstrapRun]
        });
      }
      if (path === '/api/users' || path === '/api/notifications') return jsonResponse([]);
      return jsonResponse({});
    });

    await hooks.boot();

    assert.equal(hooks.state.agentRuns.get('bootstrap-run')?.id, bootstrapRun.id);
    assert.ok(hooks.dom.feed.querySelector('[data-run-id="bootstrap-run"]'));
  });
});
