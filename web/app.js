const state = { conversations: [], selected: null, messages: [], currentUser: null, replyTo: null, threadRoot: null, socket: null, filter: 'all', adminToken: null, adminSettings: null, settingsTab: 'workspace', settingsView: 'personal', authStatus: null, users: [], conversationMembers: {}, modalSubmit: null, typingTimer: null, draftTimer: null, remoteTyping: new Map(), pendingAttachments: [], threadPendingAttachments: [], hasOlder: false, notifications: [], pushRegistration: null, pushConfiguration: null, openclawDiscovery: null, popoverMessage: null, richMode: false, loadingOlder: false, reconnectAttempts: 0, agentThinking: null, streamingReasoning: null, sending: false, _selectGeneration: 0 };
const dom = {
  list: document.querySelector('#conversations'), forumList: document.querySelector('#forum-conversations'), directList: document.querySelector('#direct-conversations'), forumSection: document.querySelector('#forum-section'), directSection: document.querySelector('#direct-section'), feed: document.querySelector('#messages'), title: document.querySelector('#conversation-title'),
  kind: document.querySelector('#conversation-kind'), description: document.querySelector('#conversation-description'), status: document.querySelector('#connection-status'),
  input: document.querySelector('#message-input'), composer: document.querySelector('#composer'), search: document.querySelector('#search'),
  searchResults: document.querySelector('#search-results'), searchResultList: document.querySelector('#search-result-list'), searchSummary: document.querySelector('#search-summary'),
  replyState: document.querySelector('#reply-state'), replyCopy: document.querySelector('#reply-copy'), cancelReply: document.querySelector('#cancel-reply'),
  sidebar: document.querySelector('#sidebar'), mobileBackdrop: document.querySelector('#mobile-backdrop'), openSidebar: document.querySelector('#open-sidebar'), closeSidebar: document.querySelector('#close-sidebar'),
  closeSearch: document.querySelector('#close-search'), conversationCount: document.querySelector('#conversation-count'), channelSymbol: document.querySelector('#channel-symbol'), conversationPresence: document.querySelector('#conversation-presence'),
  profileName: document.querySelector('#profile-name'), profileAvatar: document.querySelector('#profile-avatar'), profilePresence: document.querySelector('#profile-presence'), filters: [...document.querySelectorAll('.filter')],
  appShell: document.querySelector('.app-shell'), threadPanel: document.querySelector('#thread-panel'), threadRoot: document.querySelector('#thread-root'),
  threadMessages: document.querySelector('#thread-messages'), threadCount: document.querySelector('#thread-count'), closeThread: document.querySelector('#close-thread'),
  threadComposer: document.querySelector('#thread-composer'), threadInput: document.querySelector('#thread-input'), threadAttachmentButton: document.querySelector('#thread-attachment-button'), threadAttachmentInput: document.querySelector('#thread-attachment-input'), threadSendButton: document.querySelector('#thread-send-button'),
  openSettings: document.querySelector('#open-settings'), settingsOverlay: document.querySelector('#settings-overlay'), closeSettings: document.querySelector('#close-settings'),
  settingsPersonal: document.querySelector('#settings-personal'), settingsEyebrow: document.querySelector('#settings-eyebrow'), showPersonalSettings: document.querySelector('#show-personal-settings'), openWorkspaceSettings: document.querySelector('#open-workspace-settings'), themePreference: document.querySelector('#theme-preference'),
  personalProfileName: document.querySelector('#personal-profile-name'), personalProfileAvatar: document.querySelector('#personal-profile-avatar'), personalProfilePresence: document.querySelector('#personal-profile-presence'), personalProfileStatus: document.querySelector('#personal-profile-status'),
  settingsUnlock: document.querySelector('#settings-unlock'), settingsWorkspace: document.querySelector('#settings-workspace'), settingsUnlockForm: document.querySelector('#settings-unlock-form'),
  adminToken: document.querySelector('#admin-token'), settingsUnlockError: document.querySelector('#settings-unlock-error'), settingsForm: document.querySelector('#settings-form'),
  settingsFormError: document.querySelector('#settings-form-error'), settingsSaveStatus: document.querySelector('#settings-save-status'), settingsLock: document.querySelector('#settings-lock'),
  settingsUsers: document.querySelector('#settings-users'), humanCount: document.querySelector('#human-count'), agentCount: document.querySelector('#agent-count'),
  authOverlay: document.querySelector('#auth-overlay'), authTitle: document.querySelector('#auth-title'), authEyebrow: document.querySelector('#auth-eyebrow'), authDescription: document.querySelector('#auth-description'),
  authError: document.querySelector('#auth-error'), loginForm: document.querySelector('#login-form'), setupForm: document.querySelector('#setup-form'), registerForm: document.querySelector('#register-form'), resetForm: document.querySelector('#reset-form'), inviteForm: document.querySelector('#invite-form'),
  authLinks: document.querySelector('#auth-links'), logoutButton: document.querySelector('#logout-button'), changePasswordButton: document.querySelector('#change-password-button'),
  currentPassword: document.querySelector('#current-password'), newPassword: document.querySelector('#new-password'), mockAdminLogin: document.querySelector('#mock-admin-login'),
  newForum: document.querySelector('#new-forum'), newDirectMessage: document.querySelector('#new-direct-message'), manageConversation: document.querySelector('#manage-conversation'), typingIndicator: document.querySelector('#typing-indicator'),
  conversationMembers: document.querySelector('#conversation-members'), conversationMemberCount: document.querySelector('#conversation-member-count'), membersPopover: document.querySelector('#members-popover'),
  attachmentButton: document.querySelector('#attachment-button'), attachmentInput: document.querySelector('#attachment-input'), pendingAttachments: document.querySelector('#pending-attachments'), loadOlder: document.querySelector('#load-older'),
  composerMode: document.querySelector('#composer-mode'), richComposerTools: document.querySelector('#rich-composer-tools'), bulletList: document.querySelector('#bullet-list'), numberList: document.querySelector('#number-list'), composerHint: document.querySelector('#composer-hint'),
  notificationsButton: document.querySelector('#notifications-button'), notificationCount: document.querySelector('#notification-count'), notificationsPanel: document.querySelector('#notifications-panel'), notificationList: document.querySelector('#notification-list'), closeNotifications: document.querySelector('#close-notifications'),
  pushToggle: document.querySelector('#push-toggle'), pushTest: document.querySelector('#push-test'), pushStatus: document.querySelector('#push-status'),
  searchConversation: document.querySelector('#search-conversation'), searchSender: document.querySelector('#search-sender'), searchMedia: document.querySelector('#search-media'), threadSubscribe: document.querySelector('#thread-subscribe'),
  mediaViewer: document.querySelector('#media-viewer'), mediaViewerContent: document.querySelector('#media-viewer-content'), closeMediaViewer: document.querySelector('#close-media-viewer'),
  mentionSuggestions: document.querySelector('#mention-suggestions'),
  testWebhook: document.querySelector('#test-webhook'), refreshWebhooks: document.querySelector('#refresh-webhooks'), webhookDeliveries: document.querySelector('#webhook-deliveries'),
  openOpenClawWizard: document.querySelector('#open-openclaw-wizard'), refreshOpenClaw: document.querySelector('#refresh-openclaw'), openclawConnections: document.querySelector('#openclaw-connections'), openclawOverallState: document.querySelector('#openclaw-overall-state'), openclawWizardStatus: document.querySelector('#openclaw-wizard-status'),
  runRetention: document.querySelector('#run-retention'), retentionStatus: document.querySelector('#retention-status'),
  createHuman: document.querySelector('#create-human'), createAgent: document.querySelector('#create-agent'), createInvite: document.querySelector('#create-invite'),
  workspaceModal: document.querySelector('#workspace-modal'), workspaceModalTitle: document.querySelector('#workspace-modal-title'), workspaceModalBody: document.querySelector('#workspace-modal-body'), workspaceModalForm: document.querySelector('#workspace-modal-form'), workspaceModalError: document.querySelector('#workspace-modal-error'), closeWorkspaceModal: document.querySelector('#close-workspace-modal'), workspaceModalCancel: document.querySelector('#workspace-modal-cancel'), workspaceModalSubmit: document.querySelector('#workspace-modal-submit'),
  messageActionsPopover: document.querySelector('#message-actions-popover'), headerDot: document.querySelector('#header-dot')
};

