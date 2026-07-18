const state = { conversations: [], selected: null, messages: [], currentUser: null, replyTo: null, threadRoot: null, socket: null, filter: 'all', adminToken: null, adminSettings: null, settingsTab: 'workspace', authStatus: null, users: [], modalSubmit: null, typingTimer: null, draftTimer: null, remoteTyping: new Map(), pendingAttachments: [], hasOlder: false, notifications: [], pushRegistration: null, pushConfiguration: null };
const dom = {
  list: document.querySelector('#conversations'), feed: document.querySelector('#messages'), title: document.querySelector('#conversation-title'),
  kind: document.querySelector('#conversation-kind'), description: document.querySelector('#conversation-description'), status: document.querySelector('#connection-status'),
  dot: document.querySelector('#connection-dot'), input: document.querySelector('#message-input'), composer: document.querySelector('#composer'), search: document.querySelector('#search'),
  searchResults: document.querySelector('#search-results'), searchResultList: document.querySelector('#search-result-list'), searchSummary: document.querySelector('#search-summary'),
  replyState: document.querySelector('#reply-state'), replyCopy: document.querySelector('#reply-copy'), cancelReply: document.querySelector('#cancel-reply'),
  sidebar: document.querySelector('#sidebar'), mobileBackdrop: document.querySelector('#mobile-backdrop'), openSidebar: document.querySelector('#open-sidebar'), closeSidebar: document.querySelector('#close-sidebar'),
  closeSearch: document.querySelector('#close-search'), conversationCount: document.querySelector('#conversation-count'), channelSymbol: document.querySelector('#channel-symbol'),
  profileName: document.querySelector('#profile-name'), profileAvatar: document.querySelector('#profile-avatar'), filters: [...document.querySelectorAll('.filter')],
  appShell: document.querySelector('.app-shell'), threadPanel: document.querySelector('#thread-panel'), threadRoot: document.querySelector('#thread-root'),
  threadMessages: document.querySelector('#thread-messages'), threadCount: document.querySelector('#thread-count'), closeThread: document.querySelector('#close-thread'),
  threadComposer: document.querySelector('#thread-composer'), threadInput: document.querySelector('#thread-input'),
  openSettings: document.querySelector('#open-settings'), settingsOverlay: document.querySelector('#settings-overlay'), closeSettings: document.querySelector('#close-settings'),
  settingsUnlock: document.querySelector('#settings-unlock'), settingsWorkspace: document.querySelector('#settings-workspace'), settingsUnlockForm: document.querySelector('#settings-unlock-form'),
  adminToken: document.querySelector('#admin-token'), settingsUnlockError: document.querySelector('#settings-unlock-error'), settingsForm: document.querySelector('#settings-form'),
  settingsFormError: document.querySelector('#settings-form-error'), settingsSaveStatus: document.querySelector('#settings-save-status'), settingsLock: document.querySelector('#settings-lock'),
  settingsUsers: document.querySelector('#settings-users'), humanCount: document.querySelector('#human-count'), agentCount: document.querySelector('#agent-count'),
  authOverlay: document.querySelector('#auth-overlay'), authTitle: document.querySelector('#auth-title'), authEyebrow: document.querySelector('#auth-eyebrow'), authDescription: document.querySelector('#auth-description'),
  authError: document.querySelector('#auth-error'), loginForm: document.querySelector('#login-form'), setupForm: document.querySelector('#setup-form'), registerForm: document.querySelector('#register-form'), resetForm: document.querySelector('#reset-form'), inviteForm: document.querySelector('#invite-form'),
  authLinks: document.querySelector('#auth-links'), logoutButton: document.querySelector('#logout-button'), changePasswordButton: document.querySelector('#change-password-button'),
  currentPassword: document.querySelector('#current-password'), newPassword: document.querySelector('#new-password'), mockAdminLogin: document.querySelector('#mock-admin-login'),
  newConversation: document.querySelector('#new-conversation'), manageConversation: document.querySelector('#manage-conversation'), typingIndicator: document.querySelector('#typing-indicator'),
  attachmentButton: document.querySelector('#attachment-button'), attachmentInput: document.querySelector('#attachment-input'), pendingAttachments: document.querySelector('#pending-attachments'), loadOlder: document.querySelector('#load-older'),
  notificationsButton: document.querySelector('#notifications-button'), notificationCount: document.querySelector('#notification-count'), notificationsPanel: document.querySelector('#notifications-panel'), notificationList: document.querySelector('#notification-list'), closeNotifications: document.querySelector('#close-notifications'),
  pushToggle: document.querySelector('#push-toggle'), pushTest: document.querySelector('#push-test'), pushStatus: document.querySelector('#push-status'),
  searchConversation: document.querySelector('#search-conversation'), searchSender: document.querySelector('#search-sender'), searchMedia: document.querySelector('#search-media'), threadSubscribe: document.querySelector('#thread-subscribe'),
  mediaViewer: document.querySelector('#media-viewer'), mediaViewerContent: document.querySelector('#media-viewer-content'), closeMediaViewer: document.querySelector('#close-media-viewer'),
  mentionSuggestions: document.querySelector('#mention-suggestions'),
  testWebhook: document.querySelector('#test-webhook'), refreshWebhooks: document.querySelector('#refresh-webhooks'), webhookDeliveries: document.querySelector('#webhook-deliveries'),
  runRetention: document.querySelector('#run-retention'), retentionStatus: document.querySelector('#retention-status'),
  createHuman: document.querySelector('#create-human'), createAgent: document.querySelector('#create-agent'), createInvite: document.querySelector('#create-invite'),
  workspaceModal: document.querySelector('#workspace-modal'), workspaceModalTitle: document.querySelector('#workspace-modal-title'), workspaceModalBody: document.querySelector('#workspace-modal-body'), workspaceModalForm: document.querySelector('#workspace-modal-form'), workspaceModalError: document.querySelector('#workspace-modal-error'), closeWorkspaceModal: document.querySelector('#close-workspace-modal'), workspaceModalCancel: document.querySelector('#workspace-modal-cancel'), workspaceModalSubmit: document.querySelector('#workspace-modal-submit')
};

