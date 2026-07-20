const people = {
  you: { id: 'you', name: 'You', initials: 'YO', avatar: 'you', online: true, agent: false },
  maya: { id: 'maya', name: 'Maya Patel', initials: 'MP', avatar: 'maya', online: true, agent: false },
  ethan: { id: 'ethan', name: 'Ethan Chen', initials: 'EC', avatar: 'ethan', online: false, agent: false },
  liam: { id: 'liam', name: 'Liam O’Connor', initials: 'LO', avatar: 'liam', online: false, agent: false },
  agent: { id: 'agent', name: 'Haco Agent', initials: '✦', avatar: 'agent', online: true, agent: true }
};

const conversations = {
  general: {
    id: 'general',
    type: 'forum',
    name: 'general',
    description: 'Human and agent coordination',
    icon: '#',
    defaultIcon: true,
    members: ['you', 'maya', 'ethan', 'agent', 'liam'],
    roles: { you: 'Admin', maya: 'Moderator', ethan: 'Member', agent: 'Member', liam: 'Member' },
    messages: [
      { id: 'general-1', author: 'maya', time: '9:41 AM', text: 'Good morning! Let’s align on the Q2 roadmap and the new collaboration workflow.', reactions: ['👍 3', '🎉 1'], thread: [{ id: 'general-1-r1', author: 'ethan', time: '9:43 AM', text: 'I’ll share the latest spec and user research summary here.' }, { id: 'general-1-r2', author: 'agent', time: '9:45 AM', text: 'I’ll compile the relevant collaboration patterns and recommendations.' }] },
      { id: 'general-2', author: 'ethan', time: '9:43 AM', text: 'Sounds good. I’ll share the latest spec and user research summary here.', quote: { sourceId: 'general-1', author: 'maya', text: 'Let’s align on the Q2 roadmap and the new collaboration workflow.' }, attachment: true, thread: [] },
      { id: 'general-3', author: 'agent', time: '9:45 AM', text: 'I’ll research best practices for collaboration workflows and compile relevant insights.', thinking: true, thread: [] },
      { id: 'general-4', author: 'liam', time: '9:47 AM', text: 'Looking forward to the insights!', thread: [] }
    ]
  },
  product: {
    id: 'product',
    type: 'forum',
    name: 'product',
    description: 'Roadmap planning and product decisions',
    icon: '#',
    defaultIcon: true,
    members: ['you', 'maya', 'ethan', 'agent'],
    roles: { you: 'Admin', maya: 'Moderator', ethan: 'Member', agent: 'Member' },
    messages: [
      { id: 'product-1', author: 'maya', time: '10:02 AM', text: 'I’ve grouped the Q2 opportunities by customer impact. Which two should we take to planning?', thread: [{ id: 'product-1-r1', author: 'ethan', time: '10:10 AM', text: 'The onboarding theme has the clearest implementation path.' }] },
      { id: 'product-2', author: 'agent', time: '10:07 AM', text: 'I found three recurring customer themes across the recent feedback.', thinking: true, thread: [] },
      { id: 'product-3', author: 'ethan', time: '10:10 AM', text: 'The onboarding theme has the clearest implementation path.', quote: { sourceId: 'product-1', author: 'maya', text: 'Which two should we take to planning?' }, thread: [] }
    ]
  },
  design: {
    id: 'design',
    type: 'forum',
    name: 'design',
    description: 'Critiques, research, and creative direction',
    icon: '#',
    defaultIcon: true,
    members: ['you', 'maya', 'liam', 'agent'],
    roles: { you: 'Admin', maya: 'Member', liam: 'Moderator', agent: 'Member' },
    messages: [
      { id: 'design-1', author: 'liam', time: 'Yesterday', text: 'I’ve uploaded three directions for the new workspace shell.', attachment: true, thread: [] },
      { id: 'design-2', author: 'maya', time: 'Yesterday', text: 'Let’s use the bright frosted treatment as our working direction.', quote: { sourceId: 'design-1', author: 'liam', text: 'I’ve uploaded three directions for the new workspace shell.' }, thread: [] }
    ]
  },
  engineering: {
    id: 'engineering',
    type: 'forum',
    name: 'engineering',
    description: 'Build updates and technical handoffs',
    icon: '#',
    defaultIcon: true,
    members: ['you', 'ethan', 'agent', 'liam'],
    roles: { you: 'Admin', ethan: 'Moderator', agent: 'Member', liam: 'Member' },
    messages: [
      { id: 'engineering-1', author: 'ethan', time: '11:16 AM', text: 'The responsive shell is ready for visual review.', thread: [] },
      { id: 'engineering-2', author: 'agent', time: '11:19 AM', text: 'I’m checking the mobile layout against the accessibility requirements.', thinking: true, thread: [] }
    ]
  },
  creativeGroup: {
    id: 'creativeGroup',
    type: 'group',
    name: 'creative squad',
    description: 'Private group chat for the creative team',
    icon: 'CS',
    defaultIcon: true,
    members: ['you', 'maya', 'liam'],
    roles: { you: 'Admin', maya: 'Member', liam: 'Member' },
    messages: [
      { id: 'creative-1', author: 'maya', time: '11:30 AM', text: 'Should we invite the research team into tomorrow’s design review?', thread: [] },
      { id: 'creative-2', author: 'liam', time: '11:32 AM', text: 'Yes, I can add the review notes after the session.', thread: [] }
    ]
  },
  maya: {
    id: 'maya',
    type: 'dm',
    name: 'Maya Patel',
    description: 'Direct message · online',
    icon: '@',
    members: ['you', 'maya'],
    roles: {},
    messages: [
      { id: 'maya-1', author: 'maya', time: '9:39 AM', text: 'Could you take a look at the new workspace direction before the team review?' },
      { id: 'maya-2', author: 'you', time: '9:40 AM', text: 'Absolutely — I’m reviewing the frosted glass prototype now.' }
    ]
  },
  ethan: {
    id: 'ethan',
    type: 'dm',
    name: 'Ethan Chen',
    description: 'Direct message · offline',
    icon: '@',
    members: ['you', 'ethan'],
    roles: {},
    messages: [
      { id: 'ethan-1', author: 'ethan', time: '9:38 AM', text: 'The prototype route is ready for feedback whenever you are.' },
      { id: 'ethan-2', author: 'you', time: '9:40 AM', text: 'Great, I’ll test the interactions next.' }
    ]
  },
  agent: {
    id: 'agent',
    type: 'dm',
    name: 'Haco Agent',
    description: 'Research workspace · online',
    icon: '✦',
    members: ['you', 'agent'],
    roles: {},
    messages: [
      { id: 'agent-1', author: 'agent', time: 'Now', text: 'I can research, summarize, and help coordinate a handoff across your forums.', thinking: true }
    ]
  }
};