const iconFor = (kind) => ({ channel: '#', group: '◉', direct: '@' }[kind] || '•');
const labelFor = (kind) => ({ channel: 'Forum', group: 'Group chat', direct: 'Direct message' }[kind] || 'Conversation');
const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const formatMessageDate = (createdAt) => {
  const msgDate = new Date(createdAt);
  const today = new Date();
  const isToday = msgDate.toDateString() === today.toDateString();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = msgDate.toDateString() === yesterday.toDateString();
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return new Intl.DateTimeFormat([], { weekday: 'long', month: 'short', day: 'numeric' }).format(msgDate);
};
const renderMessageBody = (text) => {
  if (!text) return '';
  const html = text.split(/(```[\s\S]*?```|`[^`]+`)/g).map((part) => {
    if (!part) return '';
    if (part.startsWith('```') && part.endsWith('```')) {
      const lang = part.slice(3, part.indexOf('\n')).trim();
      const code = part.slice(3 + (lang ? lang.length + 1 : 0), -3);
      return `<pre class="code-block${lang ? ` lang-${escapeHtml(lang)}` : ''}"><code>${escapeHtml(code)}</code></pre>`;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return `<code class="inline-code">${escapeHtml(part.slice(1, -1))}</code>`;
    }
    return escapeHtml(part).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>');
  }).join('');
  return html.replace(/\n/g, '<br>');
};
const currentConversation = () => state.conversations.find((conversation) => conversation.id === state.selected);
const isSharedConversation = (conversation = currentConversation()) => ['channel', 'group'].includes(conversation?.kind);
const isOnline = (principal) => ['online', 'working'].includes(principal?.presence);
const initialsFor = (name = '') => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'H';
const symbolFor = (conversation) => conversation?.icon?.trim() || iconFor(conversation?.kind);
const conversationRoleForCurrentUser = (conversation = currentConversation()) => state.conversationMembers[conversation?.id]?.find((member) => member.principal?.id === state.currentUser?.id)?.role || null;
const canManageConversation = (conversation = currentConversation()) => Boolean(isSharedConversation(conversation) && (state.currentUser?.access_role === 'admin' || ['owner', 'admin'].includes(conversationRoleForCurrentUser(conversation))));
const isGuest = () => state.currentUser?.access_role === 'guest';
const titleForRole = (member) => {
  const role = member?.role;
  if (role) return role.replace(/^./, (letter) => letter.toUpperCase());
  const principal = member?.principal || member;
  return principal?.kind === 'agent' ? 'Agent' : principal?.access_role === 'admin' ? 'Workspace admin' : 'Member';
};

function applyPresence(element, principal) {
  if (!element) return;
  element.className = `presence-bar ${principal?.kind === 'agent' ? 'agent' : 'human'} ${isOnline(principal) ? 'online' : 'offline'}`;
  element.title = `${principal?.display_name || 'Member'} is ${isOnline(principal) ? 'online' : 'offline'}`;
}

function applyTheme(theme) {
  const resolved = theme === 'dark' ? 'dark' : 'bright';
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#1c276d' : '#8297ff');
  if (dom.themePreference) dom.themePreference.value = resolved;
  try { localStorage.setItem('haco-theme', resolved); } catch (_) {}
}

try { applyTheme(localStorage.getItem('haco-theme') || document.documentElement.dataset.theme); } catch (_) { applyTheme(document.documentElement.dataset.theme); }

async function request(path, options = {}) {
  const { headers = {}, ...rest } = options;
  const requestHeaders = rest.body instanceof FormData ? { ...headers } : { 'content-type': 'application/json', ...headers };
  const response = await fetch(path, { ...rest, headers: requestHeaders });
  const body = await response.text();
  let payload = null;
  if (body.trim()) {
    try { payload = JSON.parse(body); } catch (_) { payload = body; }
  }
  if (!response.ok) {
    const message = payload && typeof payload === 'object' ? payload.error : null;
    throw new Error(message || `Request failed (${response.status})`);
  }
  return payload;
}

async function initializeAuth() {
  try {
    state.authStatus = await request('/api/auth/status');
    if (state.authStatus.current_user) {
      state.currentUser = state.authStatus.current_user;
      dom.authOverlay.hidden = true;
      await boot();
    } else {
      showAuth(state.authStatus.setup_required ? 'setup' : 'login');
    }
  } catch (error) {
    showAuth('login');
    showAuthError(error.message);
  }
}

function showAuth(mode) {
  dom.authOverlay.hidden = false;
  dom.authError.hidden = true;
  const forms = { login: dom.loginForm, setup: dom.setupForm, register: dom.registerForm, reset: dom.resetForm, invite: dom.inviteForm };
  Object.entries(forms).forEach(([name, form]) => { form.hidden = name !== mode; });
  const copy = {
    login: ['Secure workspace', 'Sign in to Haco', 'Continue to your conversations with people and agents.'],
    setup: ['First-time setup', 'Create the administrator', 'Secure this workspace before inviting people or connecting agents.'],
    register: ['Join workspace', 'Create your account', 'Use your workspace identity to start collaborating.'],
    reset: ['Account recovery', 'Reset your password', 'Use the one-time token provided by a workspace administrator.'],
    invite: ['Workspace invitation', 'Join Haco', 'Create your account with the invitation token you received.']
  }[mode];
  [dom.authEyebrow.textContent, dom.authTitle.textContent, dom.authDescription.textContent] = copy;
  dom.authLinks.querySelector('[data-auth-mode="register"]').hidden = mode !== 'login' || !state.authStatus?.registration_enabled;
  dom.authLinks.querySelector('[data-auth-mode="reset"]').hidden = mode !== 'login';
  dom.authLinks.querySelector('[data-auth-mode="invite"]').hidden = mode !== 'login';
  dom.authLinks.querySelector('[data-auth-mode="login"]').hidden = mode === 'login' || mode === 'setup';
  dom.mockAdminLogin.hidden = !state.authStatus?.dev_mock_auth;
  window.setTimeout(() => forms[mode].querySelector('input')?.focus(), 80);
}

function showAuthError(message) {
  dom.authError.textContent = message;
  dom.authError.hidden = false;
}

async function submitAuth(event, endpoint) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(form).entries());
  dom.authError.hidden = true;
  button.disabled = true;
  const label = button.textContent;
  button.textContent = 'Please wait…';
  try {
    await request(endpoint, { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    state.authStatus = await request('/api/auth/status');
    if (state.authStatus.current_user) {
      state.currentUser = state.authStatus.current_user;
      dom.authOverlay.hidden = true;
      await boot();
    } else {
      showAuth('login');
    }
  } catch (error) {
    showAuthError(error.message);
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

async function submitReset(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) });
    form.reset();
    showAuth('login');
  } catch (error) { showAuthError(error.message); }
  finally { button.disabled = false; }
}

async function mockAdminLogin() {
  dom.mockAdminLogin.disabled = true;
  dom.authError.hidden = true;
  try {
    await request('/api/auth/dev-login', { method: 'POST' });
    state.authStatus = await request('/api/auth/status');
    state.currentUser = state.authStatus.current_user;
    dom.authOverlay.hidden = true;
    await boot();
  } catch (error) { showAuthError(error.message); }
  finally { dom.mockAdminLogin.disabled = false; }
}

async function logout() {
  await disablePush().catch(() => {});
  try { await request('/api/auth/logout', { method: 'POST' }); } catch (_) {}
  state.socket?.close();
  state.socket = null;
  state.currentUser = null;
  state.adminSettings = null;
  closeSettings();
  state.authStatus = await request('/api/auth/status');
  showAuth('login');
}

async function changeOwnPassword() {
  if (!dom.currentPassword.value || dom.newPassword.value.length < 12) {
    dom.settingsFormError.textContent = 'Enter your current password and a new password of at least 12 characters.';
    dom.settingsFormError.hidden = false;
    return;
  }
  dom.changePasswordButton.disabled = true;
  try {
    await request('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password: dom.currentPassword.value, new_password: dom.newPassword.value }) });
    dom.currentPassword.value = '';
    dom.newPassword.value = '';
    await logout();
  } catch (error) { dom.settingsFormError.textContent = error.message; dom.settingsFormError.hidden = false; }
  finally { dom.changePasswordButton.disabled = false; }
}

const adminHeaders = () => state.adminToken ? ({ authorization: `Bearer ${state.adminToken}` }) : ({});

async function openSettings() {
  dom.settingsOverlay.hidden = false;
  document.body.classList.add('settings-visible');
  dom.settingsUnlockError.hidden = true;
  showPersonalSettings();
}

function closeSettings() {
  dom.settingsOverlay.hidden = true;
  document.body.classList.remove('settings-visible');
  dom.settingsSaveStatus.textContent = '';
}

function showPersonalSettings() {
  state.settingsView = 'personal';
  dom.settingsEyebrow.textContent = 'My information';
  dom.settingsPersonal.hidden = false;
  dom.settingsUnlock.hidden = true;
  dom.settingsWorkspace.hidden = true;
  dom.showPersonalSettings.hidden = true;
  if (!state.currentUser) return;
  const presence = isOnline(state.currentUser) ? 'Online' : 'Offline';
  dom.personalProfileName.textContent = state.currentUser.display_name;
  dom.personalProfileAvatar.textContent = initialsFor(state.currentUser.display_name);
  dom.personalProfileStatus.textContent = presence;
  applyPresence(dom.personalProfilePresence, state.currentUser);
}

async function openWorkspaceAdministration(tab = state.settingsTab) {
  state.settingsView = 'administration';
  state.settingsTab = tab;
  dom.settingsEyebrow.textContent = 'Workspace administration';
  dom.settingsPersonal.hidden = true;
  dom.showPersonalSettings.hidden = false;
  dom.settingsUnlockError.hidden = true;
  if (state.adminSettings) { showSettingsWorkspace(); return; }
  if (state.currentUser?.access_role === 'admin') {
    try {
      state.adminSettings = await request('/api/admin/settings');
      showSettingsWorkspace();
      return;
    } catch (error) {
      dom.settingsUnlockError.textContent = error.message;
      dom.settingsUnlockError.hidden = false;
    }
  }
  dom.settingsWorkspace.hidden = true;
  dom.settingsUnlock.hidden = false;
  window.setTimeout(() => dom.adminToken.focus(), 80);
}

function lockSettings() {
  state.adminToken = null;
  state.adminSettings = null;
  dom.adminToken.value = '';
  dom.settingsForm.reset();
  dom.settingsPersonal.hidden = true;
  dom.settingsWorkspace.hidden = true;
  dom.settingsUnlock.hidden = false;
  window.setTimeout(() => dom.adminToken.focus(), 60);
}

async function unlockSettings(event) {
  event.preventDefault();
  const token = dom.adminToken.value.trim();
  if (!token) return;
  dom.settingsUnlockError.hidden = true;
  const button = dom.settingsUnlockForm.querySelector('button');
  button.disabled = true;
  button.textContent = 'Checking…';
  try {
    state.adminToken = token;
    state.adminSettings = await request('/api/admin/settings', { headers: adminHeaders() });
    showSettingsWorkspace();
  } catch (error) {
    state.adminToken = null;
    dom.settingsUnlockError.textContent = error.message;
    dom.settingsUnlockError.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = 'Unlock settings';
  }
}

async function showSettingsWorkspace() {
  state.settingsView = 'administration';
  dom.settingsEyebrow.textContent = 'Workspace administration';
  dom.settingsPersonal.hidden = true;
  dom.showPersonalSettings.hidden = false;
  dom.settingsUnlock.hidden = true;
  dom.settingsWorkspace.hidden = false;
  fillSettingsForm();
  selectSettingsTab(state.settingsTab);
  try { renderSettingsUsers(await request(state.currentUser?.access_role === 'admin' ? '/api/admin/principals' : '/api/users')); } catch (_) { renderSettingsUsers([]); }
  refreshWebhookDeliveries();
  refreshOpenClawStatus();
}

async function refreshWebhookDeliveries() {
  try {
    const deliveries = await request('/api/admin/webhooks/deliveries');
    dom.webhookDeliveries.innerHTML = deliveries.slice(0, 20).map((delivery) => `<div class="webhook-delivery ${escapeHtml(delivery.status)}"><span><strong>${escapeHtml(delivery.event_type)}</strong><small>${new Intl.DateTimeFormat([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(delivery.created_at))} · ${delivery.attempt_count} attempt${delivery.attempt_count === 1 ? '' : 's'}</small>${delivery.last_error ? `<em>${escapeHtml(delivery.last_error)}</em>` : ''}</span><b>${escapeHtml(delivery.status)}</b>${delivery.status === 'failed' ? `<button class="settings-inline-button" type="button" data-retry-webhook="${escapeHtml(delivery.id)}">Retry</button>` : ''}</div>`).join('') || '<p class="settings-help">No webhook deliveries yet.</p>';
    dom.webhookDeliveries.querySelectorAll('[data-retry-webhook]').forEach((button) => button.addEventListener('click', async () => { button.disabled = true; await request(`/api/admin/webhooks/${encodeURIComponent(button.dataset.retryWebhook)}/retry`, { method: 'POST' }); await refreshWebhookDeliveries(); }));
  } catch (error) { dom.webhookDeliveries.innerHTML = `<p class="settings-error">${escapeHtml(error.message)}</p>`; }
}

async function sendWebhookTest() {
  dom.testWebhook.disabled = true;
  try { await request('/api/admin/webhooks/test', { method: 'POST' }); dom.settingsSaveStatus.textContent = 'Test queued'; window.setTimeout(refreshWebhookDeliveries, 3500); }
  catch (error) { dom.settingsFormError.textContent = error.message; dom.settingsFormError.hidden = false; }
  finally { dom.testWebhook.disabled = false; }
}

async function refreshOpenClawStatus() {
  dom.refreshOpenClaw.disabled = true;
  dom.openclawOverallState.textContent = 'Checking…';
  dom.openclawOverallState.className = 'connection-pill';
  try {
    const discovery = await request('/api/admin/openclaw/discover', { headers: adminHeaders() });
    state.openclawDiscovery = discovery;
    renderOpenClawConnections(discovery);
  } catch (error) {
    dom.openclawOverallState.textContent = 'Needs attention';
    dom.openclawOverallState.className = 'connection-pill error';
    dom.openclawConnections.innerHTML = `<p class="settings-error">${escapeHtml(error.message)}</p>`;
  } finally {
    dom.refreshOpenClaw.disabled = false;
  }
}

function renderOpenClawConnections(discovery) {
  const connected = discovery.connections.filter((connection) => connection.status === 'connected');
  const errors = discovery.connections.filter((connection) => connection.status === 'error');
  if (errors.length) {
    dom.openclawOverallState.textContent = `${errors.length} need attention`;
    dom.openclawOverallState.className = 'connection-pill error';
  } else if (connected.length) {
    dom.openclawOverallState.textContent = `${connected.length} connected`;
    dom.openclawOverallState.className = 'connection-pill connected';
  } else {
    dom.openclawOverallState.textContent = discovery.gateway_reachable ? 'Ready to connect' : 'Not connected';
    dom.openclawOverallState.className = 'connection-pill';
  }
  const statusCopy = dom.openclawWizardStatus.querySelector('small');
  const versionLabel = (discovery.version || '').replace(/^openclaw\s*/i, '').trim();
  statusCopy.textContent = discovery.cli_available
    ? `OpenClaw ${versionLabel} ${discovery.gateway_reachable ? 'is running locally and ready.' : 'was found, but its Gateway is not reachable yet.'}`.replace(/\s+/g, ' ').trim()
    : (discovery.notice || 'OpenClaw was not found for the user running Haco.');
  dom.openclawWizardStatus.classList.toggle('error', !discovery.cli_available);
  dom.openclawConnections.innerHTML = discovery.connections.map((connection) => {
    const conversations = connection.conversation_ids.map((id) => discovery.conversations.find((item) => item.id === id)?.title || id).join(', ');
    const detail = connection.last_error || (connection.test_pending ? 'Connection test is waiting for the agent reply…' : `${connection.response_mode === 'always' ? 'Responds to every message' : 'Responds when mentioned'} · ${conversations}`);
    return `<div class="openclaw-connection ${connection.status === 'error' ? 'error' : ''}"><span class="avatar-stack openclaw-avatar-stack"><span class="openclaw-connection-avatar">${escapeHtml(initialsFor(connection.display_name))}</span><span class="presence-bar agent ${connection.status === 'connected' ? 'online' : 'offline'}"></span></span><span><strong>${escapeHtml(connection.display_name)}</strong><small>${escapeHtml(detail)}</small></span><span class="openclaw-connection-actions"><button class="settings-inline-button" type="button" data-test-openclaw="${escapeHtml(connection.openclaw_agent_id)}">Test</button><button class="settings-inline-button" type="button" data-disconnect-openclaw="${escapeHtml(connection.openclaw_agent_id)}">Disconnect</button></span></div>`;
  }).join('') || '<p class="settings-help">No connected agents yet. The wizard can connect all agents on this server in one pass.</p>';
  dom.openclawConnections.querySelectorAll('[data-test-openclaw]').forEach((button) => button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Testing…';
    try {
      await request('/api/admin/openclaw/test', { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ openclaw_agent_id: button.dataset.testOpenclaw }) });
      dom.settingsSaveStatus.textContent = 'Test sent · waiting for agent reply';
      await refreshOpenClawStatus();
      for (const delay of [2000, 4000, 7000]) {
        await new Promise((resolve) => window.setTimeout(resolve, delay));
        await refreshOpenClawStatus();
        const current = state.openclawDiscovery?.connections.find((item) => item.openclaw_agent_id === button.dataset.testOpenclaw);
        if (!current?.test_pending) {
          dom.settingsSaveStatus.textContent = current?.last_error ? 'Connection test failed' : 'Connection test succeeded';
          break;
        }
      }
      window.setTimeout(() => { dom.settingsSaveStatus.textContent = ''; }, 5000);
    } catch (error) {
      dom.settingsFormError.textContent = error.message;
      dom.settingsFormError.hidden = false;
      await refreshOpenClawStatus();
    } finally {
      button.disabled = false;
      button.textContent = 'Test';
    }
  }));
  dom.openclawConnections.querySelectorAll('[data-disconnect-openclaw]').forEach((button) => button.addEventListener('click', async () => {
    if (!window.confirm('Disconnect this OpenClaw agent from Haco? Existing messages will be kept.')) return;
    button.disabled = true;
    try {
      await request(`/api/admin/openclaw/${encodeURIComponent(button.dataset.disconnectOpenclaw)}/disconnect`, { method: 'POST', headers: adminHeaders() });
      await refreshOpenClawStatus();
      state.users = await request('/api/admin/principals');
      renderSettingsUsers(state.users);
    } catch (error) {
      dom.settingsFormError.textContent = error.message;
      dom.settingsFormError.hidden = false;
    } finally { button.disabled = false; }
  }));
}

async function openOpenClawWizard() {
  dom.openOpenClawWizard.disabled = true;
  dom.openOpenClawWizard.textContent = 'Discovering…';
  try {
    const discovery = await request('/api/admin/openclaw/discover', { headers: adminHeaders() });
    state.openclawDiscovery = discovery;
    if (!discovery.cli_available) throw new Error(discovery.notice || 'OpenClaw CLI was not found.');
    if (!discovery.agents.length) throw new Error('No OpenClaw agents were discovered on this server.');
    const alreadyConnected = new Set(discovery.connections.map((connection) => connection.openclaw_agent_id));
    const agentOptions = discovery.agents.map((agent) => `<label class="wizard-agent-option"><input type="checkbox" name="openclaw_agents" value="${escapeHtml(agent.id)}" ${alreadyConnected.has(agent.id) ? 'checked' : ''}/><span class="openclaw-connection-avatar">${escapeHtml(initialsFor(agent.display_name))}</span><span><strong>${escapeHtml(agent.display_name)}</strong><small>${escapeHtml(agent.workspace || agent.id)}</small></span></label>`).join('');
    const conversationOptions = discovery.conversations.filter((conversation) => !conversation.archived && conversation.kind !== 'direct').map((conversation) => `<label><input type="checkbox" name="openclaw_conversations" value="${escapeHtml(conversation.id)}" ${conversation.kind === 'channel' ? 'checked' : ''}/><span class="settings-user-avatar">${escapeHtml(iconFor(conversation.kind))}</span><span><strong>${escapeHtml(conversation.title)}</strong><small>${escapeHtml(labelFor(conversation.kind))}</small></span></label>`).join('');
    openWorkspaceModal('Connect local OpenClaw', `<div class="wizard-progress"><span class="active">1 · Discovered</span><span class="active">2 · Choose access</span><span>3 · Connect</span></div><div class="wizard-discovery"><div><strong>${discovery.cli_available ? 'OpenClaw found' : 'Not found'}</strong><small>${escapeHtml(discovery.version || 'Version unavailable')}</small></div><div><strong>${discovery.gateway_reachable ? 'Gateway online' : 'Gateway not reachable'}</strong><small>${escapeHtml(discovery.gateway_url)}</small></div></div><label class="settings-field"><span>Local Gateway URL</span><small>Automatic setup is restricted to this server.</small><input name="gateway_url" type="url" value="${escapeHtml(discovery.gateway_url)}" required /></label><div><span class="modal-label">Agents to connect</span><div class="wizard-agent-picker">${agentOptions}</div></div><div><span class="modal-label">Forum and group access</span><small class="settings-help">Each agent automatically gets a private DM with you. Choose any shared spaces it may also access.</small><div class="member-picker">${conversationOptions}</div></div><label class="settings-field"><span>When should agents respond in shared spaces?</span><select name="response_mode"><option value="mentions">Only when @mentioned (recommended)</option><option value="always">Every message in selected spaces</option></select></label><p class="wizard-note">Before changing OpenClaw, Haco saves a protected backup of the active configuration and any included configuration files. It then creates stable agent accounts, private DMs, permissions, credentials, routing, the local connector, and restarts the Gateway.</p>`, async (form) => {
      const selectedAgentIds = [...form.querySelectorAll('[name="openclaw_agents"]:checked')].map((input) => input.value);
      const conversationIds = [...form.querySelectorAll('[name="openclaw_conversations"]:checked')].map((input) => input.value);
      if (!selectedAgentIds.length) throw new Error('Select at least one agent.');
      dom.workspaceModalSubmit.textContent = 'Connecting…';
      const result = await request('/api/admin/openclaw/connect', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({
          gateway_url: form.gateway_url.value,
          install_connector: true,
          agents: selectedAgentIds.map((id) => {
            const agent = discovery.agents.find((item) => item.id === id);
            if (!agent) throw new Error(`Agent '${id}' not found in discovery response`);
            return { openclaw_agent_id: id, display_name: agent.display_name, conversation_ids: conversationIds, response_mode: form.response_mode.value };
          })
        })
      });
      closeWorkspaceModal();
      state.adminSettings = await request('/api/admin/settings', { headers: adminHeaders() });
      fillSettingsForm();
      await refreshOpenClawStatus();
      state.users = await request('/api/admin/principals');
      renderSettingsUsers(state.users);
      const backupCopy = result.config_backup ? ' · configuration backup created' : '';
      dom.settingsSaveStatus.textContent = `${selectedAgentIds.length} OpenClaw agent${selectedAgentIds.length === 1 ? '' : 's'} connected${backupCopy}`;
      window.setTimeout(() => { dom.settingsSaveStatus.textContent = ''; }, 4500);
    }, 'Connect agents');
  } catch (error) {
    dom.settingsFormError.textContent = error.message;
    dom.settingsFormError.hidden = false;
  } finally {
    dom.openOpenClawWizard.disabled = false;
    dom.openOpenClawWizard.textContent = 'Connect local OpenClaw';
  }
}

async function runRetentionCleanup() {
  dom.runRetention.disabled = true; dom.retentionStatus.textContent = 'Cleaning…';
  try { const result = await request('/api/admin/retention/run', { method: 'POST' }); dom.retentionStatus.textContent = `Complete · ${result.removed_objects} stored object${result.removed_objects === 1 ? '' : 's'} removed`; }
  catch (error) { dom.retentionStatus.textContent = error.message; }
  finally { dom.runRetention.disabled = false; }
}

function openWorkspaceModal(title, body, submit, submitLabel = 'Save changes') {
  dom.workspaceModalTitle.textContent = title;
  dom.workspaceModalBody.innerHTML = body;
  dom.workspaceModalError.hidden = true;
  dom.workspaceModalForm.hidden = false;
  dom.workspaceModalCancel.hidden = false;
  dom.workspaceModalSubmit.onclick = null;
  state.modalSubmit = submit;
  dom.workspaceModalSubmit.textContent = submitLabel;
  dom.workspaceModal.hidden = false;
  window.setTimeout(() => dom.workspaceModalBody.querySelector('input,textarea,select')?.focus(), 70);
}

function closeWorkspaceModal() {
  dom.workspaceModal.hidden = true;
  dom.workspaceModalBody.innerHTML = '';
  dom.workspaceModalForm.hidden = false;
  dom.workspaceModalCancel.hidden = false;
  state.modalSubmit = null;
  dom.workspaceModalSubmit.onclick = null;
}

function showOneTimeSecret(label, token, description) {
  dom.workspaceModalTitle.textContent = label;
  dom.workspaceModalCancel.hidden = true;
  dom.workspaceModalSubmit.textContent = 'Close';
  dom.workspaceModalSubmit.onclick = (e) => { e.preventDefault(); closeWorkspaceModal(); };
  dom.workspaceModalForm.hidden = true;
  dom.workspaceModalBody.innerHTML = `<div class="secret-display"><p>${escapeHtml(description)}</p><div class="secret-token glass-raised"><code>${escapeHtml(token)}</code><button class="btn-secondary copy-secret" type="button">Copy</button></div><p class="secret-note">This value will not be shown again.</p></div>`;
  dom.workspaceModal.hidden = false;
  dom.workspaceModalBody.querySelector('.copy-secret').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(token);
      dom.workspaceModalBody.querySelector('.copy-secret').textContent = 'Copied!';
    } catch (_) {
      dom.workspaceModalBody.querySelector('.copy-secret').textContent = 'Copy failed';
    }
  });
}

const memberChecklist = (selected = [], roles = null) => {
  const ownerCount = Object.values(roles || {}).filter((role) => role === 'owner').length;
  const roleOptions = (role, locked) => `<select data-member-role="${escapeHtml(role.id)}" aria-label="Role for ${escapeHtml(role.display_name)}" ${locked ? 'disabled' : ''}>${['owner', 'admin', 'moderator', 'member'].map((option) => `<option value="${option}" ${option === role.value ? 'selected' : ''}>${option.replace(/^./, (letter) => letter.toUpperCase())}</option>`).join('')}</select>`;
  return `<div class="member-picker ${roles ? 'member-role-picker' : ''}">${state.users.filter((user) => !user.disabled).map((user) => {
    const role = roles?.[user.id];
    const isFinalOwner = role === 'owner' && ownerCount === 1;
    const control = roles ? roleOptions({ id: user.id, display_name: user.display_name, value: role || 'member' }, isFinalOwner) : '';
    const secondary = role ? role.replace(/^./, (letter) => letter.toUpperCase()) : (isOnline(user) ? 'Online' : 'Offline');
    const label = `<label><input type="checkbox" name="member_ids" value="${escapeHtml(user.id)}" ${selected.includes(user.id) ? 'checked' : ''} ${isFinalOwner ? 'disabled' : ''}/><span class="avatar-stack picker-avatar-stack"><span class="settings-user-avatar ${user.kind === 'agent' ? 'agent' : ''}">${escapeHtml(initialsFor(user.display_name))}</span><span class="presence-bar ${user.kind === 'agent' ? 'agent' : 'human'} ${isOnline(user) ? 'online' : 'offline'}"></span></span><span><strong>${escapeHtml(user.display_name)}</strong><small>${escapeHtml(secondary)}</small></span></label>`;
    return roles ? `<div class="member-role-picker-row">${label}${control}</div>` : label;
  }).join('')}</div>`;
};

async function openNewForum() {
  if (!state.users.length) state.users = await request('/api/users');
  openWorkspaceModal('Create forum', `<div class="settings-field-grid"><label class="settings-field"><span>Forum name</span><input name="title" maxlength="80" required placeholder="e.g. launch-planning" /></label><label class="settings-field"><span>Forum picture</span><input name="icon" maxlength="4" placeholder="#" aria-describedby="forum-icon-help" /></label></div><p id="forum-icon-help" class="settings-help">Use a short icon or emoji; leave empty for the default forum mark.</p><label class="settings-field"><span>Description</span><textarea name="description" rows="3" placeholder="What is this forum for?"></textarea></label><div><span class="modal-label">Invite members</span>${memberChecklist([state.currentUser.id])}</div><p class="settings-help forum-owner-note">You are added automatically as the forum owner.</p>`, async (form) => {
    const payload = { kind: 'channel', title: form.title.value, description: form.description.value || null, icon: form.icon.value || null, is_private: false, member_ids: [...form.querySelectorAll('[name="member_ids"]:checked')].map((item) => item.value) };
    const conversation = await request('/api/conversations', { method: 'POST', body: JSON.stringify(payload) });
    state.conversations = await request('/api/conversations');
    state.conversationMembers = {};
    closeWorkspaceModal(); await selectConversation(conversation.id);
  }, 'Create forum');
}

async function openNewDirectMessage() {
  if (!state.users.length) state.users = await request('/api/users');
  const people = state.users.filter((user) => !user.disabled && user.id !== state.currentUser?.id);
  openWorkspaceModal('New direct message', `<p class="settings-help">Choose one person or agent to start a private conversation.</p><div class="direct-picker">${people.map((user) => `<label><input type="radio" name="member_id" value="${escapeHtml(user.id)}" required /><span class="avatar-stack"><span class="settings-user-avatar ${user.kind === 'agent' ? 'agent' : ''}">${escapeHtml(initialsFor(user.display_name))}</span><span class="presence-bar ${user.kind === 'agent' ? 'agent' : 'human'} ${isOnline(user) ? 'online' : 'offline'}"></span></span><span><strong>${escapeHtml(user.display_name)}</strong><small>${escapeHtml(user.kind === 'agent' ? 'Connected agent' : isOnline(user) ? 'Online' : 'Offline')}</small></span></label>`).join('') || '<p class="settings-help">No one else is available to message.</p>'}</div>`, async (form) => {
    const memberId = form.member_id.value;
    const peer = people.find((user) => user.id === memberId);
    if (!peer) throw new Error('Choose a person or agent.');
    const existing = state.conversations.find((conversation) => conversation.kind === 'direct' && conversation.title === peer.display_name);
    if (existing) { closeWorkspaceModal(); await selectConversation(existing.id); return; }
    const conversation = await request('/api/conversations', { method: 'POST', body: JSON.stringify({ kind: 'direct', title: peer.display_name, description: null, is_private: true, member_ids: [state.currentUser.id, peer.id] }) });
    state.conversations = await request('/api/conversations');
    state.conversationMembers = {};
    closeWorkspaceModal(); await selectConversation(conversation.id);
  }, 'Start message');
}

async function openManageConversation() {
  const conversation = currentConversation();
  if (!conversation) return;
  const members = await request(`/api/conversations/${conversation.id}/members`);
  const memberRoles = Object.fromEntries(members.map((member) => [member.principal.id, member.role]));
  openWorkspaceModal(`Manage ${labelFor(conversation.kind).toLowerCase()}`, `<div class="settings-field-grid"><label class="settings-field"><span>Name</span><input name="title" maxlength="80" value="${escapeHtml(conversation.title)}" required /></label><label class="settings-field"><span>${conversation.kind === 'channel' ? 'Forum picture' : 'Group picture'}</span><input name="icon" maxlength="4" value="${escapeHtml(conversation.icon || '')}" placeholder="${conversation.kind === 'channel' ? '#' : '◉'}" /></label></div><label class="settings-field"><span>Topic or description</span><input name="description" value="${escapeHtml(conversation.description || '')}" /></label><div class="settings-field-grid"><label class="settings-toggle"><span><strong>Private</strong></span><input name="is_private" type="checkbox" ${conversation.is_private ? 'checked' : ''}/><i></i></label><label class="settings-toggle"><span><strong>Archived</strong></span><input name="archived" type="checkbox" ${conversation.archived ? 'checked' : ''}/><i></i></label></div><div><span class="modal-label">Members and roles</span>${memberChecklist(members.map((member) => member.principal.id), memberRoles)}</div><button id="delete-conversation" class="danger-button" type="button">Delete conversation</button>`, async (form) => {
    const memberIds = [...form.querySelectorAll('[name="member_ids"]:checked')].map((item) => item.value);
    const roles = Object.fromEntries([...form.querySelectorAll('[data-member-role]')].map((select) => [select.dataset.memberRole, select.value]));
    await request(`/api/admin/conversations/${conversation.id}`, { method: 'POST', body: JSON.stringify({ title: form.title.value, description: form.description.value || null, icon: form.icon.value || null, is_private: form.is_private.checked, archived: form.archived.checked }) });
    await request(`/api/admin/conversations/${conversation.id}/members`, { method: 'POST', body: JSON.stringify({ member_ids: memberIds, roles }) });
    closeWorkspaceModal(); state.conversations = await request('/api/conversations'); state.conversationMembers = {}; if (state.conversations.some((item) => item.id === conversation.id)) await selectConversation(conversation.id); else { state.selected = state.conversations[0]?.id || null; if (state.selected) await selectConversation(state.selected); else render(); }
  });
  document.querySelector('#delete-conversation').addEventListener('click', async () => { if (!window.confirm(`Delete ${conversation.title} and all of its messages?`)) return; await request(`/api/admin/conversations/${conversation.id}/delete`, { method: 'POST' }); closeWorkspaceModal(); state.conversations = await request('/api/conversations'); state.selected = state.conversations[0]?.id || null; if (state.selected) await selectConversation(state.selected); else render(); });
}

function openCreatePrincipal(kind) {
  const human = kind === 'human';
  openWorkspaceModal(human ? 'Add person' : 'Add agent', `<div class="settings-field-grid"><label class="settings-field"><span>Display name</span><input name="display_name" required /></label><label class="settings-field"><span>Username</span><input name="username" pattern="[A-Za-z0-9_-]+" required /></label></div>${human ? '<label class="settings-field"><span>Email</span><input name="email" type="email" /></label><label class="settings-field"><span>Access role</span><select name="access_role"><option value="member">Member</option><option value="guest">Guest</option><option value="admin">Administrator</option></select></label><label class="settings-field"><span>Password (optional)</span><input name="password" type="password" minlength="12" maxlength="128" autocomplete="new-password" /></label><p class="settings-help">Leave password blank to use a reset token later.</p>' : '<input name="access_role" value="agent" type="hidden" />'}`, async (form) => {
    await request('/api/admin/principals', { method: 'POST', body: JSON.stringify({ kind, display_name: form.display_name.value, username: form.username.value, email: human ? (form.email.value || null) : null, access_role: form.access_role.value, password: human ? (form.password.value || null) : null }) });
    closeWorkspaceModal(); state.users = await request('/api/admin/principals'); renderSettingsUsers(state.users);
  });
}

function openCreateInvite() {
  openWorkspaceModal('Create invitation', `<label class="settings-field"><span>Email (optional)</span><input name="email" type="email" /></label><div class="settings-field-grid"><label class="settings-field"><span>Role</span><select name="access_role"><option value="member">Member</option><option value="guest">Guest</option><option value="admin">Administrator</option></select></label><label class="settings-field"><span>Expires in</span><select name="expires_in_days"><option value="1">1 day</option><option value="7" selected>7 days</option><option value="30">30 days</option></select></label></div>`, async (form) => {
    const invite = await request('/api/admin/invites', { method: 'POST', body: JSON.stringify({ email: form.email.value || null, access_role: form.access_role.value, expires_in_days: Number(form.expires_in_days.value) }) });
    showOneTimeSecret('Invitation token', invite.token, 'Copy this invitation token and send it securely. It expires in the selected period.');
  });
}

async function openEditPrincipal(user) {
  if (!user) return;
  const human = user.kind === 'human';
  const keys = human ? [] : await request(`/api/admin/agents/${encodeURIComponent(user.id)}/keys`);
  const keyList = human ? '' : `<div><span class="modal-label">Agent keys</span><div class="key-list">${keys.map((key) => `<div><span><strong>${escapeHtml(key.name)}</strong><small>${escapeHtml(key.scopes.join(', '))}${key.revoked ? ' · revoked' : ''}</small></span>${key.revoked ? '' : `<button class="settings-inline-button" type="button" data-revoke-key="${escapeHtml(key.id)}">Revoke</button>`}</div>`).join('') || '<p class="settings-help">No keys created yet.</p>'}</div></div>`;
  openWorkspaceModal(`Edit ${user.display_name}`, `<div class="settings-field-grid"><label class="settings-field"><span>Display name</span><input name="display_name" value="${escapeHtml(user.display_name)}" required /></label><label class="settings-field"><span>Username</span><input name="username" value="${escapeHtml(user.username)}" required /></label></div>${human ? `<label class="settings-field"><span>Email</span><input name="email" type="email" value="${escapeHtml(user.email || '')}" /></label><label class="settings-field"><span>Role</span><select name="access_role">${['admin', 'member', 'guest'].map((role) => `<option value="${role}" ${role === user.access_role ? 'selected' : ''}>${role}</option>`).join('')}</select></label>` : '<input name="access_role" value="agent" type="hidden" />'}<label class="settings-toggle"><span><strong>Disable account</strong><small>Ends sessions and prevents access.</small></span><input name="disabled" type="checkbox" ${user.disabled ? 'checked' : ''}/><i></i></label>${keyList}${user.id === state.currentUser.id ? '' : '<button id="delete-principal" class="danger-button" type="button">Delete account</button>'}`, async (form) => {
    await request(`/api/admin/principals/${encodeURIComponent(user.id)}`, { method: 'POST', body: JSON.stringify({ display_name: form.display_name.value, username: form.username.value, email: human ? (form.email.value || null) : null, access_role: form.access_role.value, disabled: form.disabled.checked }) });
    closeWorkspaceModal(); renderSettingsUsers(await request('/api/admin/principals'));
  });
  dom.workspaceModalBody.querySelectorAll('[data-revoke-key]').forEach((button) => button.addEventListener('click', async () => { if (!window.confirm('Revoke this agent key?')) return; await request(`/api/admin/agent-keys/${encodeURIComponent(button.dataset.revokeKey)}/revoke`, { method: 'POST' }); openEditPrincipal(user); }));
  document.querySelector('#delete-principal')?.addEventListener('click', async () => { if (!window.confirm(`Delete ${user.display_name}? Existing authored messages will remain.`)) return; await request(`/api/admin/principals/${encodeURIComponent(user.id)}/delete`, { method: 'POST' }); closeWorkspaceModal(); renderSettingsUsers(await request('/api/admin/principals')); });
}

function fillSettingsForm() {
  const settings = state.adminSettings;
  if (!settings) return;
  state._settingsInitial = { ...settings };
  const fields = dom.settingsForm.elements;
  Object.entries(settings).forEach(([name, value]) => {
    const field = fields.namedItem(name);
    if (!field) return;
    if (field.type === 'checkbox') field.checked = Boolean(value);
    else field.value = value ?? '';
  });
  fields.namedItem('openclaw_token').value = '';
  fields.namedItem('webhook_secret').value = '';
  const tokenState = document.querySelector('#openclaw-token-state');
  const secretState = document.querySelector('#webhook-secret-state');
  tokenState.textContent = settings.openclaw_token_configured ? 'Configured' : 'Not configured';
  tokenState.classList.toggle('configured', settings.openclaw_token_configured);
  secretState.textContent = settings.webhook_secret_configured ? 'Configured' : 'Not configured';
  secretState.classList.toggle('configured', settings.webhook_secret_configured);
  const base = settings.public_url || location.origin;
  document.querySelector('#openclaw-endpoint').textContent = `${base}/api/integrations/openclaw/events`;
  document.querySelector('#agent-api-endpoint').textContent = `${base}/api/integrations/agents/events`;
  document.querySelector('#system-origin').textContent = location.origin;
  updateSettingsSaveState();
}

function updateSettingsSaveState() {
  const saveButton = document.querySelector('#save-settings');
  if (!saveButton || !state._settingsInitial) return;
  const fields = dom.settingsForm.elements;
  let dirty = false;
  for (const name of Object.keys(state._settingsInitial)) {
    const field = fields.namedItem(name);
    if (!field) continue;
    const current = field.type === 'checkbox' ? field.checked : field.value;
    const initial = field.type === 'checkbox' ? Boolean(state._settingsInitial[name]) : (state._settingsInitial[name] ?? '');
    if (current !== initial) { dirty = true; break; }
  }
  const tokenVal = fields.namedItem('openclaw_token')?.value.trim() || '';
  const secretVal = fields.namedItem('webhook_secret')?.value.trim() || '';
  if (tokenVal || secretVal) dirty = true;
  saveButton.disabled = !dirty;
}

function renderSettingsUsers(users) {
  state.users = users;
  const humans = users.filter((user) => user.kind === 'human');
  const agents = users.filter((user) => user.kind === 'agent');
  dom.humanCount.textContent = humans.length;
  dom.agentCount.textContent = agents.length;
  dom.settingsUsers.innerHTML = users.map((user) => {
    const canEditRole = state.currentUser?.access_role === 'admin' && user.kind === 'human' && user.id !== state.currentUser.id;
    const role = escapeHtml(user.access_role || user.kind);
    const roleControl = canEditRole
      ? `<select class="settings-role-select" data-role-user="${escapeHtml(user.id)}" data-user-disabled="${user.disabled}" aria-label="Access role for ${escapeHtml(user.display_name)}">${['admin', 'member', 'guest'].map((option) => `<option value="${option}" ${option === user.access_role ? 'selected' : ''}>${option}</option>`).join('')}</select>`
      : `<b>${role}</b>`;
    const securityAction = state.currentUser?.access_role === 'admin' ? `<button class="settings-inline-button" type="button" data-edit-user="${escapeHtml(user.id)}">Edit</button>${user.kind === 'human' ? `<button class="settings-inline-button" type="button" data-reset-user="${escapeHtml(user.id)}">Reset</button>` : `<button class="settings-inline-button" type="button" data-agent-key="${escapeHtml(user.id)}">New key</button>`}` : '';
    return `<div class="settings-user ${user.disabled ? 'disabled' : ''}"><span class="avatar-stack settings-avatar-stack"><span class="settings-user-avatar ${user.kind === 'agent' ? 'agent' : ''}">${escapeHtml(initialsFor(user.display_name))}</span><span class="presence-bar ${user.kind === 'agent' ? 'agent' : 'human'} ${isOnline(user) ? 'online' : 'offline'}"></span></span><span class="settings-user-copy"><strong>${escapeHtml(user.display_name)}</strong><small>@${escapeHtml(user.username)}${user.disabled ? ' · disabled' : ''}</small></span><span class="settings-user-actions">${roleControl}${securityAction}</span></div>`;
  }).join('') || '<p class="settings-help">No principals found.</p>';
  dom.settingsUsers.querySelectorAll('[data-role-user]').forEach((select) => select.addEventListener('change', async () => {
    select.disabled = true;
    try {
      await request(`/api/admin/users/${encodeURIComponent(select.dataset.roleUser)}/access`, { method: 'POST', body: JSON.stringify({ access_role: select.value, disabled: select.dataset.userDisabled === 'true' }) });
      dom.settingsSaveStatus.textContent = 'Access updated';
    } catch (error) {
      dom.settingsFormError.textContent = error.message;
      dom.settingsFormError.hidden = false;
    } finally { select.disabled = false; }
  }));
  dom.settingsUsers.querySelectorAll('[data-reset-user]').forEach((button) => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const result = await request(`/api/admin/users/${encodeURIComponent(button.dataset.resetUser)}/reset-password`, { method: 'POST' });
      showOneTimeSecret('Reset token', result.token, 'Copy this one-time password reset token. It expires in 30 minutes.');
    } catch (error) { dom.settingsFormError.textContent = error.message; dom.settingsFormError.hidden = false; }
    finally { button.disabled = false; }
  }));
  dom.settingsUsers.querySelectorAll('[data-agent-key]').forEach((button) => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const result = await request(`/api/admin/agents/${encodeURIComponent(button.dataset.agentKey)}/keys`, { method: 'POST', body: JSON.stringify({ name: 'Admin-created key', scopes: ['messages:write', 'activity:write'] }) });
      showOneTimeSecret('Agent key', result.token, 'Copy this agent key now. Haco will not display it again.');
    } catch (error) { dom.settingsFormError.textContent = error.message; dom.settingsFormError.hidden = false; }
    finally { button.disabled = false; }
  }));
  dom.settingsUsers.querySelectorAll('[data-edit-user]').forEach((button) => button.addEventListener('click', () => openEditPrincipal(users.find((user) => user.id === button.dataset.editUser))));
}

function selectSettingsTab(tab) {
  state.settingsTab = tab;
  document.querySelectorAll('[data-settings-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.settingsTab === tab);
    button.setAttribute('aria-selected', String(button.dataset.settingsTab === tab));
  });
  document.querySelectorAll('[data-settings-page]').forEach((page) => page.classList.toggle('active', page.dataset.settingsPage === tab));
}

async function saveSettings(event) {
  event.preventDefault();
  if (!dom.settingsForm.reportValidity()) return;
  const fields = dom.settingsForm.elements;
  const read = (name) => fields.namedItem(name);
  const settings = {
    workspace_name: read('workspace_name').value,
    public_url: read('public_url').value,
    registration_enabled: read('registration_enabled').checked,
    url_previews_enabled: read('url_previews_enabled').checked,
    max_upload_mb: Number(read('max_upload_mb').value),
    data_retention_days: Number(read('data_retention_days').value),
    reasoning_retention_days: Number(read('reasoning_retention_days').value),
    openclaw_enabled: read('openclaw_enabled').checked,
    openclaw_gateway_url: read('openclaw_gateway_url').value,
    openclaw_agent_id: read('openclaw_agent_id').value,
    openclaw_token_configured: state.adminSettings.openclaw_token_configured,
    webhooks_enabled: read('webhooks_enabled').checked,
    webhook_url: read('webhook_url').value,
    webhook_secret_configured: state.adminSettings.webhook_secret_configured,
    agent_api_enabled: read('agent_api_enabled').checked
  };
  const button = document.querySelector('#save-settings');
  dom.settingsFormError.hidden = true;
  button.disabled = true;
  button.textContent = 'Saving…';
  try {
    state.adminSettings = await request('/api/admin/settings', {
      method: 'PUT', headers: adminHeaders(), body: JSON.stringify({
        settings,
        openclaw_token: read('openclaw_token').value.trim() || null,
        webhook_secret: read('webhook_secret').value.trim() || null
      })
    });
    fillSettingsForm();
    document.querySelector('.workspace-card strong').textContent = state.adminSettings.workspace_name;
    document.title = `${state.adminSettings.workspace_name} · Haco`;
    dom.settingsSaveStatus.textContent = 'Saved';
    window.setTimeout(() => { dom.settingsSaveStatus.textContent = ''; }, 2200);
  } catch (error) {
    dom.settingsFormError.textContent = error.message;
    dom.settingsFormError.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = 'Save changes';
  }
}

async function boot() {
  try {
    const data = await request('/api/bootstrap');
    state.currentUser = data.current_user;
    renderProfile();
    state.conversations = data.conversations;
    state.selected = data.conversations[0]?.id || null;
    state.messages = data.initial_messages;
    state.hasOlder = data.initial_messages.length === 50;
    state.users = await request('/api/users');
    fillSearchFilters();
    refreshNotifications();
    initializePush();
    render();
    if (!state.socket || state.socket.readyState > WebSocket.OPEN) connectSocket();
  } catch (error) {
    setStatus(`Server error: ${error.message}`, false);
  }
}

function render() { renderConversations(); renderHeader(); renderMessages(); updateSendButton(); }

function renderProfile() {
  if (!state.currentUser) return;
  const presence = isOnline(state.currentUser) ? 'Online' : 'Offline';
  dom.profileName.textContent = state.currentUser.display_name;
  dom.profileAvatar.textContent = initialsFor(state.currentUser.display_name);
  dom.status.textContent = presence;
  applyPresence(dom.profilePresence, state.currentUser);
  if (state.settingsView === 'personal') showPersonalSettings();
}

function directPeerFor(conversation) {
  if (conversation.direct_peer_id) return state.users.find((user) => user.id === conversation.direct_peer_id);
  return state.users.find((user) => user.id !== state.currentUser?.id && (user.display_name === conversation.title || user.username === conversation.title));
}

function renderConversations() {
  dom.forumList.innerHTML = '';
  dom.directList.innerHTML = '';
  dom.newForum.hidden = isGuest();
  dom.newDirectMessage.hidden = !state.currentUser || isGuest();
  const filtered = state.conversations.filter((conversation) => state.filter === 'all' || (state.filter === 'channel' ? ['channel', 'group'].includes(conversation.kind) : conversation.kind === state.filter));
  dom.conversationCount.textContent = `${filtered.length}`;
  filtered.forEach((conversation) => {
    const fragment = document.querySelector('#conversation-template').content.cloneNode(true);
    const button = fragment.querySelector('button');
    button.classList.toggle('active', conversation.id === state.selected);
    button.dataset.kind = conversation.kind;
    const peer = conversation.kind === 'direct' ? directPeerFor(conversation) : null;
    const icon = button.querySelector('.conversation-icon');
    icon.textContent = conversation.kind === 'direct' ? initialsFor(peer?.display_name || conversation.title) : symbolFor(conversation);
    icon.classList.toggle('conversation-icon-direct', conversation.kind === 'direct');
    icon.classList.toggle('is-default-forum', conversation.kind === 'channel' && !conversation.icon);
    const presence = button.querySelector('.presence-bar');
    if (conversation.kind === 'direct' && peer) applyPresence(presence, peer);
    else presence.hidden = true;
    button.querySelector('strong').textContent = conversation.title;
    button.querySelector('small').textContent = conversation.last_message_preview || conversation.description || 'No messages yet';
    const unread = button.querySelector('.unread-badge');
    unread.hidden = !conversation.unread_count;
    unread.textContent = conversation.unread_count > 99 ? '99+' : conversation.unread_count;
    button.addEventListener('click', () => selectConversation(conversation.id));
    (conversation.kind === 'direct' ? dom.directList : dom.forumList).append(fragment);
  });
  const showForums = state.filter !== 'direct';
  const showDirect = state.filter !== 'channel';
  dom.forumSection.hidden = !showForums;
  dom.directSection.hidden = !showDirect;
  if (showForums && !dom.forumList.children.length) dom.forumList.innerHTML = '<p class="empty-list">No forums or groups yet.</p>';
  if (showDirect && !dom.directList.children.length) dom.directList.innerHTML = '<p class="empty-list">No direct messages yet.</p>';
}

function renderHeader() {
  const conversation = currentConversation();
  dom.title.textContent = conversation ? conversation.title : 'No conversation selected';
  dom.kind.textContent = conversation ? labelFor(conversation.kind) : '';
  dom.description.textContent = conversation?.description || '';
  const peer = conversation?.kind === 'direct' ? directPeerFor(conversation) : null;
  dom.channelSymbol.textContent = conversation?.kind === 'direct' ? initialsFor(peer?.display_name || conversation.title) : conversation ? symbolFor(conversation) : '•';
  dom.channelSymbol.classList.toggle('is-default-forum', conversation?.kind === 'channel' && !conversation.icon);
  dom.channelSymbol.classList.toggle('direct-avatar', conversation?.kind === 'direct');
  dom.conversationPresence.hidden = !peer;
  if (peer) applyPresence(dom.conversationPresence, peer);
  const shared = isSharedConversation(conversation);
  dom.conversationMembers.hidden = !shared;
  if (shared) {
    dom.conversationMemberCount.textContent = conversation.member_count;
    dom.conversationMembers.setAttribute('aria-label', `Show ${conversation.member_count} member${conversation.member_count === 1 ? '' : 's'}`);
  }
  dom.manageConversation.hidden = !canManageConversation(conversation);
  if (!shared) closeMembersPopover();
  if (!conversation) closeThread();
}

function closeMembersPopover() {
  if (!dom.membersPopover || dom.membersPopover.hidden) return;
  dom.membersPopover.hidden = true;
  dom.conversationMembers.setAttribute('aria-expanded', 'false');
}

function renderMembersPopover(members) {
  const conversation = currentConversation();
  if (!conversation || !isSharedConversation(conversation)) return;
  const canManage = canManageConversation(conversation);
  dom.membersPopover.innerHTML = `<header><div><span class="eyebrow">${escapeHtml(labelFor(conversation.kind))}</span><strong>${conversation.member_count} member${conversation.member_count === 1 ? '' : 's'}</strong></div><span><button class="members-popover-close" type="button" aria-label="Close member list">×</button></span></header><ul>${members.map((member) => { const principal = member.principal || member; return `<li><span class="avatar-stack"><span class="member-avatar">${escapeHtml(initialsFor(principal.display_name))}</span><span class="presence-bar ${principal.kind === 'agent' ? 'agent' : 'human'} ${isOnline(principal) ? 'online' : 'offline'}"></span></span><span><strong>${escapeHtml(principal.display_name)}</strong><small>${escapeHtml(titleForRole(member))}</small></span></li>`; }).join('') || '<li class="members-empty">No members found.</li>'}</ul>${canManage ? '<footer><button id="manage-members-from-popover" class="settings-inline-button" type="button">Manage conversation</button></footer>' : ''}`;
  dom.membersPopover.querySelector('.members-popover-close')?.addEventListener('click', closeMembersPopover);
  dom.membersPopover.querySelector('#manage-members-from-popover')?.addEventListener('click', () => { closeMembersPopover(); openManageConversation(); });
}

async function toggleMembersPopover() {
  const conversation = currentConversation();
  if (!isSharedConversation(conversation)) return;
  if (!dom.membersPopover.hidden) { closeMembersPopover(); return; }
  dom.membersPopover.hidden = false;
  dom.conversationMembers.setAttribute('aria-expanded', 'true');
  dom.membersPopover.innerHTML = '<div class="members-loading">Loading members…</div>';
  try {
    const members = state.conversationMembers[conversation.id] || await request(`/api/conversations/${encodeURIComponent(conversation.id)}/members`);
    state.conversationMembers[conversation.id] = members;
    if (currentConversation()?.id === conversation.id) renderMembersPopover(members);
  } catch (error) {
    dom.membersPopover.innerHTML = `<div class="members-loading"><strong>Could not load members</strong><small>${escapeHtml(error.message)}</small></div>`;
  }
}

async function cacheConversationMembers(conversation = currentConversation()) {
  if (!isSharedConversation(conversation) || state.conversationMembers[conversation.id]) return;
  try {
    const members = await request(`/api/conversations/${encodeURIComponent(conversation.id)}/members`);
    state.conversationMembers[conversation.id] = members;
    if (currentConversation()?.id === conversation.id) {
      renderHeader();
      if (!dom.membersPopover.hidden) renderMembersPopover(members);
    }
  } catch (_) {
    // The member count remains available even if the directory cannot be loaded.
  }
}

function renderMessages() {
  if (!state.selected) {
    dom.feed.innerHTML = '<div class="empty-feed"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true"><circle cx="18" cy="13" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M4 32c0-5.5 4-10 14-10s14 4.5 14 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M18 1v4M18 22v4M6 6l3 3M27 9l-3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/></svg><strong>No conversation selected</strong><p>Choose a conversation from the sidebar or create a new one.</p></div>';
    dom.loadOlder.hidden = true;
    if (dom.composer) dom.composer.hidden = true;
    return;
  }
  if (dom.composer) dom.composer.hidden = isGuest();
  dom.manageConversation.hidden = !canManageConversation() || isGuest();
  const scrollWasAtBottom = dom.feed.scrollTop >= dom.feed.scrollHeight - dom.feed.clientHeight - 20;
  const sharedConversation = isSharedConversation();
  dom.feed.classList.toggle('forum-post-feed', sharedConversation);
  const visibleMessages = sharedConversation
    ? state.messages.filter((message) => !message.parent_message_id)
    : state.messages;

  const existingNodes = new Map();
  const nonMessageNodes = [];
  for (const child of dom.feed.children) {
    if (child.dataset.messageId) existingNodes.set(child.dataset.messageId, child);
    else if (!child.classList.contains('thinking-done') && !child.classList.contains('thinking-fade-in') && child.tagName !== 'DIV') nonMessageNodes.push(child);
  }
  nonMessageNodes.forEach((n) => n.remove());

  visibleMessages.forEach((message, index) => {
    let node = existingNodes.get(message.id);
    if (node) {
      existingNodes.delete(message.id);
      const currentIndex = [...dom.feed.children].indexOf(node);
      if (currentIndex !== index && currentIndex >= 0) {
        dom.feed.insertBefore(node, dom.feed.children[index] || null);
      }
    } else {
      try {
        node = createMessageNode(message);
      } catch (error) {
        console.error('Unable to render chat message', { messageId: message?.id, error });
        node = createMessageFallbackNode(message);
      }
      dom.feed.insertBefore(node, dom.feed.children[index] || null);
    }
  });

  existingNodes.forEach((node) => node.remove());

  dom.feed.querySelectorAll('.in-feed-date-divider').forEach((d) => d.remove());
  let lastDate = null;
  [...dom.feed.querySelectorAll('[data-message-id]')].forEach((el) => {
    const msg = visibleMessages.find((m) => m.id === el.dataset.messageId);
    if (!msg) return;
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== lastDate) {
      lastDate = msgDate;
      const divider = document.createElement('div');
      divider.className = 'in-feed-date-divider';
      divider.innerHTML = `<span>${formatMessageDate(msg.created_at)}</span>`;
      el.before(divider);
    }
  });

  const existingThinking = dom.feed.querySelector('.message.agent.thinking-fade-in');
  if (existingThinking) existingThinking.remove();
  if (!sharedConversation) {
    const thinking = state.streamingReasoning;
    if (thinking?.conversationId === state.selected) {
      dom.feed.append(createLiveThinkingNode(thinking));
    } else if (!thinking && state.agentThinking?.conversationId === state.selected) {
      dom.feed.append(createLiveThinkingNode(state.agentThinking));
    }
  }

  if (!visibleMessages.length && !(state.streamingReasoning?.conversationId === state.selected) && !(state.agentThinking?.conversationId === state.selected)) dom.feed.innerHTML = '<div class="empty-feed"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true"><circle cx="18" cy="13" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M4 32c0-5.5 4-10 14-10s14 4.5 14 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M18 1v4M18 22v4M6 6l3 3M27 9l-3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/></svg><strong>No messages yet</strong><p>Start the conversation with a person or agent.</p></div>';
  dom.loadOlder.hidden = !state.hasOlder;
  const latestMessage = visibleMessages[visibleMessages.length - 1];
  const dateLabel = document.querySelector('.date-divider span');
  if (dateLabel) {
    dateLabel.textContent = latestMessage ? formatMessageDate(latestMessage.created_at) : '';
  }
  if (!state.loadingOlder && (scrollWasAtBottom || state.streamingReasoning?.conversationId === state.selected || state.agentThinking?.conversationId === state.selected)) {
    requestAnimationFrame(() => { dom.feed.scrollTop = dom.feed.scrollHeight; });
  }
  state.loadingOlder = false;
}

function createLiveThinkingNode(thinking, options = {}) {
  const elapsed = Math.max(0, Math.round((Date.now() - (state._thinkingStart || Date.now())) / 1000));
  const article = document.createElement('article');
  article.className = `message agent thinking-fade-in${thinking.done ? ' thinking-done' : ''}${options.thread ? ' thread-context' : ''}`;
  const avatar = initialsFor(thinking.name || 'Agent');
  const label = thinking.done
    ? `Worked${elapsed > 60 ? ` for ${Math.floor(elapsed / 60)}m` : ''}`
    : `Thinking${elapsed > 3 ? ` for ${elapsed}s` : ''}…`;
  const content = thinking.content || 'Preparing a response…';
  const spinnerHtml = thinking.done ? '' : '<span class="thinking-spinner"></span>';
  article.innerHTML = `<span class="avatar-stack message-avatar-stack"><span class="avatar">${escapeHtml(avatar)}</span><span class="presence-bar agent online"></span></span><div class="message-content"><div class="message-meta"><strong>${escapeHtml(thinking.name || 'Agent')}</strong></div><div class="message-bubble thinking-live-bubble"><details class="reasoning-trace"><summary>${spinnerHtml}<span class="thinking-label">${escapeHtml(label)}</span><span class="thinking-disclosure" aria-hidden="true">⌄</span></summary><pre class="thinking-content">${escapeHtml(content)}</pre></details></div></div>`;
  return article;
}

function createMessageFallbackNode(message) {
  const sender = message?.sender || {};
  const article = document.createElement('article');
  article.className = `message message-fallback${sender.id === state.currentUser?.id ? ' own' : ''}`;
  const content = document.createElement('div');
  content.className = 'message-content';
  const meta = document.createElement('div');
  meta.className = 'message-meta';
  const name = document.createElement('strong');
  name.textContent = sender.display_name || 'Unknown sender';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  const body = document.createElement('p');
  body.className = 'message-body';
  body.textContent = message?.body || 'This message could not be displayed.';
  meta.append(name);
  bubble.append(body);
  content.append(meta, bubble);
  article.append(content);
  return article;
}

function appendQuotedReply(article, message) {
  if (!message.parent_message_id) return;
  const source = state.messages.find((candidate) => candidate.id === message.parent_message_id);
  if (!source) return;
  const quote = document.createElement('button');
  quote.type = 'button';
  quote.className = 'quoted-message';
  quote.innerHTML = `<span class="quoted-message-avatar">${escapeHtml(initialsFor(source.sender.display_name))}</span><span><small>Replying to ${escapeHtml(source.sender.display_name)}</small><strong>${escapeHtml(source.body)}</strong></span><span class="quoted-message-jump" aria-hidden="true">↗</span>`;
  quote.addEventListener('click', () => document.querySelector(`[data-message-id="${CSS.escape(source.id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  article.querySelector('.message-bubble').prepend(quote);
}

function createMessageNode(message, options = {}) {
  const fragment = document.querySelector('#message-template').content.cloneNode(true);
  const article = fragment.querySelector('article');
  article.dataset.messageId = message.id;
  article.classList.toggle('agent', message.sender.kind === 'agent');
  article.classList.toggle('own', message.sender.id === state.currentUser?.id);
  article.classList.toggle('thread-context', Boolean(options.thread));
  article.classList.toggle('forum-post', isSharedConversation() && !options.thread);
  article.querySelector('.avatar').textContent = initialsFor(message.sender.display_name);
  applyPresence(article.querySelector('.presence-bar'), message.sender);
  article.querySelector('.message-meta strong').textContent = message.sender.display_name;
  article.querySelector('time').textContent = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' }).format(new Date(message.created_at));
  article.querySelector('.message-body').innerHTML = renderMessageBody(message.body);
  article.classList.toggle('deleted', Boolean(message.is_deleted));
  article.querySelector('.edited-label').hidden = !message.edited_at;
  if (message.activity || message.reasoning) {
    const reasoning = article.querySelector('.reasoning-trace');
    if (!reasoning) return;
    reasoning.hidden = false;
    const spinner = reasoning.querySelector('.thinking-spinner');
    if (spinner) spinner.hidden = true;
    const label = reasoning.querySelector('.thinking-label');
    if (label) {
      const msgTime = new Date(message.created_at).getTime();
      const now = Date.now();
      const elapsed = Math.round((now - msgTime) / 1000);
      if (elapsed < 60) {
        label.textContent = 'Worked';
      } else {
        label.textContent = `Worked for ${Math.floor(elapsed / 60)}m`;
      }
    }
    if (message.reasoning?.content) {
      const content = reasoning.querySelector('.thinking-content');
      if (!content) return;
      content.textContent = message.reasoning.content;
      content.hidden = false;
    } else if (message.activity?.summary) {
      const content = reasoning.querySelector('.thinking-content');
      if (!content) return;
      content.textContent = message.activity.summary;
      content.hidden = false;
    }
  }
  (message.attachments || []).forEach((attachment) => {
    let item;
    if (attachment.media_type.startsWith('image/')) {
      item = document.createElement('button'); item.className = 'attachment media-attachment'; item.type = 'button';
      item.innerHTML = `<img src="${escapeHtml(attachment.url)}" alt="${escapeHtml(attachment.file_name)}" loading="lazy"><span>${escapeHtml(attachment.file_name)}</span>`;
      item.addEventListener('click', () => openMedia(attachment));
    } else if (attachment.media_type.startsWith('video/')) {
      item = document.createElement('video'); item.className = 'attachment-player'; item.controls = true; item.preload = 'metadata'; item.src = attachment.url;
    } else if (attachment.media_type.startsWith('audio/')) {
      item = document.createElement('audio'); item.className = 'attachment-player'; item.controls = true; item.preload = 'metadata'; item.src = attachment.url;
    } else {
      item = document.createElement('a'); item.className = 'attachment'; item.href = attachment.url; item.textContent = `📎 ${attachment.file_name}${attachment.byte_size ? ` · ${formatBytes(attachment.byte_size)}` : ''}`; item.target = '_blank';
    }
    article.querySelector('.attachments').append(item);
  });
  if (message.url_preview) {
    const preview = article.querySelector('.url-preview'); preview.hidden = false; preview.href = message.url_preview.url;
    preview.querySelector('strong').textContent = message.url_preview.title;
    preview.querySelector('.url-preview-copy > span').textContent = message.url_preview.description || message.url_preview.url;
    try { preview.querySelector('small').textContent = new URL(message.url_preview.url).hostname; } catch (_) { preview.querySelector('small').textContent = message.url_preview.url; }
    if (message.url_preview.image_url) {
      const image = preview.querySelector('img'); image.hidden = false; image.src = `/api/url-preview/image?url=${encodeURIComponent(message.url_preview.image_url)}`;
      image.addEventListener('error', () => { image.hidden = true; });
    }
  }
  article.querySelector('.pinned-label').hidden = !message.is_pinned;
  appendQuotedReply(article, message);
  const reactions = article.querySelector('.reaction-row');
  (message.reactions || []).forEach((reaction) => { const chip = document.createElement('button'); chip.type = 'button'; chip.className = `reaction-chip${reaction.reacted_by_me ? ' active' : ''}`; chip.textContent = `${reaction.emoji} ${reaction.count}`; chip.addEventListener('click', () => reactToMessage(message, reaction.emoji)); reactions.append(chip); });
  const replyButton = article.querySelector('.reply-button');
  if (options.thread || message.is_deleted) {
    replyButton.hidden = true;
  } else {
    replyButton.addEventListener('click', () => setReply(message));
  }
  const replies = state.messages.filter((candidate) => candidate.parent_message_id === message.id);
  const threadButton = article.querySelector('.thread-button');
  if (!options.thread && isSharedConversation() && !message.is_deleted) {
    threadButton.hidden = false;
    threadButton.textContent = replies.length ? `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'} →` : 'Start thread';
    threadButton.addEventListener('click', () => openThread(message));
  }
  const canManageMessage = !message.is_deleted && (message.sender.id === state.currentUser?.id || state.currentUser?.access_role === 'admin');
  const moreActionsButton = article.querySelector('.more-actions-button');
  moreActionsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    openMessageActionsPopover(message, moreActionsButton);
  });
  const pinButton = article.querySelector('.pinned-label');
  pinButton.textContent = message.is_pinned ? 'Pinned' : '';
  pinButton.hidden = !message.is_pinned;
  return article;
}

const formatBytes = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
function openMedia(attachment) { dom.mediaViewerContent.innerHTML = `<img src="${escapeHtml(attachment.url)}" alt="${escapeHtml(attachment.file_name)}">`; dom.mediaViewer.hidden = false; }

let currentPopoverMessage = null;
function openMessageActionsPopover(message, trigger) {
  currentPopoverMessage = message;
  const rect = trigger.getBoundingClientRect();
  const popover = dom.messageActionsPopover;
  popover.querySelector('[data-action="pin"]').textContent = message.is_pinned ? 'Unpin' : 'Pin';
  popover.querySelector('[data-action="save"]').textContent = message.is_saved ? 'Unsave' : 'Save';
  const canManage = !message.is_deleted && (message.sender.id === state.currentUser?.id || state.currentUser?.access_role === 'admin');
  popover.querySelector('[data-action="edit"]').hidden = !canManage;
  popover.querySelector('[data-action="delete"]').hidden = !canManage;
  popover.hidden = false;
  const x = Math.min(rect.left, window.innerWidth - 160);
  const y = rect.bottom + 4;
  popover.style.left = `${x}px`;
  popover.style.top = `${y}px`;
  setTimeout(() => document.addEventListener('click', closeMessageActionsPopover, { once: true }), 0);
}

function closeMessageActionsPopover() {
  dom.messageActionsPopover.hidden = true;
  currentPopoverMessage = null;
}

dom.messageActionsPopover.querySelector('[data-action="react"]').addEventListener('click', () => {
  if (currentPopoverMessage) chooseReaction(currentPopoverMessage);
  closeMessageActionsPopover();
});
dom.messageActionsPopover.querySelector('[data-action="pin"]').addEventListener('click', () => {
  if (currentPopoverMessage) { toggleMessageState(currentPopoverMessage, 'pin'); closeMessageActionsPopover(); }
});
dom.messageActionsPopover.querySelector('[data-action="save"]').addEventListener('click', () => {
  if (currentPopoverMessage) { toggleMessageState(currentPopoverMessage, 'save'); closeMessageActionsPopover(); }
});
dom.messageActionsPopover.querySelector('[data-action="edit"]').addEventListener('click', () => {
  if (currentPopoverMessage) { closeMessageActionsPopover(); openEditMessage(currentPopoverMessage); }
});
dom.messageActionsPopover.querySelector('[data-action="delete"]').addEventListener('click', () => {
  if (currentPopoverMessage) { closeMessageActionsPopover(); removeMessage(currentPopoverMessage); }
});
async function reactToMessage(message, emoji) { try { replaceMessage(await request(`/api/messages/${message.id}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) })); } catch (error) { setStatus(error.message, false); } }
function chooseReaction(message) { openWorkspaceModal('Add reaction', '<div class="emoji-picker"><button type="button">👍</button><button type="button">❤️</button><button type="button">🎉</button><button type="button">👀</button><button type="button">🤔</button><button type="button">✅</button></div>', async () => {}); dom.workspaceModalBody.querySelectorAll('.emoji-picker button').forEach((button) => button.addEventListener('click', async () => { closeWorkspaceModal(); await reactToMessage(message, button.textContent); })); }
async function toggleMessageState(message, action) { try { replaceMessage(await request(`/api/messages/${message.id}/${action}`, { method: 'POST' })); } catch (error) { setStatus(error.message, false); } }
function replaceMessage(updated) { const index = state.messages.findIndex((message) => message.id === updated.id); if (index >= 0) state.messages[index] = updated; renderMessages(); if (state.threadRoot) { if (state.threadRoot.id === updated.id) state.threadRoot = updated; renderThread(); } }

function openEditMessage(message) {
  openWorkspaceModal('Edit message', `<label class="settings-field"><span>Message</span><textarea name="body" rows="5" required>${escapeHtml(message.body)}</textarea></label>`, async (form) => {
    const updated = await request(`/api/messages/${encodeURIComponent(message.id)}/edit`, { method: 'POST', body: JSON.stringify({ body: form.body.value }) });
    const index = state.messages.findIndex((item) => item.id === updated.id);
    if (index >= 0) state.messages[index] = updated;
    renderMessages(); if (state.threadRoot) renderThread();
  });
}

async function removeMessage(message) {
  if (!window.confirm('Delete this message? Thread replies will remain.')) return;
  try {
    await request(`/api/messages/${encodeURIComponent(message.id)}/delete`, { method: 'POST' });
    const target = state.messages.find((item) => item.id === message.id);
    if (target) { target.body = 'Message deleted'; target.is_deleted = true; target.activity = null; target.attachments = []; }
    renderMessages(); if (state.threadRoot) renderThread();
  } catch (error) { setStatus(error.message, false); }
}

async function selectConversation(id, targetMessageId = null) {
  state.selected = id;
  state.replyTo = null;
  state.agentThinking = null;
  state.streamingReasoning = null;
  state._thinkingStart = null;
  closeThread();
  renderConversations();
  renderHeader();
  void cacheConversationMembers(currentConversation());
  renderReply();
  closeMobileSidebar();
  renderTyping();
  state.pendingAttachments = []; renderPendingAttachments();
  const generation = ++state._selectGeneration;
  try {
    state.messages = await request(`/api/conversations/${id}/messages?limit=50`);
    if (generation !== state._selectGeneration) return;
    state.hasOlder = state.messages.length === 50;
    const draft = await request(`/api/conversations/${id}/draft`);
    if (generation !== state._selectGeneration) return;
    dom.input.value = draft.body || ''; resizeComposer(); updateSendButton();
    renderMessages();
    if (targetMessageId) {
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-message-id="${CSS.escape(targetMessageId)}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('message-highlight');
          setTimeout(() => el.classList.remove('message-highlight'), 2000);
        }
      });
    }
    await request(`/api/conversations/${id}/read`, { method: 'POST' });
    if (generation !== state._selectGeneration) return;
    const conversation = currentConversation();
    if (conversation) conversation.unread_count = 0;
    renderConversations();
  } catch (error) { setStatus(error.message, false); }
}

function setReply(message) {
  if (isSharedConversation()) {
    openThread(message);
    return;
  }
  state.replyTo = message;
  renderReply();
  dom.input.focus();
}
function renderReply() {
  dom.replyState.hidden = !state.replyTo;
  if (state.replyTo) dom.replyCopy.textContent = `Replying to ${state.replyTo.sender.display_name}`;
}

function openThread(message) {
  if (!isSharedConversation()) return;
  state.threadRoot = message;
  dom.threadPanel.hidden = false;
  dom.appShell.classList.add('thread-open');
  document.body.classList.add('thread-visible');
  renderThread();
  window.setTimeout(() => dom.threadInput.focus(), 120);
}

function closeThread() {
  state.threadRoot = null;
  dom.threadPanel.hidden = true;
  dom.appShell.classList.remove('thread-open');
  document.body.classList.remove('thread-visible');
  dom.threadInput.value = '';
}

function renderThread() {
  if (!state.threadRoot) return;
  const conversation = currentConversation();
  if (!isSharedConversation(conversation)) { closeThread(); return; }
  const replies = state.messages.filter((message) => message.parent_message_id === state.threadRoot.id);
  dom.threadRoot.innerHTML = '';
  dom.threadMessages.innerHTML = '';
  dom.threadRoot.append(createMessageNode(state.threadRoot, { thread: true }));
  replies.forEach((reply) => dom.threadMessages.append(createMessageNode(reply, { thread: true })));
  if (state.streamingReasoning?.conversationId === state.selected && state.streamingReasoning?.parentMessageId === state.threadRoot.id) {
    dom.threadMessages.append(createLiveThinkingNode(state.streamingReasoning, { thread: true }));
  }
  dom.threadCount.textContent = `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`;
  document.querySelector('.thread-header .eyebrow').textContent = conversation.kind === 'channel' ? 'Forum thread' : 'Group thread';
  if (!replies.length) dom.threadMessages.innerHTML = '<div class="thread-empty"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h16v12H8l-4 4V4Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg><p>No replies yet. Start the thread below.</p></div>';
  const wasAtBottom = dom.threadMessages.scrollTop >= dom.threadMessages.scrollHeight - dom.threadMessages.clientHeight - 20;
  if (wasAtBottom || state.streamingReasoning?.conversationId === state.selected) {
    dom.threadMessages.scrollTop = dom.threadMessages.scrollHeight;
  }
}

async function sendThreadReply(event) {
  event.preventDefault();
  if (state.sending) return;
  const body = dom.threadInput.value.trim();
  if ((!body && !state.threadPendingAttachments.length) || !state.selected || !state.threadRoot) return;
  state.sending = true;
  try {
    const message = await request(`/api/conversations/${state.selected}/messages`, {
      method: 'POST',
      body: JSON.stringify({ sender_id: state.currentUser.id, body, parent_message_id: state.threadRoot.id, attachments: state.threadPendingAttachments })
    });
    if (!state.messages.some((item) => item.id === message.id)) state.messages.push(message);
    dom.threadInput.value = '';
    state.threadPendingAttachments = [];
    resizeTextArea(dom.threadInput);
    renderMessages();
    renderThread();
    refreshConversations();
  } catch (error) { setStatus(error.message, false); }
  finally { state.sending = false; }
}

async function uploadThreadFiles(files) {
  dom.threadAttachmentButton.disabled = true;
  try {
    for (const file of files) {
      const form = new FormData(); form.append('file', file);
      const attachment = await request('/api/uploads', { method: 'POST', body: form });
      state.threadPendingAttachments.push(attachment);
    }
  } catch (error) { setStatus(error.message, false); }
  finally { dom.threadAttachmentButton.disabled = false; dom.threadAttachmentInput.value = ''; }
}

async function sendMessage(event) {
  event.preventDefault();
  if (state.sending) return;
  const body = dom.input.value.trim();
  if ((!body && !state.pendingAttachments.length) || !state.selected) return;
  state.sending = true;
  try {
    const message = await request(`/api/conversations/${state.selected}/messages`, {
      method: 'POST',
      body: JSON.stringify({ sender_id: state.currentUser.id, body, parent_message_id: state.replyTo?.id || null, attachments: state.pendingAttachments })
    });
    if (!state.messages.some((item) => item.id === message.id)) state.messages.push(message);
    const conversation = currentConversation();
    if (conversation?.kind === 'direct') {
      const peer = directPeerFor(conversation);
      if (peer?.kind === 'agent') {
        state.agentThinking = { agentId: peer.id, name: peer.display_name, conversationId: state.selected };
      }
    }
    dom.input.value = '';
    state.pendingAttachments = []; renderPendingAttachments();
    request(`/api/conversations/${state.selected}/draft`, { method: 'PUT', body: JSON.stringify({ body: '' }) }).catch(() => {});
    sendTyping(false);
    state.replyTo = null;
    resizeComposer();
    renderMessages();
    requestAnimationFrame(() => { dom.feed.scrollTop = dom.feed.scrollHeight; });
    renderReply();
    refreshConversations();
  } catch (error) { setStatus(error.message, false); }
  finally { state.sending = false; }
}

async function uploadFiles(files) {
  dom.attachmentButton.disabled = true;
  try {
    for (const file of files) {
      const form = new FormData(); form.append('file', file);
      const attachment = await request('/api/uploads', { method: 'POST', body: form });
      state.pendingAttachments.push(attachment); renderPendingAttachments();
    }
  } catch (error) { setStatus(error.message, false); }
  finally { dom.attachmentButton.disabled = false; dom.attachmentInput.value = ''; }
}
function renderPendingAttachments() {
  dom.pendingAttachments.hidden = !state.pendingAttachments.length;
  dom.pendingAttachments.innerHTML = state.pendingAttachments.map((attachment, index) => `<span>📎 ${escapeHtml(attachment.file_name)} <button type="button" data-remove="${index}">×</button></span>`).join('');
  dom.pendingAttachments.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => { state.pendingAttachments.splice(Number(button.dataset.remove), 1); renderPendingAttachments(); updateSendButton(); }));
  updateSendButton();
}
function updateSendButton() {
  const sendButton = dom.composer?.querySelector('button[type="submit"]');
  if (!sendButton) return;
  const hasContent = dom.input.value.trim().length > 0 || state.pendingAttachments.length > 0;
  sendButton.disabled = !hasContent;
}
function renderMentionSuggestions() {
  if (!isSharedConversation()) { dom.mentionSuggestions.hidden = true; return; }
  const match = dom.input.value.slice(0, dom.input.selectionStart).match(/@([A-Za-z0-9_-]*)$/);
  if (!match) { dom.mentionSuggestions.hidden = true; return; }
  const members = (state.conversationMembers[state.selected] || []).map((m) => m.principal);
  const candidates = members.filter((user) => user.username.toLowerCase().startsWith(match[1].toLowerCase())).slice(0, 6);
  dom.mentionSuggestions.hidden = !candidates.length;
  dom.mentionSuggestions.innerHTML = candidates.map((user) => `<button type="button" data-username="${escapeHtml(user.username)}"><span>${escapeHtml(user.display_name)}</span><small>@${escapeHtml(user.username)} · ${escapeHtml(user.kind)}</small></button>`).join('');
  dom.mentionSuggestions.querySelectorAll('[data-username]').forEach((button) => button.addEventListener('click', () => { const end = dom.input.selectionStart; const start = end - match[0].length; dom.input.setRangeText(`@${button.dataset.username} `, start, end, 'end'); dom.mentionSuggestions.hidden = true; dom.input.focus(); }));
}
async function loadOlderMessages() {
  if (!state.messages.length || !state.selected) return;
  dom.loadOlder.disabled = true;
  state.loadingOlder = true;
  try {
    const older = await request(`/api/conversations/${state.selected}/messages?limit=50&before=${encodeURIComponent(state.messages[0].created_at)}`);
    state.hasOlder = older.length === 50; state.messages = [...older, ...state.messages]; renderMessages();
  } catch (error) { setStatus(error.message, false); }
  finally { dom.loadOlder.disabled = false; }
}

function fillSearchFilters() {
  dom.searchConversation.innerHTML = '<option value="">All conversations</option>' + state.conversations.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>`).join('');
  dom.searchSender.innerHTML = '<option value="">Anyone</option>' + state.users.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.display_name)}</option>`).join('');
}

function urlBase64ToBytes(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const binary = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function initializePush() {
  if (!state.currentUser) return;
  if (!window.isSecureContext || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    dom.pushStatus.textContent = 'Requires HTTPS and a supported browser';
    dom.pushToggle.disabled = true;
    dom.pushTest.hidden = true;
    return;
  }
  try {
    state.pushConfiguration = await request('/api/push/config');
    state.pushRegistration = await navigator.serviceWorker.register('/sw.js');
    await updatePushStatus();
  } catch (error) {
    dom.pushStatus.textContent = `Unavailable: ${error.message}`;
    dom.pushToggle.disabled = true;
  }
}

async function updatePushStatus() {
  const subscription = await state.pushRegistration?.pushManager.getSubscription();
  const enabled = Boolean(subscription) && Notification.permission === 'granted';
  dom.pushStatus.textContent = Notification.permission === 'denied' ? 'Blocked in browser settings' : enabled ? 'Enabled on this device' : 'Browser notifications are off';
  dom.pushToggle.textContent = enabled ? 'Disable' : 'Enable';
  dom.pushToggle.disabled = Notification.permission === 'denied';
  dom.pushTest.hidden = !enabled;
}

async function enablePush() {
  if (!state.pushRegistration || !state.pushConfiguration) await initializePush();
  if (!state.pushRegistration) return;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') { await updatePushStatus(); return; }
  let subscription = await state.pushRegistration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await state.pushRegistration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(state.pushConfiguration.vapid_public_key) });
  }
  await request('/api/push/subscriptions', { method: 'POST', body: JSON.stringify(subscription.toJSON()) });
  await updatePushStatus();
}

async function disablePush() {
  const registration = state.pushRegistration || (('serviceWorker' in navigator) ? await navigator.serviceWorker.getRegistration('/') : null);
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await request('/api/push/subscriptions', { method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }) }).catch(() => {});
    await subscription.unsubscribe();
  }
  if (dom.pushStatus) await updatePushStatus();
}

async function togglePush() {
  dom.pushToggle.disabled = true;
  try {
    const subscription = await state.pushRegistration?.pushManager.getSubscription();
    if (subscription) await disablePush(); else await enablePush();
  } catch (error) { dom.pushStatus.textContent = error.message; }
  finally { if (Notification.permission !== 'denied') dom.pushToggle.disabled = false; }
}

async function testBrowserPush() {
  dom.pushTest.disabled = true;
  try { await request('/api/push/test', { method: 'POST' }); dom.pushStatus.textContent = 'Test notification sent'; }
  catch (error) { dom.pushStatus.textContent = error.message; }
  finally { dom.pushTest.disabled = false; }
}

async function refreshNotifications() {
  try { state.notifications = await request('/api/notifications'); renderNotifications(); } catch (_) {}
}
function renderNotifications() {
  const unread = state.notifications.filter((item) => !item.read).length; dom.notificationCount.hidden = !unread; dom.notificationCount.textContent = unread > 9 ? '9+' : unread;
  dom.notificationList.innerHTML = state.notifications.map((item) => { const action = item.kind === 'mention' ? 'mentioned you' : item.kind === 'direct_message' ? 'sent you a message' : 'replied in a thread'; return `<button class="notification-item${item.read ? '' : ' unread'}" type="button" data-conversation="${escapeHtml(item.conversation_id)}" data-message-id="${escapeHtml(item.message_id)}"><strong>${escapeHtml(item.actor_name)} ${action}</strong><span>${escapeHtml(item.body)}</span><time>${new Intl.DateTimeFormat([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.created_at))}</time></button>`; }).join('') || '<div class="search-empty">You are all caught up.</div>';
  dom.notificationList.querySelectorAll('[data-conversation]').forEach((button) => button.addEventListener('click', () => { selectConversation(button.dataset.conversation, button.dataset.messageId); dom.notificationsPanel.hidden = true; }));
}

async function refreshConversations() {
  try { state.conversations = await request('/api/conversations'); renderConversations(); } catch (_) {}
}
async function catchUpMessages() {
  if (!state.selected) return;
  try {
    const fresh = await request(`/api/conversations/${state.selected}/messages?limit=50`);
    state.messages = fresh;
    state.hasOlder = fresh.length === 50;
    renderMessages();
    await request(`/api/conversations/${state.selected}/read`, { method: 'POST' });
  } catch (_) {}
}
function setStatus(text, online) {
  if (dom.status) dom.status.textContent = text;
  if (online) applyPresence(dom.profilePresence, state.currentUser);
  else if (dom.profilePresence) dom.profilePresence.classList.replace('online', 'offline');
  if (dom.headerDot) dom.headerDot.classList.toggle('online', online);
}
function connectSocket() {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const socket = new WebSocket(`${protocol}://${location.host}/ws`);
  state.socket = socket;
  socket.onopen = () => { state.reconnectAttempts = 0; setStatus('Live', true); };
  socket.onclose = () => {
    state.socket = null;
    if (state.currentUser) {
      setStatus('Reconnecting…', false);
      const delay = Math.min(2000 * Math.pow(2, state.reconnectAttempts), 30000);
      state.reconnectAttempts++;
      setTimeout(async () => {
        if (!state.currentUser) return;
        connectSocket();
        refreshConversations();
        catchUpMessages();
      }, delay);
    }
  };
  socket.onmessage = (event) => {
    let update;
    try { update = JSON.parse(event.data); } catch (_) { return; }
    if (update.type === 'message_created') {
      refreshConversations();
      refreshNotifications();
      if (update.data.sender?.kind === 'agent' && update.data.conversation_id === state.selected) {
        if (state.agentThinking?.agentId === update.data.sender.id) state.agentThinking = null;
      }
      if (update.data.conversation_id === state.selected && !state.messages.some((message) => message.id === update.data.id)) {
        state.messages.push(update.data);
        renderMessages();
        if (state.threadRoot && (update.data.parent_message_id === state.threadRoot.id || update.data.id === state.threadRoot.id)) renderThread();
      }
    } else if (update.type === 'message_updated') {
      const index = state.messages.findIndex((message) => message.id === update.data.id);
      if (index >= 0) { state.messages[index] = update.data; renderMessages(); if (state.threadRoot) renderThread(); }
    } else if (update.type === 'message_deleted') {
      const message = state.messages.find((item) => item.id === update.data.message_id);
      if (message) { message.body = 'Message deleted'; message.is_deleted = true; message.activity = null; message.attachments = []; renderMessages(); if (state.threadRoot) renderThread(); }
    } else if (update.type === 'typing' && update.data.principal.id !== state.currentUser?.id) {
      const key = `${update.data.conversation_id}:${update.data.principal.id}`;
      clearTimeout(state.remoteTyping.get(key)?.timer);
      if (update.data.active) {
        state.remoteTyping.set(key, { name: update.data.principal.display_name, conversation: update.data.conversation_id, timer: setTimeout(() => { state.remoteTyping.delete(key); renderTyping(); }, 3500) });
      } else state.remoteTyping.delete(key);
      renderTyping();
    } else if (update.type === 'presence_updated') {
      const user = state.users.find((item) => item.id === update.data.id);
      if (user) user.presence = update.data.presence;
      if (state.currentUser?.id === update.data.id) { state.currentUser.presence = update.data.presence; renderProfile(); }
      renderConversations();
      if (!dom.membersPopover.hidden && state.conversationMembers[state.selected]) renderMembersPopover(state.conversationMembers[state.selected]);
    } else if (update.type === 'reasoning_update') {
      if (update.data.conversation_id === state.selected) {
        state.agentThinking = null;
        if (!state.streamingReasoning || state.streamingReasoning.agentId !== update.data.principal?.id || state.streamingReasoning.parentMessageId !== (update.data.parent_message_id || null)) {
          state.streamingReasoning = { agentId: update.data.principal?.id, name: update.data.principal?.display_name, content: '', parentMessageId: update.data.parent_message_id || null, conversationId: state.selected, done: false };
          state._thinkingStart = Date.now();
        }
        if (state.streamingReasoning) {
          if (update.data.done) state.streamingReasoning.done = true;
          if (update.data.parent_message_id) state.streamingReasoning.parentMessageId = update.data.parent_message_id;
          if (update.data.content) state.streamingReasoning.content = update.data.content;
          renderMessages();
          if (state.threadRoot && state.streamingReasoning.parentMessageId === state.threadRoot.id) renderThread();
        }
        if (update.data.done) {
          const reasoningRef = state.streamingReasoning;
          const doneEl = dom.feed.querySelector('.thinking-done');
          if (doneEl) doneEl.classList.add('thinking-fade-out');
          const isError = update.data.content?.startsWith('Unable to reach');
          if (isError) {
            state.messages.push({ id: `error-${Date.now()}`, sender: update.data.principal, body: update.data.content, created_at: new Date().toISOString(), conversation_id: state.selected, is_system: true });
            requestAnimationFrame(() => { dom.feed.scrollTop = dom.feed.scrollHeight; });
          }
          setTimeout(() => {
            if (state.streamingReasoning === reasoningRef) {
              state.streamingReasoning = null;
              state._thinkingStart = null;
              if (!isError) { renderMessages(); if (state.threadRoot) renderThread(); }
            }
          }, isError ? 0 : 800);
        }
      }
    }
  };
}

function renderTyping() {
  const names = [...state.remoteTyping.values()].filter((item) => item.conversation === state.selected).map((item) => item.name);
  dom.typingIndicator.hidden = !names.length;
  dom.typingIndicator.textContent = names.length ? `${names.slice(0, 2).join(', ')} ${names.length === 1 ? 'is' : 'are'} typing…` : '';
}

function sendTyping(active) {
  if (!state.selected) return;
  request(`/api/conversations/${state.selected}/typing`, { method: 'POST', body: JSON.stringify({ active }) }).catch(() => {});
}

let searchTimer;
async function performSearch() {
  clearTimeout(searchTimer);
  const term = dom.search.value.trim();
  if (!term) { closeSearch(); return; }
  searchTimer = setTimeout(async () => {
    try {
      const params = new URLSearchParams({ q: term });
      if (dom.searchConversation.value) params.set('conversation_id', dom.searchConversation.value);
      if (dom.searchSender.value) params.set('sender_id', dom.searchSender.value);
      if (dom.searchMedia.value) params.set('media_type', dom.searchMedia.value);
      const results = await request(`/api/search?${params}`);
      dom.searchResults.hidden = false;
      dom.searchSummary.textContent = `${results.length} result${results.length === 1 ? '' : 's'} for “${term}”`;
      dom.searchResultList.innerHTML = results.slice(0, 8).map((message) => `<button class="search-result" type="button" data-conversation="${escapeHtml(message.conversation_id)}" data-message-id="${escapeHtml(message.id)}"><strong>${escapeHtml(message.sender.display_name)}</strong><span>${escapeHtml(message.body)}</span></button>`).join('') || '<div class="search-empty">No messages found.</div>';
      dom.searchResultList.querySelectorAll('[data-conversation]').forEach((item) => item.addEventListener('click', () => { selectConversation(item.dataset.conversation, item.dataset.messageId); closeSearch(); }));
    } catch (_) {}
  }, 250);
}
dom.search.addEventListener('input', performSearch);
[dom.searchConversation, dom.searchSender, dom.searchMedia].forEach((select) => select.addEventListener('change', performSearch));
function closeSearch() { dom.searchResults.hidden = true; dom.searchResultList.innerHTML = ''; }
function openMobileSidebar() { dom.sidebar.classList.add('open'); dom.mobileBackdrop.hidden = false; document.body.classList.add('drawer-open'); }
function closeMobileSidebar() { dom.sidebar.classList.remove('open'); dom.mobileBackdrop.hidden = true; document.body.classList.remove('drawer-open'); }
function resizeTextArea(input) { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, input === dom.input && state.richMode ? 236 : 132)}px`; }
function resizeComposer() { resizeTextArea(dom.input); }

function setRichMode(enabled) {
  state.richMode = enabled;
  dom.composer.classList.toggle('rich-mode', enabled);
  dom.composerMode.setAttribute('aria-pressed', String(enabled));
  dom.composerMode.setAttribute('aria-label', enabled ? 'Use compact composer' : 'Enable rich composer');
  dom.composerMode.title = enabled ? 'Use compact composer' : 'Expand composer';
  dom.richComposerTools.hidden = !enabled;
  dom.composerHint.textContent = enabled ? 'Rich mode · Enter adds a line · Ctrl / ⌘ + Enter sends' : 'Enter to send · Shift + Enter for a new line';
  resizeComposer();
  dom.input.focus();
}

function insertListMarker(marker) {
  const start = dom.input.selectionStart;
  const end = dom.input.selectionEnd;
  const value = dom.input.value;
  const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const selected = value.slice(start, end);
  if (selected.includes('\n')) {
    const lines = selected.split('\n').map((line, index) => `${marker === '1. ' ? `${index + 1}. ` : marker}${line}`);
    dom.input.setRangeText(lines.join('\n'), start, end, 'end');
  } else {
    const prefix = start === lineStart ? marker : `\n${marker}`;
    dom.input.setRangeText(prefix, start, end, 'end');
  }
  dom.input.dispatchEvent(new Event('input', { bubbles: true }));
}

dom.filters.forEach((button) => button.addEventListener('click', () => {
  state.filter = button.dataset.filter;
  dom.filters.forEach((item) => item.classList.toggle('active', item === button));
  renderConversations();
}));
dom.composer.addEventListener('submit', sendMessage);
dom.threadComposer.addEventListener('submit', sendThreadReply);
dom.cancelReply.addEventListener('click', () => { state.replyTo = null; renderReply(); });
dom.closeThread.addEventListener('click', closeThread);
dom.openSidebar.addEventListener('click', openMobileSidebar);
dom.closeSidebar.addEventListener('click', closeMobileSidebar);
dom.mobileBackdrop.addEventListener('click', closeMobileSidebar);
dom.closeSearch.addEventListener('click', () => { dom.search.value = ''; closeSearch(); });
dom.input.addEventListener('input', () => {
  resizeComposer();
  sendTyping(Boolean(dom.input.value.trim()));
  clearTimeout(state.typingTimer);
  state.typingTimer = setTimeout(() => sendTyping(false), 2200);
  clearTimeout(state.draftTimer);
  const draftConversationId = state.selected;
  const draftValue = dom.input.value;
  state.draftTimer = setTimeout(() => { if (draftConversationId) request(`/api/conversations/${draftConversationId}/draft`, { method: 'PUT', body: JSON.stringify({ body: draftValue }) }).catch(() => {}); }, 500);
  renderMentionSuggestions();
  updateSendButton();
});
dom.threadInput.addEventListener('input', () => resizeTextArea(dom.threadInput));
dom.threadAttachmentButton.addEventListener('click', () => dom.threadAttachmentInput.click());
dom.threadAttachmentInput.addEventListener('change', () => uploadThreadFiles([...dom.threadAttachmentInput.files]));
dom.input.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.isComposing) return;
  if (state.richMode) {
    if (event.metaKey || event.ctrlKey) { event.preventDefault(); dom.composer.requestSubmit(); }
    return;
  }
  if (!event.shiftKey) { event.preventDefault(); dom.composer.requestSubmit(); }
});
dom.threadInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); dom.threadComposer.requestSubmit(); }
});
dom.openSettings.addEventListener('click', openSettings);
dom.closeSettings.addEventListener('click', closeSettings);
dom.showPersonalSettings.addEventListener('click', showPersonalSettings);
dom.openWorkspaceSettings.addEventListener('click', () => openWorkspaceAdministration());
dom.themePreference.addEventListener('change', () => applyTheme(dom.themePreference.value));
dom.composerMode.addEventListener('click', () => setRichMode(!state.richMode));
dom.bulletList.addEventListener('click', () => insertListMarker('• '));
dom.numberList.addEventListener('click', () => insertListMarker('1. '));
dom.settingsUnlockForm.addEventListener('submit', unlockSettings);
dom.settingsForm.addEventListener('submit', saveSettings);
dom.settingsForm.addEventListener('input', updateSettingsSaveState);
dom.settingsLock.addEventListener('click', lockSettings);
dom.loginForm.addEventListener('submit', (event) => submitAuth(event, '/api/auth/login'));
dom.setupForm.addEventListener('submit', (event) => submitAuth(event, '/api/auth/setup'));
dom.registerForm.addEventListener('submit', (event) => submitAuth(event, '/api/auth/register'));
dom.resetForm.addEventListener('submit', submitReset);
dom.inviteForm.addEventListener('submit', (event) => submitAuth(event, '/api/invites/accept'));
dom.mockAdminLogin.addEventListener('click', mockAdminLogin);
dom.authLinks.querySelectorAll('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => showAuth(button.dataset.authMode)));
dom.logoutButton.addEventListener('click', logout);
dom.changePasswordButton.addEventListener('click', changeOwnPassword);
dom.newForum.addEventListener('click', openNewForum);
dom.newDirectMessage.addEventListener('click', openNewDirectMessage);
dom.manageConversation.addEventListener('click', openManageConversation);
dom.conversationMembers.addEventListener('click', toggleMembersPopover);
dom.createHuman.addEventListener('click', () => openCreatePrincipal('human'));
dom.createAgent.addEventListener('click', () => openCreatePrincipal('agent'));
dom.createInvite.addEventListener('click', openCreateInvite);
dom.testWebhook.addEventListener('click', sendWebhookTest);
dom.refreshWebhooks.addEventListener('click', refreshWebhookDeliveries);
dom.openOpenClawWizard.addEventListener('click', openOpenClawWizard);
dom.refreshOpenClaw.addEventListener('click', refreshOpenClawStatus);
dom.runRetention.addEventListener('click', runRetentionCleanup);
dom.attachmentButton.addEventListener('click', () => dom.attachmentInput.click());
dom.attachmentInput.addEventListener('change', () => uploadFiles([...dom.attachmentInput.files]));
dom.loadOlder.addEventListener('click', loadOlderMessages);
dom.notificationsButton.addEventListener('click', async () => { dom.notificationsPanel.hidden = !dom.notificationsPanel.hidden; if (!dom.notificationsPanel.hidden) { await refreshNotifications(); await request('/api/notifications/read', { method: 'POST' }); state.notifications.forEach((item) => { item.read = true; }); renderNotifications(); } });
dom.closeNotifications.addEventListener('click', () => { dom.notificationsPanel.hidden = true; });
dom.pushToggle.addEventListener('click', togglePush);
dom.pushTest.addEventListener('click', testBrowserPush);
dom.threadSubscribe.addEventListener('click', async () => { if (!state.threadRoot) return; const following = await request(`/api/threads/${state.threadRoot.id}/subscribe`, { method: 'POST' }); dom.threadSubscribe.textContent = following ? 'Following' : 'Follow'; });
dom.closeMediaViewer.addEventListener('click', () => { dom.mediaViewer.hidden = true; dom.mediaViewerContent.innerHTML = ''; });
dom.mediaViewer.addEventListener('click', (event) => { if (event.target === dom.mediaViewer) dom.closeMediaViewer.click(); });
dom.closeWorkspaceModal.addEventListener('click', closeWorkspaceModal);
dom.workspaceModalCancel.addEventListener('click', closeWorkspaceModal);
dom.workspaceModal.addEventListener('click', (event) => { if (event.target === dom.workspaceModal) closeWorkspaceModal(); });
dom.workspaceModalForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.modalSubmit) return;
  dom.workspaceModalSubmit.disabled = true;
  dom.workspaceModalError.hidden = true;
  try { await state.modalSubmit(event.currentTarget); }
  catch (error) { dom.workspaceModalError.textContent = error.message; dom.workspaceModalError.hidden = false; }
  finally { dom.workspaceModalSubmit.disabled = false; }
});
dom.settingsOverlay.addEventListener('click', (event) => { if (event.target === dom.settingsOverlay) closeSettings(); });
document.querySelectorAll('[data-settings-tab]').forEach((button) => button.addEventListener('click', () => selectSettingsTab(button.dataset.settingsTab)));
document.querySelectorAll('.copy-endpoint').forEach((button) => button.addEventListener('click', async () => {
  const value = document.querySelector(`#${button.dataset.copyTarget}`).textContent;
  try {
    await navigator.clipboard.writeText(value);
    const label = button.textContent;
    button.textContent = 'Copied';
    window.setTimeout(() => { button.textContent = label; }, 1400);
  } catch (_) { button.textContent = 'Copy failed'; }
}));
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (window.matchMedia('(max-width: 760px)').matches) openMobileSidebar();
    dom.search.focus();
  }
  if (event.key === 'Escape') {
    if (!dom.workspaceModal.hidden) closeWorkspaceModal();
    else if (!dom.settingsOverlay.hidden) closeSettings();
    else if (!dom.messageActionsPopover.hidden) closeMessageActionsPopover();
    else if (!dom.membersPopover.hidden) closeMembersPopover();
    else { closeSearch(); closeMobileSidebar(); closeThread(); }
  }
});
document.addEventListener('click', (event) => {
  if (!dom.membersPopover.hidden && !dom.membersPopover.contains(event.target) && !dom.conversationMembers.contains(event.target)) closeMembersPopover();
});
initializeAuth();