const iconFor = (kind) => ({ channel: '#', group: '◉', direct: '@' }[kind] || '•');
const labelFor = (kind) => ({ channel: 'Channel', group: 'Group chat', direct: 'Direct message' }[kind] || 'Conversation');
const escapeHtml = (value) => value.replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
const currentConversation = () => state.conversations.find((conversation) => conversation.id === state.selected);

async function request(path, options = {}) {
  const { headers = {}, ...rest } = options;
  const requestHeaders = rest.body instanceof FormData ? { ...headers } : { 'content-type': 'application/json', ...headers };
  const response = await fetch(path, { ...rest, headers: requestHeaders });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `Request failed (${response.status})`);
  if (response.status === 204) return null;
  return response.json();
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
  if (state.adminSettings) { showSettingsWorkspace(); return; }
  if (state.currentUser?.access_role === 'admin') {
    try {
      state.adminSettings = await request('/api/admin/settings');
      showSettingsWorkspace();
      return;
    } catch (error) {
      dom.settingsUnlockError.textContent = error.message;
    }
  }
  window.setTimeout(() => dom.adminToken.focus(), 80);
}

function closeSettings() {
  dom.settingsOverlay.hidden = true;
  document.body.classList.remove('settings-visible');
  dom.settingsSaveStatus.textContent = '';
}