const root = document.documentElement;
const prototype = document.querySelector('#prototype');
const conversationPanel = document.querySelector('.conversation-panel');
const sidebar = document.querySelector('#sidebar');
const backdrop = document.querySelector('#mobile-backdrop');
const forums = document.querySelector('#forums');
const directs = document.querySelector('#directs');
const messages = document.querySelector('#messages');
const messageInput = document.querySelector('#message-input');
const composer = document.querySelector('#composer');
const richTools = document.querySelector('.rich-tools');
const composerHint = document.querySelector('#composer-hint');
const replyContext = document.querySelector('#reply-context');
const threadPanel = document.querySelector('#thread-panel');
const threadFeed = document.querySelector('#thread-feed');
const threadInput = document.querySelector('#thread-input');
const threadReplyContext = document.querySelector('#thread-reply-context');
const memberToggle = document.querySelector('#member-toggle');
const memberPopover = document.querySelector('#member-popover');
const channelSettings = document.querySelector('#channel-settings');
const threadToggle = document.querySelector('#thread-toggle');
const newForumDialog = document.querySelector('#new-forum-dialog');
const directPickerDialog = document.querySelector('#direct-picker-dialog');
const forumSettingsDialog = document.querySelector('#forum-settings-dialog');
const accountSettingsDialog = document.querySelector('#account-settings-dialog');
const toast = document.querySelector('#mock-toast');

let selected = 'general';
let richMode = false;
let activeThread = { rootId: null, replyToId: null };
let replyToMessage = null;
let toastTimer;
let itemCounter = 0;
let closeInitialMobileThread = window.matchMedia('(max-width: 760px)').matches;

const esc = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
const formatText = value => esc(value).replace(/\n/g, '<br>');
const currentConversation = () => conversations[selected];
const isGroupConversation = conversation => conversation.type !== 'dm';
const membersFor = conversation => conversation.members.map(id => people[id]).filter(Boolean);
const makeId = prefix => prefix + '-' + Date.now().toString(36) + '-' + (++itemCounter);

function avatar(personId, variant = '') {
  const person = people[personId];
  const role = person.agent ? 'agent' : 'human';
  const state = person.online ? 'online' : 'offline';
  return [
    '<span class="avatar-stack ', variant, '" role="img" aria-label="', esc(person.name + ' is ' + state), '">',
    '<span class="avatar avatar-', esc(person.avatar), '">', esc(person.initials), '</span>',
    '<span class="presence-pill ', role, ' ', state, '"></span>',
    '</span>'
  ].join('');
}

function forumIcon(conversation, variant = '') {
  return '<span class="forum-icon is-default ' + variant + '">' + esc(conversation.icon || '#') + '</span>';
}

function attachment() {
  return '<div class="attachment"><span class="attachment-icon">▤</span><span><strong>Q2 Roadmap Brief.pdf</strong><small>2.4 MB</small></span><span class="attachment-download">↓</span></div>';
}

function thinking() {
  return '<details class="thinking"><summary class="thinking-header"><span class="thinking-spinner" aria-hidden="true"></span><strong>Thinking</strong><span class="thinking-preview">Researching collaboration patterns</span><span class="thinking-disclosure" aria-hidden="true">⌄</span></summary><div class="thinking-progress"><p>Searching relevant sources and preparing a concise summary.</p><p>Comparing findings against the workspace context.</p></div></details>';
}

function quotedMessage(quote) {
  if (!quote) return '';
  return [
    '<button class="quote-card" type="button" data-reply-to="message-', esc(quote.sourceId), '">',
    avatar(quote.author, 'quote-avatar-stack'),
    '<span class="quote-copy"><small>Replying to ', esc(people[quote.author].name), '</small><strong>', esc(quote.text), '</strong></span>',
    '<span class="quote-jump" aria-hidden="true">↗</span></button>'
  ].join('');
}

function forumNavigation(conversation) {
  const unread = conversation.id === 'general' ? '<span class="unread">3</span>' : '';
  const active = conversation.id === selected ? ' active' : '';
  return '<button class="conversation' + active + '" type="button" data-conversation="' + esc(conversation.id) + '">' + forumIcon(conversation) + '<span class="conversation-copy"><strong>' + esc(conversation.name) + '</strong><small>' + esc(conversation.description) + '</small></span>' + unread + '</button>';
}

function directNavigation(conversation) {
  const otherId = conversation.members.find(id => id !== 'you');
  const other = people[otherId];
  const active = conversation.id === selected ? ' active' : '';
  const summary = other.online ? (other.agent ? 'Research workspace' : 'Online') : 'Last active 12m ago';
  return '<button class="conversation person-row' + active + '" type="button" data-conversation="' + esc(conversation.id) + '">' + avatar(otherId, 'sidebar-avatar-stack') + '<span class="conversation-copy"><strong>' + esc(other.name) + '</strong><small>' + esc(summary) + '</small></span></button>';
}

function renderSidebar() {
  const values = Object.values(conversations);
  forums.innerHTML = values.filter(conversation => conversation.type !== 'dm').map(forumNavigation).join('');
  directs.innerHTML = values.filter(conversation => conversation.type === 'dm').map(directNavigation).join('');
}