function lockSettings() {
  state.adminToken = null;
  state.adminSettings = null;
  dom.adminToken.value = '';
  dom.settingsForm.reset();
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
  dom.settingsUnlock.hidden = true;
  dom.settingsWorkspace.hidden = false;
  fillSettingsForm();
  selectSettingsTab(state.settingsTab);
  try { renderSettingsUsers(await request(state.currentUser?.access_role === 'admin' ? '/api/admin/principals' : '/api/users')); } catch (_) { renderSettingsUsers([]); }
  refreshWebhookDeliveries();
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

async function runRetentionCleanup() {
  dom.runRetention.disabled = true; dom.retentionStatus.textContent = 'Cleaning…';
  try { const result = await request('/api/admin/retention/run', { method: 'POST' }); dom.retentionStatus.textContent = `Complete · ${result.removed_objects} stored object${result.removed_objects === 1 ? '' : 's'} removed`; }
  catch (error) { dom.retentionStatus.textContent = error.message; }
  finally { dom.runRetention.disabled = false; }
}

function openWorkspaceModal(title, body, submit) {
  dom.workspaceModalTitle.textContent = title;
  dom.workspaceModalBody.innerHTML = body;
  dom.workspaceModalError.hidden = true;
  state.modalSubmit = submit;
  dom.workspaceModal.hidden = false;
  window.setTimeout(() => dom.workspaceModalBody.querySelector('input,textarea,select')?.focus(), 70);
}

function closeWorkspaceModal() {
  dom.workspaceModal.hidden = true;
  dom.workspaceModalBody.innerHTML = '';
  state.modalSubmit = null;
}

const memberChecklist = (selected = []) => `<div class="member-picker">${state.users.filter((user) => !user.disabled).map((user) => `<label><input type="checkbox" name="member_ids" value="${escapeHtml(user.id)}" ${selected.includes(user.id) ? 'checked' : ''}/><span class="settings-user-avatar ${user.kind === 'agent' ? 'agent' : ''}">${escapeHtml(user.display_name[0])}</span><span><strong>${escapeHtml(user.display_name)}</strong><small>${escapeHtml(user.kind)}</small></span></label>`).join('')}</div>`;

async function openNewConversation() {
  if (!state.users.length) state.users = await request('/api/users');
  openWorkspaceModal('New conversation', `<div class="settings-field-grid"><label class="settings-field"><span>Type</span><select name="kind"><option value="group">Group chat</option><option value="direct">Direct message</option>${state.currentUser?.access_role === 'admin' ? '<option value="channel">Channel</option>' : ''}</select></label><label class="settings-field"><span>Name</span><input name="title" maxlength="80" required /></label></div><label class="settings-field"><span>Topic or description</span><input name="description" /></label><label class="settings-toggle"><span><strong>Private conversation</strong><small>Only selected members can access it.</small></span><input name="is_private" type="checkbox" checked/><i></i></label><div><span class="modal-label">Members</span>${memberChecklist([state.currentUser.id])}</div>`, async (form) => {
    const payload = { kind: form.kind.value, title: form.title.value, description: form.description.value || null, is_private: form.is_private.checked, member_ids: [...form.querySelectorAll('[name="member_ids"]:checked')].map((item) => item.value) };
    const conversation = await request('/api/conversations', { method: 'POST', body: JSON.stringify(payload) });
    state.conversations = await request('/api/conversations');
    closeWorkspaceModal(); await selectConversation(conversation.id);
  });
}

async function openManageConversation() {
  const conversation = currentConversation();
  if (!conversation) return;
  const members = await request(`/api/admin/conversations/${conversation.id}/members`);
  openWorkspaceModal('Manage conversation', `<label class="settings-field"><span>Name</span><input name="title" maxlength="80" value="${escapeHtml(conversation.title)}" required /></label><label class="settings-field"><span>Topic or description</span><input name="description" value="${escapeHtml(conversation.description || '')}" /></label><div class="settings-field-grid"><label class="settings-toggle"><span><strong>Private</strong></span><input name="is_private" type="checkbox" ${conversation.is_private ? 'checked' : ''}/><i></i></label><label class="settings-toggle"><span><strong>Archived</strong></span><input name="archived" type="checkbox" ${conversation.archived ? 'checked' : ''}/><i></i></label></div><div><span class="modal-label">Members</span>${memberChecklist(members.map((member) => member.id))}</div><button id="delete-conversation" class="danger-button" type="button">Delete conversation</button>`, async (form) => {
    await request(`/api/admin/conversations/${conversation.id}`, { method: 'POST', body: JSON.stringify({ title: form.title.value, description: form.description.value || null, is_private: form.is_private.checked, archived: form.archived.checked }) });
    await request(`/api/admin/conversations/${conversation.id}/members`, { method: 'POST', body: JSON.stringify({ member_ids: [...form.querySelectorAll('[name="member_ids"]:checked')].map((item) => item.value) }) });
    closeWorkspaceModal(); state.conversations = await request('/api/conversations'); state.selected = state.conversations[0]?.id || null; if (state.selected) await selectConversation(state.selected); else render();
  });
  document.querySelector('#delete-conversation').addEventListener('click', async () => { if (!window.confirm(`Delete ${conversation.title} and all of its messages?`)) return; await request(`/api/admin/conversations/${conversation.id}/delete`, { method: 'POST' }); closeWorkspaceModal(); state.conversations = await request('/api/conversations'); state.selected = state.conversations[0]?.id || null; if (state.selected) await selectConversation(state.selected); else render(); });
}

function openCreatePrincipal(kind) {
  const human = kind === 'human';
  openWorkspaceModal(human ? 'Add person' : 'Add agent', `<div class="settings-field-grid"><label class="settings-field"><span>Display name</span><input name="display_name" required /></label><label class="settings-field"><span>Username</span><input name="username" pattern="[A-Za-z0-9_-]+" required /></label></div>${human ? '<label class="settings-field"><span>Email</span><input name="email" type="email" required /></label><label class="settings-field"><span>Access role</span><select name="access_role"><option value="member">Member</option><option value="guest">Guest</option><option value="admin">Administrator</option></select></label><p class="settings-help">Use an invitation or password-reset token to let this person establish a password.</p>' : '<input name="access_role" value="agent" type="hidden" />'}`, async (form) => {
    await request('/api/admin/principals', { method: 'POST', body: JSON.stringify({ kind, display_name: form.display_name.value, username: form.username.value, email: human ? form.email.value : null, access_role: form.access_role.value }) });
    closeWorkspaceModal(); state.users = await request('/api/admin/principals'); renderSettingsUsers(state.users);
  });
}

function openCreateInvite() {
  openWorkspaceModal('Create invitation', `<label class="settings-field"><span>Email (optional)</span><input name="email" type="email" /></label><div class="settings-field-grid"><label class="settings-field"><span>Role</span><select name="access_role"><option value="member">Member</option><option value="guest">Guest</option><option value="admin">Administrator</option></select></label><label class="settings-field"><span>Expires in</span><select name="expires_in_days"><option value="1">1 day</option><option value="7" selected>7 days</option><option value="30">30 days</option></select></label></div>`, async (form) => {
    const invite = await request('/api/admin/invites', { method: 'POST', body: JSON.stringify({ email: form.email.value || null, access_role: form.access_role.value, expires_in_days: Number(form.expires_in_days.value) }) });
    closeWorkspaceModal(); window.prompt('Copy this invitation token and send it securely. It is shown only once.', invite.token);
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
      ? `<select class="settings-role-select" data-role-user="${escapeHtml(user.id)}" aria-label="Access role for ${escapeHtml(user.display_name)}">${['admin', 'member', 'guest'].map((option) => `<option value="${option}" ${option === user.access_role ? 'selected' : ''}>${option}</option>`).join('')}</select>`
      : `<b>${role}</b>`;
    const securityAction = state.currentUser?.access_role === 'admin' ? `<button class="settings-inline-button" type="button" data-edit-user="${escapeHtml(user.id)}">Edit</button>${user.kind === 'human' ? `<button class="settings-inline-button" type="button" data-reset-user="${escapeHtml(user.id)}">Reset</button>` : `<button class="settings-inline-button" type="button" data-agent-key="${escapeHtml(user.id)}">New key</button>`}` : '';
    return `<div class="settings-user ${user.disabled ? 'disabled' : ''}"><span class="settings-user-avatar ${user.kind === 'agent' ? 'agent' : ''}">${escapeHtml(user.display_name.slice(0, 1).toUpperCase())}</span><span><strong>${escapeHtml(user.display_name)}</strong><small>@${escapeHtml(user.username)}${user.disabled ? ' · disabled' : ''}</small></span><span class="settings-user-actions">${roleControl}${securityAction}</span><i class="dot ${user.presence === 'online' || user.presence === 'working' ? 'online' : ''}"></i></div>`;
  }).join('') || '<p class="settings-help">No principals found.</p>';
  dom.settingsUsers.querySelectorAll('[data-role-user]').forEach((select) => select.addEventListener('change', async () => {
    select.disabled = true;
    try {
      await request(`/api/admin/users/${encodeURIComponent(select.dataset.roleUser)}/access`, { method: 'POST', body: JSON.stringify({ access_role: select.value, disabled: false }) });
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
      window.prompt('Copy this one-time password reset token. It expires in 30 minutes.', result.token);
    } catch (error) { dom.settingsFormError.textContent = error.message; dom.settingsFormError.hidden = false; }
    finally { button.disabled = false; }
  }));
  dom.settingsUsers.querySelectorAll('[data-agent-key]').forEach((button) => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const result = await request(`/api/admin/agents/${encodeURIComponent(button.dataset.agentKey)}/keys`, { method: 'POST', body: JSON.stringify({ name: 'Admin-created key', scopes: ['messages:write', 'activity:write'] }) });
      window.prompt('Copy this agent key now. Haco will not display it again.', result.token);
    } catch (error) { dom.settingsFormError.textContent = error.message; dom.settingsFormError.hidden = false; }
    finally { button.disabled = false; }
  }));
  dom.settingsUsers.querySelectorAll('[data-edit-user]').forEach((button) => button.addEventListener('click', () => openEditPrincipal(users.find((user) => user.id === button.dataset.editUser))));
}