function messageActions(conversation, item) {
  if (!isGroupConversation(conversation)) return '';
  const replies = item.thread?.length || 0;
  const threadLabel = replies ? replies + (replies === 1 ? ' reply' : ' replies') : 'Start thread';
  return '<div class="message-actions"><button type="button" data-reply-message="' + esc(item.id) + '">Reply</button><button type="button" data-open-thread="' + esc(item.id) + '">' + threadLabel + '</button></div>';
}

function messageMarkup(conversation, item) {
  const author = people[item.author];
  const isSelf = item.author === 'you';
  return [
    '<article id="message-', esc(item.id), '" class="message', isSelf ? ' is-self' : '', '">',
    isSelf ? '' : avatar(item.author, 'message-avatar-stack'),
    '<div class="message-content"><div class="message-meta"><strong>', esc(author.name), '</strong><time>', esc(item.time), '</time></div>',
    item.thinking ? thinking() : '',
    quotedMessage(item.quote),
    '<p class="message-copy">', formatText(item.text), '</p>',
    item.attachment ? attachment() : '',
    item.reactions ? '<div class="reaction-row">' + item.reactions.map(reaction => '<button class="reaction" type="button">' + esc(reaction) + '</button>').join('') + '</div>' : '',
    messageActions(conversation, item),
    '</div></article>'
  ].join('');
}

function findMessage(conversation, messageId) {
  return conversation.messages.find(message => message.id === messageId);
}

function threadEntryMarkup(entry, rootId, root) {
  const author = people[entry.author];
  const isSelf = entry.author === 'you';
  const quote = entry.quote ? quotedMessage(entry.quote) : '';
  return [
    '<article class="thread-reply', isSelf ? ' is-self' : '', '">',
    '<div class="thread-person">', isSelf ? '' : avatar(entry.author, 'thread-avatar-stack'), '<strong>', esc(author.name), '</strong><time>', esc(entry.time), '</time></div>',
    quote,
    '<p>', formatText(entry.text), '</p>',
    '<button type="button" data-thread-reply="', esc(entry.id), '" data-thread-root="', esc(rootId), '">Reply</button>',
    root ? '' : '',
    '</article>'
  ].join('');
}

function renderThread() {
  const conversation = currentConversation();
  if (!isGroupConversation(conversation)) {
    threadPanel.hidden = true;
    prototype.classList.add('thread-closed');
    return;
  }
  const root = findMessage(conversation, activeThread.rootId) || conversation.messages[0];
  if (!root) {
    threadFeed.innerHTML = '<p class="thread-origin">Start a conversation to open a thread.</p>';
    return;
  }
  activeThread.rootId = root.id;
  const replyTo = root.thread?.find(reply => reply.id === activeThread.replyToId);
  document.querySelector('#thread-heading').textContent = 'Forum thread';
  threadFeed.innerHTML = '<p class="thread-topic">' + esc(root.text) + '</p><p class="thread-origin">From #' + esc(conversation.name) + '</p><div class="thread-divider"></div>' + threadEntryMarkup(root, root.id, true) + (root.thread || []).map(reply => threadEntryMarkup(reply, root.id, false)).join('');
  if (replyTo) {
    threadReplyContext.hidden = false;
    threadReplyContext.innerHTML = '<span>Replying to ' + esc(people[replyTo.author].name) + '</span><button type="button" data-clear-thread-reply aria-label="Cancel thread reply">×</button>';
    threadInput.placeholder = 'Reply to ' + people[replyTo.author].name + '…';
  } else {
    threadReplyContext.hidden = true;
    threadReplyContext.innerHTML = '';
    threadInput.placeholder = 'Reply in thread…';
  }
}

function renderMemberPopover() {
  const conversation = currentConversation();
  if (!isGroupConversation(conversation)) {
    memberPopover.hidden = true;
    return;
  }
  memberPopover.innerHTML = '<header><strong>Members</strong><span class="member-popover-actions"><button type="button" data-open-forum-settings aria-label="Edit forum settings">⚙</button><button type="button" data-close-members aria-label="Close member list">×</button></span></header><ul>' + membersFor(conversation).map(person => '<li>' + avatar(person.id, 'member-avatar-stack') + '<span><strong>' + esc(person.name) + '</strong><small>' + esc(conversation.roles[person.id] || 'Member') + '</small></span></li>').join('') + '</ul>';
}

function renderForumSettings() {
  const conversation = currentConversation();
  document.querySelector('#forum-settings-title').textContent = 'Edit ' + conversation.name;
  document.querySelector('#forum-name-field').value = conversation.name;
  document.querySelector('#forum-description-field').value = conversation.description;
  document.querySelector('#forum-picture').value = conversation.icon || '#';
  document.querySelector('#forum-preview').textContent = conversation.icon || '#';
  document.querySelector('#forum-member-roles').innerHTML = membersFor(conversation).map(person => '<label class="member-role-row">' + avatar(person.id, 'settings-avatar-stack') + '<span><strong>' + esc(person.name) + '</strong><small>' + (person.agent ? 'Connected agent' : 'Workspace member') + '</small></span><select data-member-role="' + esc(person.id) + '" aria-label="' + esc(person.name) + ' role"><option' + ((conversation.roles[person.id] || 'Member') === 'Admin' ? ' selected' : '') + '>Admin</option><option' + ((conversation.roles[person.id] || 'Member') === 'Moderator' ? ' selected' : '') + '>Moderator</option><option' + ((conversation.roles[person.id] || 'Member') === 'Member' ? ' selected' : '') + '>Member</option></select></label>').join('');
}

function closeMembers() {
  memberPopover.hidden = true;
  memberToggle.setAttribute('aria-expanded', 'false');
}

function openThread(rootId) {
  const conversation = currentConversation();
  if (!isGroupConversation(conversation)) return;
  activeThread = { rootId, replyToId: null };
  threadPanel.hidden = false;
  prototype.classList.remove('thread-closed');
  renderThread();
}

function closeThread() {
  threadPanel.hidden = true;
  prototype.classList.add('thread-closed');
}

function selectConversation(conversationId) {
  selected = conversationId;
  activeThread = { rootId: null, replyToId: null };
  replyToMessage = null;
  replyContext.hidden = true;
  closeMembers();
  render();
  sidebar.classList.remove('is-open');
  backdrop.classList.remove('is-visible');
}

function render() {
  const conversation = currentConversation();
  const group = isGroupConversation(conversation);
  conversationPanel.dataset.conversationType = conversation.type;
  document.querySelector('#conversation-symbol').textContent = conversation.type === 'dm' ? conversation.icon : conversation.icon;
  document.querySelector('#conversation-symbol').classList.toggle('is-default', Boolean(conversation.defaultIcon));
  document.querySelector('#conversation-name').textContent = conversation.name;
  document.querySelector('#conversation-description').textContent = conversation.description;
  document.querySelector('#member-count').textContent = conversation.members.length;
  memberToggle.hidden = !group;
  channelSettings.hidden = !group;
  threadToggle.hidden = !group;
  messageInput.placeholder = 'Message ' + (group ? '#' : '') + conversation.name;
  messages.innerHTML = '<p class="day-label">Today</p>' + conversation.messages.map(item => messageMarkup(conversation, item)).join('');
  renderSidebar();
  renderMemberPopover();
  if (group) {
    if (closeInitialMobileThread) {
      closeThread();
      closeInitialMobileThread = false;
    }
    if (threadPanel.hidden) prototype.classList.add('thread-closed');
    renderThread();
  } else {
    closeThread();
  }
}

function setRichMode(enabled) {
  richMode = enabled;
  composer.classList.toggle('is-rich', richMode);
  richTools.hidden = !richMode;
  composerHint.hidden = !richMode;
  document.querySelector('#composer-mode').setAttribute('aria-pressed', String(richMode));
  document.querySelector('#composer-mode').setAttribute('aria-label', richMode ? 'Use compact composer' : 'Expand rich composer');
  document.querySelector('#composer-mode').title = richMode ? 'Use compact composer' : 'Expand rich composer';
  messageInput.rows = richMode ? 4 : 1;
  messageInput.focus();
}