function selectSettingsTab(tab) {
  state.settingsTab = tab;
  document.querySelectorAll('[data-settings-tab]').forEach((button) => button.classList.toggle('active', button.dataset.settingsTab === tab));
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
    dom.profileName.textContent = data.current_user.display_name;
    dom.profileAvatar.textContent = data.current_user.display_name.slice(0, 1).toUpperCase();
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

function render() { renderConversations(); renderHeader(); renderMessages(); }

function renderConversations() {
  dom.list.innerHTML = '';
  const filtered = state.conversations.filter((conversation) => state.filter === 'all' || conversation.kind === state.filter);
  dom.conversationCount.textContent = `${filtered.length}`;
  filtered.forEach((conversation) => {
    const fragment = document.querySelector('#conversation-template').content.cloneNode(true);
    const button = fragment.querySelector('button');
    button.classList.toggle('active', conversation.id === state.selected);
    button.querySelector('.conversation-icon').textContent = iconFor(conversation.kind);
    button.querySelector('strong').textContent = conversation.title;
    button.querySelector('small').textContent = conversation.last_message_preview || conversation.description || 'No messages yet';
    const unread = button.querySelector('.unread-badge');
    unread.hidden = !conversation.unread_count;
    unread.textContent = conversation.unread_count > 99 ? '99+' : conversation.unread_count;
    button.addEventListener('click', () => selectConversation(conversation.id));
    dom.list.append(fragment);
  });
  if (!filtered.length) dom.list.innerHTML = '<p class="empty-list">No conversations here yet.</p>';
}

function renderHeader() {
  const conversation = currentConversation();
  dom.title.textContent = conversation ? `${iconFor(conversation.kind)} ${conversation.title}` : 'No conversation selected';
  dom.kind.textContent = conversation ? labelFor(conversation.kind) : '';
  dom.description.textContent = conversation?.description || '';
  dom.channelSymbol.textContent = conversation ? iconFor(conversation.kind) : '•';
  dom.manageConversation.hidden = state.currentUser?.access_role !== 'admin' || !conversation;
}

function renderMessages() {
  dom.feed.innerHTML = '';
  const visibleMessages = currentConversation()?.kind === 'channel'
    ? state.messages.filter((message) => !message.parent_message_id)
    : state.messages;
  visibleMessages.forEach((message) => dom.feed.append(createMessageNode(message)));
  if (!visibleMessages.length) dom.feed.innerHTML = '<div class="empty-feed"><span>✦</span><strong>No messages yet</strong><p>Start the conversation with a person or agent.</p></div>';
  dom.loadOlder.hidden = !state.hasOlder;
  dom.feed.scrollTop = dom.feed.scrollHeight;
}

function createMessageNode(message, options = {}) {
  const fragment = document.querySelector('#message-template').content.cloneNode(true);
  const article = fragment.querySelector('article');
  article.classList.toggle('agent', message.sender.kind === 'agent');
  article.classList.toggle('own', message.sender.id === state.currentUser?.id);
  article.classList.toggle('thread-context', Boolean(options.thread));
  article.querySelector('.avatar').textContent = message.sender.display_name.slice(0, 1).toUpperCase();
  article.querySelector('.message-meta strong').textContent = message.sender.display_name;
  article.querySelector('.principal-kind').textContent = message.sender.kind;
  article.querySelector('time').textContent = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' }).format(new Date(message.created_at));
  article.querySelector('.message-body').textContent = message.body;
  article.classList.toggle('deleted', Boolean(message.is_deleted));
  article.querySelector('.edited-label').hidden = !message.edited_at;
  if (message.activity) {
    const activity = article.querySelector('.activity');
    activity.hidden = false;
    activity.querySelector('.activity-title').textContent = `${message.activity.status} · ${message.activity.tool_name || 'agent activity'}`;
    activity.querySelector('p').textContent = message.activity.summary;
  }
  if (message.reasoning) {
    const reasoning = article.querySelector('.reasoning-trace');
    reasoning.hidden = false;
    reasoning.querySelector('pre').textContent = message.reasoning.content;
    reasoning.querySelector('small').textContent = `Stored until ${new Intl.DateTimeFormat([], { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(message.reasoning.expires_at))}`;
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
      item = document.createElement('a'); item.className = 'attachment'; item.href = attachment.url; item.textContent = `📎 ${attachment.file_name} · ${formatBytes(attachment.byte_size)}`; item.target = '_blank';
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
  if (!options.thread && currentConversation()?.kind === 'channel' && replies.length) {
    threadButton.hidden = false;
    threadButton.textContent = `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'} →`;
    threadButton.addEventListener('click', () => openThread(message));
  }
  const canManageMessage = !message.is_deleted && (message.sender.id === state.currentUser?.id || state.currentUser?.access_role === 'admin');
  const editButton = article.querySelector('.edit-message');
  const deleteButton = article.querySelector('.delete-message');
  editButton.hidden = !canManageMessage;
  deleteButton.hidden = !canManageMessage;
  editButton.addEventListener('click', () => openEditMessage(message));
  deleteButton.addEventListener('click', () => removeMessage(message));
  article.querySelector('.react-message').addEventListener('click', () => chooseReaction(message));
  const pinButton = article.querySelector('.pin-message'); pinButton.textContent = message.is_pinned ? 'Unpin' : 'Pin'; pinButton.addEventListener('click', () => toggleMessageState(message, 'pin'));
  const saveButton = article.querySelector('.save-message'); saveButton.textContent = message.is_saved ? 'Saved' : 'Save'; saveButton.addEventListener('click', () => toggleMessageState(message, 'save'));
  return article;
}

const formatBytes = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
function openMedia(attachment) { dom.mediaViewerContent.innerHTML = `<img src="${escapeHtml(attachment.url)}" alt="${escapeHtml(attachment.file_name)}">`; dom.mediaViewer.hidden = false; }
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

async function selectConversation(id) {
  state.selected = id;
  state.replyTo = null;
  closeThread();
  renderConversations();
  renderHeader();
  renderReply();
  closeMobileSidebar();
  renderTyping();
  state.pendingAttachments = []; renderPendingAttachments();
  try {
    state.messages = await request(`/api/conversations/${id}/messages?limit=50`);
    state.hasOlder = state.messages.length === 50;
    const draft = await request(`/api/conversations/${id}/draft`);
    dom.input.value = draft.body || ''; resizeComposer();
    renderMessages();
    await request(`/api/conversations/${id}/read`, { method: 'POST' });
    const conversation = currentConversation();
    if (conversation) conversation.unread_count = 0;
    renderConversations();
  } catch (error) { setStatus(error.message, false); }
}

function setReply(message) {
  if (currentConversation()?.kind === 'channel') {
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
  const replies = state.messages.filter((message) => message.parent_message_id === state.threadRoot.id);
  dom.threadRoot.innerHTML = '';
  dom.threadMessages.innerHTML = '';
  dom.threadRoot.append(createMessageNode(state.threadRoot, { thread: true }));
  replies.forEach((reply) => dom.threadMessages.append(createMessageNode(reply, { thread: true })));
  dom.threadCount.textContent = `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`;
  if (!replies.length) dom.threadMessages.innerHTML = '<div class="thread-empty">No replies yet. Start the thread below.</div>';
  dom.threadMessages.scrollTop = dom.threadMessages.scrollHeight;
}

async function sendThreadReply(event) {
  event.preventDefault();
  const body = dom.threadInput.value.trim();
  if (!body || !state.selected || !state.threadRoot) return;
  try {
    const message = await request(`/api/conversations/${state.selected}/messages`, {
      method: 'POST',
      body: JSON.stringify({ sender_id: state.currentUser.id, body, parent_message_id: state.threadRoot.id, attachments: [] })
    });
    if (!state.messages.some((item) => item.id === message.id)) state.messages.push(message);
    dom.threadInput.value = '';
    resizeTextArea(dom.threadInput);
    renderMessages();
    renderThread();
    refreshConversations();
  } catch (error) { setStatus(error.message, false); }
}

async function sendMessage(event) {
  event.preventDefault();
  const body = dom.input.value.trim();
  if ((!body && !state.pendingAttachments.length) || !state.selected) return;
  try {
    const message = await request(`/api/conversations/${state.selected}/messages`, {
      method: 'POST',
      body: JSON.stringify({ sender_id: state.currentUser.id, body, parent_message_id: state.replyTo?.id || null, attachments: state.pendingAttachments })
    });
    if (!state.messages.some((item) => item.id === message.id)) state.messages.push(message);
    dom.input.value = '';
    state.pendingAttachments = []; renderPendingAttachments();
    request(`/api/conversations/${state.selected}/draft`, { method: 'PUT', body: JSON.stringify({ body: '' }) }).catch(() => {});
    sendTyping(false);
    state.replyTo = null;
    resizeComposer();
    renderMessages();
    renderReply();
    refreshConversations();
  } catch (error) { setStatus(error.message, false); }
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
  dom.pendingAttachments.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => { state.pendingAttachments.splice(Number(button.dataset.remove), 1); renderPendingAttachments(); }));
}
function renderMentionSuggestions() {
  const match = dom.input.value.slice(0, dom.input.selectionStart).match(/@([A-Za-z0-9_-]*)$/);
  if (!match) { dom.mentionSuggestions.hidden = true; return; }
  const candidates = state.users.filter((user) => user.username.toLowerCase().startsWith(match[1].toLowerCase())).slice(0, 6);
  dom.mentionSuggestions.hidden = !candidates.length;
  dom.mentionSuggestions.innerHTML = candidates.map((user) => `<button type="button" data-username="${escapeHtml(user.username)}"><span>${escapeHtml(user.display_name)}</span><small>@${escapeHtml(user.username)} · ${escapeHtml(user.kind)}</small></button>`).join('');
  dom.mentionSuggestions.querySelectorAll('[data-username]').forEach((button) => button.addEventListener('click', () => { const end = dom.input.selectionStart; const start = end - match[0].length; dom.input.setRangeText(`@${button.dataset.username} `, start, end, 'end'); dom.mentionSuggestions.hidden = true; dom.input.focus(); }));
}
async function loadOlderMessages() {
  if (!state.messages.length || !state.selected) return;
  dom.loadOlder.disabled = true;
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
  dom.notificationList.innerHTML = state.notifications.map((item) => { const action = item.kind === 'mention' ? 'mentioned you' : item.kind === 'direct_message' ? 'sent you a message' : 'replied in a thread'; return `<button class="notification-item${item.read ? '' : ' unread'}" type="button" data-conversation="${escapeHtml(item.conversation_id)}"><strong>${escapeHtml(item.actor_name)} ${action}</strong><span>${escapeHtml(item.body)}</span><time>${new Intl.DateTimeFormat([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.created_at))}</time></button>`; }).join('') || '<div class="search-empty">You are all caught up.</div>';
  dom.notificationList.querySelectorAll('[data-conversation]').forEach((button) => button.addEventListener('click', () => { selectConversation(button.dataset.conversation); dom.notificationsPanel.hidden = true; }));
}

async function refreshConversations() {
  try { state.conversations = await request('/api/conversations'); renderConversations(); } catch (_) {}
}
function setStatus(text, online) { dom.status.textContent = text; dom.dot.classList.toggle('online', online); }
function connectSocket() {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const socket = new WebSocket(`${protocol}://${location.host}/ws`);
  state.socket = socket;
  socket.onopen = () => setStatus('Live', true);
  socket.onclose = () => { state.socket = null; if (state.currentUser) { setStatus('Reconnecting…', false); setTimeout(() => { if (state.currentUser) connectSocket(); }, 2000); } };
  socket.onmessage = (event) => {
    const update = JSON.parse(event.data);
    if (update.type === 'message_created') {
      refreshConversations();
      refreshNotifications();
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
      dom.searchResultList.innerHTML = results.slice(0, 8).map((message) => `<button class="search-result" type="button" data-conversation="${escapeHtml(message.conversation_id)}"><strong>${escapeHtml(message.sender.display_name)}</strong><span>${escapeHtml(message.body)}</span></button>`).join('') || '<div class="search-empty">No messages found.</div>';
      dom.searchResultList.querySelectorAll('[data-conversation]').forEach((item) => item.addEventListener('click', () => { selectConversation(item.dataset.conversation); closeSearch(); }));
    } catch (_) {}
  }, 250);
}
dom.search.addEventListener('input', performSearch);
[dom.searchConversation, dom.searchSender, dom.searchMedia].forEach((select) => select.addEventListener('change', performSearch));
function closeSearch() { dom.searchResults.hidden = true; dom.searchResultList.innerHTML = ''; }
function openMobileSidebar() { dom.sidebar.classList.add('open'); dom.mobileBackdrop.hidden = false; document.body.classList.add('drawer-open'); }
function closeMobileSidebar() { dom.sidebar.classList.remove('open'); dom.mobileBackdrop.hidden = true; document.body.classList.remove('drawer-open'); }
function resizeTextArea(input) { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 132)}px`; }
function resizeComposer() { resizeTextArea(dom.input); }

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
  state.draftTimer = setTimeout(() => { if (state.selected) request(`/api/conversations/${state.selected}/draft`, { method: 'PUT', body: JSON.stringify({ body: dom.input.value }) }).catch(() => {}); }, 500);
  renderMentionSuggestions();
});
dom.threadInput.addEventListener('input', () => resizeTextArea(dom.threadInput));
dom.input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); dom.composer.requestSubmit(); }
});
dom.threadInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); dom.threadComposer.requestSubmit(); }
});
dom.openSettings.addEventListener('click', openSettings);
dom.closeSettings.addEventListener('click', closeSettings);
dom.settingsUnlockForm.addEventListener('submit', unlockSettings);
dom.settingsForm.addEventListener('submit', saveSettings);
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
dom.newConversation.addEventListener('click', openNewConversation);
dom.manageConversation.addEventListener('click', openManageConversation);
dom.createHuman.addEventListener('click', () => openCreatePrincipal('human'));
dom.createAgent.addEventListener('click', () => openCreatePrincipal('agent'));
dom.createInvite.addEventListener('click', openCreateInvite);
dom.testWebhook.addEventListener('click', sendWebhookTest);
dom.refreshWebhooks.addEventListener('click', refreshWebhookDeliveries);
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
    else { closeSearch(); closeMobileSidebar(); closeThread(); }
  }
});
initializeAuth();