function addListPrefix(prefix) {
  const start = messageInput.selectionStart;
  const end = messageInput.selectionEnd;
  const before = messageInput.value.slice(0, start);
  const after = messageInput.value.slice(end);
  const separator = before && !before.endsWith('\n') ? '\n' : '';
  messageInput.value = before + separator + prefix + after;
  const cursor = before.length + separator.length + prefix.length;
  messageInput.setSelectionRange(cursor, cursor);
  messageInput.focus();
}

function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2600);
}

function closeDialog(dialog) {
  if (dialog.open) dialog.close();
}

function updateSettingsTab(tabName) {
  document.querySelectorAll('[data-settings-tab]').forEach(tab => {
    const active = tab.dataset.settingsTab === tabName;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-settings-panel]').forEach(panel => {
    panel.hidden = panel.dataset.settingsPanel !== tabName;
  });
}

document.addEventListener('click', event => {
  const conversationButton = event.target.closest('[data-conversation]');
  if (conversationButton) {
    selectConversation(conversationButton.dataset.conversation);
    return;
  }

  const replyButton = event.target.closest('[data-reply-message]');
  if (replyButton) {
    openThread(replyButton.dataset.replyMessage);
    threadInput.focus();
    return;
  }

  const threadButton = event.target.closest('[data-open-thread]');
  if (threadButton) {
    openThread(threadButton.dataset.openThread);
    return;
  }

  const replyTo = event.target.closest('[data-reply-to]');
  if (replyTo) {
    const source = document.getElementById(replyTo.dataset.replyTo);
    source?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    source?.classList.add('message-highlight');
    window.setTimeout(() => source?.classList.remove('message-highlight'), 950);
    return;
  }

  const threadReply = event.target.closest('[data-thread-reply]');
  if (threadReply) {
    activeThread.replyToId = threadReply.dataset.threadReply;
    activeThread.rootId = threadReply.dataset.threadRoot;
    renderThread();
    threadInput.focus();
    return;
  }

  if (event.target.closest('[data-clear-thread-reply]')) {
    activeThread.replyToId = null;
    renderThread();
    return;
  }

  if (event.target.closest('[data-close-members]')) {
    closeMembers();
    memberToggle.focus();
    return;
  }

  if (event.target.closest('[data-open-forum-settings]')) {
    closeMembers();
    renderForumSettings();
    openDialog(forumSettingsDialog);
    return;
  }

  const startDm = event.target.closest('[data-start-dm]');
  if (startDm) {
    selectConversation(startDm.dataset.startDm);
    closeDialog(directPickerDialog);
    showToast('Direct message ready');
    return;
  }

  const settingsTab = event.target.closest('[data-settings-tab]');
  if (settingsTab) {
    updateSettingsTab(settingsTab.dataset.settingsTab);
    return;
  }

  const mockAction = event.target.closest('[data-mock-action]');
  if (mockAction) {
    showToast(mockAction.dataset.mockAction);
    return;
  }

  const closeButton = event.target.closest('[data-close-dialog]');
  if (closeButton) {
    closeDialog(closeButton.closest('dialog'));
    return;
  }

  if (!memberPopover.hidden && !memberPopover.contains(event.target) && !memberToggle.contains(event.target)) closeMembers();
});

document.querySelector('#theme-toggle').addEventListener('click', () => {
  const dark = root.dataset.theme !== 'dark';
  root.dataset.theme = dark ? 'dark' : 'bright';
  document.querySelector('#theme-label').textContent = dark ? 'Dark' : 'Bright';
  document.querySelector('#theme-toggle').setAttribute('aria-label', 'Switch to ' + (dark ? 'bright' : 'dark') + ' mode');
});

memberToggle.addEventListener('click', () => {
  if (!isGroupConversation(currentConversation())) return;
  const show = memberPopover.hidden;
  memberPopover.hidden = !show;
  memberToggle.setAttribute('aria-expanded', String(show));
});

channelSettings.addEventListener('click', () => {
  if (!isGroupConversation(currentConversation())) return;
  renderForumSettings();
  openDialog(forumSettingsDialog);
});

threadToggle.addEventListener('click', () => threadPanel.hidden ? openThread(activeThread.rootId) : closeThread());
document.querySelector('#thread-close').addEventListener('click', closeThread);
document.querySelector('#mobile-menu').addEventListener('click', () => {
  sidebar.classList.add('is-open');
  backdrop.classList.add('is-visible');
});
backdrop.addEventListener('click', () => {
  sidebar.classList.remove('is-open');
  backdrop.classList.remove('is-visible');
});

document.querySelector('#new-forum').addEventListener('click', () => {
  document.querySelector('#new-forum-form').reset();
  openDialog(newForumDialog);
  document.querySelector('#new-forum-name').focus();
});

document.querySelector('#new-direct-message').addEventListener('click', () => openDialog(directPickerDialog));
document.querySelector('#account-settings').addEventListener('click', () => {
  updateSettingsTab('personal');
  openDialog(accountSettingsDialog);
});

document.querySelector('#composer-mode').addEventListener('click', () => setRichMode(!richMode));
document.querySelector('#bullet-list').addEventListener('click', () => addListPrefix('• '));
document.querySelector('#number-list').addEventListener('click', () => addListPrefix('1. '));

messageInput.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.isComposing && !richMode && !event.shiftKey) {
    event.preventDefault();
    composer.requestSubmit();
  }
});

composer.addEventListener('submit', event => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  const conversation = currentConversation();
  conversation.messages.push({ id: makeId(conversation.id), author: 'you', time: 'Now', text, thread: [] });
  messageInput.value = '';
  replyToMessage = null;
  replyContext.hidden = true;
  render();
  messages.scrollTop = messages.scrollHeight;
});

document.querySelector('#thread-composer').addEventListener('submit', event => {
  event.preventDefault();
  const text = threadInput.value.trim();
  const conversation = currentConversation();
  const rootMessage = findMessage(conversation, activeThread.rootId);
  if (!text || !rootMessage) return;
  const replyTo = rootMessage.thread.find(reply => reply.id === activeThread.replyToId);
  rootMessage.thread.push({
    id: makeId(rootMessage.id + '-reply'),
    author: 'you',
    time: 'Now',
    text,
    quote: replyTo ? { sourceId: rootMessage.id, author: replyTo.author, text: replyTo.text } : null
  });
  threadInput.value = '';
  activeThread.replyToId = null;
  renderThread();
  showToast('Reply added to thread');
});

document.querySelector('#new-forum-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get('name') || '').trim();
  if (!name) return;
  const id = 'forum-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  const invited = form.getAll('member').map(String);
  const members = ['you'].concat(invited.filter(member => member !== 'you'));
  conversations[id] = {
    id,
    type: 'forum',
    name,
    description: String(form.get('description') || 'New forum'),
    icon: '#',
    defaultIcon: true,
    members,
    roles: Object.fromEntries(members.map(member => [member, member === 'you' ? 'Admin' : 'Member'])),
    messages: []
  };
  closeDialog(newForumDialog);
  selectConversation(id);
  showToast('Forum created — you are the Admin');
});

document.querySelector('#forum-settings-form').addEventListener('submit', event => {
  event.preventDefault();
  const conversation = currentConversation();
  conversation.name = document.querySelector('#forum-name-field').value.trim() || conversation.name;
  conversation.description = document.querySelector('#forum-description-field').value.trim() || conversation.description;
  conversation.icon = document.querySelector('#forum-picture').value.trim() || '#';
  conversation.defaultIcon = true;
  document.querySelectorAll('[data-member-role]').forEach(select => {
    conversation.roles[select.dataset.memberRole] = select.value;
  });
  closeDialog(forumSettingsDialog);
  render();
  showToast('Forum settings saved');
});

document.querySelector('#forum-picture').addEventListener('input', event => {
  document.querySelector('#forum-preview').textContent = event.target.value.trim() || '#';
});

document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeDialog(dialog);
  });
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMembers();
});

render();
