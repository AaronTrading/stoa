import { supabase } from './supabase.js';

const REACTIONS = ['👍', '❤️', '👏', '💡'];
const PAGE_SIZE = 50;
const roleLabels = { member: 'Membre de l’Académie', coaching: 'Membre accompagné', admin: 'Équipe STOA' };

const channelList = document.querySelector('#channel-list');
const channelName = document.querySelector('#active-channel-name');
const channelDescription = document.querySelector('#active-channel-description');
const presenceCount = document.querySelector('#presence-count');
const presencePlural = document.querySelector('#presence-plural');
const realtimeLabel = document.querySelector('#realtime-label');
const history = document.querySelector('#message-history');
const messageList = document.querySelector('#message-list');
const chatState = document.querySelector('#chat-state');
const loadMoreButton = document.querySelector('#load-more');
const messageForm = document.querySelector('#message-form');
const messageInput = document.querySelector('#message-input');
const profileDialog = document.querySelector('#community-profile-dialog');
const profileContent = document.querySelector('#community-profile-content');

let currentUser;
let channels = [];
let activeChannel;
let messages = [];
let roomSubscription;
let oldestTimestamp;
let reachedHistoryStart = false;
let switchingChannel = false;
let longPressTimer;
const profiles = new Map();

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatTime = (value) => new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit', minute: '2-digit',
}).format(new Date(value));

const formatMemberSince = (value) => new Intl.DateTimeFormat('fr-FR', {
  month: 'long', year: 'numeric',
}).format(new Date(value));

const sameMinute = (first, second) => (
  Math.floor(new Date(first).getTime() / 60000) === Math.floor(new Date(second).getTime() / 60000)
);

const fallbackProfile = (id) => ({
  id,
  display_name: 'Membre STOA',
  username: null,
  avatar_url: null,
  role: 'member',
  created_at: new Date().toISOString(),
});

const getProfile = (id) => profiles.get(id) || fallbackProfile(id);

const loadProfiles = async (userIds) => {
  const missingIds = [...new Set(userIds)].filter((id) => id && !profiles.has(id));
  if (!missingIds.length) return;
  const { data, error } = await supabase.rpc('get_community_profiles', { profile_ids: missingIds });
  if (error) {
    missingIds.forEach((id) => profiles.set(id, fallbackProfile(id)));
    return;
  }
  data.forEach((profile) => profiles.set(profile.id, profile));
  missingIds.forEach((id) => {
    if (!profiles.has(id)) profiles.set(id, fallbackProfile(id));
  });
};

const avatarMarkup = (profile, className = 'message-avatar') => {
  const initial = escapeHtml(profile.display_name.trim().charAt(0).toUpperCase() || 'S');
  if (!profile.avatar_url) return `<span class="${className}" aria-hidden="true">${initial}</span>`;
  return `<span class="${className} has-image" aria-hidden="true"><img src="${escapeHtml(profile.avatar_url)}" alt=""></span>`;
};

const reactionMarkup = (message) => {
  const grouped = new Map();
  (message.message_reactions || []).forEach((reaction) => {
    const group = grouped.get(reaction.emoji) || { count: 0, mine: false };
    group.count += 1;
    if (reaction.user_id === currentUser.id) group.mine = true;
    grouped.set(reaction.emoji, group);
  });
  if (!grouped.size) return '';
  return `<div class="reaction-summary">${[...grouped.entries()].map(([emoji, group]) => `
    <button type="button" class="reaction-chip${group.mine ? ' mine' : ''}" data-reaction="${emoji}" aria-pressed="${group.mine}">
      <span>${emoji}</span><b>${group.count}</b>
    </button>`).join('')}</div>`;
};

const renderMessages = () => {
  if (!messages.length) {
    messageList.innerHTML = '';
    chatState.hidden = false;
    chatState.textContent = 'Le canal est calme. Posez la première pierre.';
    return;
  }

  chatState.hidden = true;
  messageList.innerHTML = messages.map((message, index) => {
    const previous = messages[index - 1];
    const grouped = previous && previous.user_id === message.user_id && sameMinute(previous.created_at, message.created_at);
    const profile = getProfile(message.user_id);
    const mine = message.user_id === currentUser.id;
    return `
      <article class="message-entry${grouped ? ' grouped' : ''}${mine ? ' mine' : ''}" data-message-id="${message.id}">
        <button class="profile-trigger message-profile" type="button" data-profile-id="${message.user_id}" aria-label="Voir le profil de ${escapeHtml(profile.display_name)}">
          ${avatarMarkup(profile)}
        </button>
        <div class="message-column">
          <header class="message-meta">
            <button class="profile-trigger message-author" type="button" data-profile-id="${message.user_id}">${escapeHtml(profile.display_name)}</button>
            <time datetime="${escapeHtml(message.created_at)}">${formatTime(message.created_at)}</time>
          </header>
          <div class="message-content">${escapeHtml(message.content).replaceAll('\n', '<br>')}</div>
          ${message.edited_at ? '<span class="edited-label">modifié</span>' : ''}
          ${reactionMarkup(message)}
        </div>
        <div class="message-tools">
          <button class="reaction-toggle" type="button" aria-label="Ajouter une réaction" aria-expanded="false">＋</button>
          <div class="reaction-picker" hidden>${REACTIONS.map((emoji) => `<button type="button" data-reaction="${emoji}" aria-label="Réagir avec ${emoji}">${emoji}</button>`).join('')}</div>
        </div>
      </article>`;
  }).join('');
};

const isNearBottom = () => history.scrollHeight - history.scrollTop - history.clientHeight < 140;
const scrollToBottom = (smooth = false) => history.scrollTo({ top: history.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });

const renderChannels = () => {
  channelList.innerHTML = channels.map((channel) => `
    <button class="channel-button${channel.id === activeChannel?.id ? ' active' : ''}" type="button" data-channel-id="${channel.id}">
      <span aria-hidden="true">#</span><span><strong>${escapeHtml(channel.name)}</strong><small>${escapeHtml(channel.description || '')}</small></span>
    </button>`).join('');
};

const setPresenceCount = (subscription = roomSubscription) => {
  if (!subscription || subscription !== roomSubscription) return;
  const state = subscription.presenceState();
  const count = Object.keys(state).length;
  presenceCount.textContent = String(count);
  presencePlural.textContent = count > 1 ? 's' : '';
};

const unsubscribeFromRoom = async () => {
  if (!roomSubscription) return;
  const subscription = roomSubscription;
  roomSubscription = undefined;
  await supabase.removeChannel(subscription);
};

const mergeRealtimeMessage = async (incoming) => {
  if (incoming.channel_id !== activeChannel?.id) return;
  const keepAtBottom = isNearBottom() || incoming.user_id === currentUser.id;
  await loadProfiles([incoming.user_id]);
  const existingIndex = messages.findIndex((message) => message.id === incoming.id);
  const normalized = { ...incoming, message_reactions: existingIndex >= 0 ? messages[existingIndex].message_reactions : [] };
  if (existingIndex >= 0) messages[existingIndex] = normalized;
  else messages.push(normalized);
  messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  renderMessages();
  if (keepAtBottom) requestAnimationFrame(() => scrollToBottom(true));
};

const removeRealtimeMessage = (oldMessage) => {
  const index = messages.findIndex((message) => message.id === oldMessage.id);
  if (index < 0) return;
  messages.splice(index, 1);
  renderMessages();
};

const applyRealtimeReaction = (payload) => {
  const reaction = payload.new?.id ? payload.new : payload.old;
  const message = messages.find((item) => item.id === reaction.message_id);
  if (!message) return;
  message.message_reactions ||= [];
  if (payload.eventType === 'DELETE') {
    message.message_reactions = message.message_reactions.filter((item) => item.id !== reaction.id);
  } else if (!message.message_reactions.some((item) => item.id === reaction.id)) {
    message.message_reactions.push(reaction);
  }
  const scrollPosition = history.scrollTop;
  renderMessages();
  history.scrollTop = scrollPosition;
};

const subscribeToRoom = (channel) => {
  realtimeLabel.textContent = 'Connexion…';
  const subscription = supabase.channel(`community:${channel.id}`, {
    config: { presence: { key: currentUser.id } },
  });
  roomSubscription = subscription;

  subscription
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${channel.id}`,
    }, (payload) => {
      if (payload.eventType === 'DELETE') removeRealtimeMessage(payload.old);
      else mergeRealtimeMessage(payload.new);
    })
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'message_reactions',
    }, applyRealtimeReaction)
    .on('presence', { event: 'sync' }, () => setPresenceCount(subscription))
    .on('presence', { event: 'join' }, () => setPresenceCount(subscription))
    .on('presence', { event: 'leave' }, () => setPresenceCount(subscription))
    .subscribe(async (status) => {
      if (subscription !== roomSubscription) return;
      if (status === 'SUBSCRIBED') {
        realtimeLabel.textContent = 'En direct';
        const profile = getProfile(currentUser.id);
        await subscription.track({ user_id: currentUser.id, name: profile.display_name, online_at: new Date().toISOString() });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        realtimeLabel.textContent = 'Reconnexion…';
      }
    });
};

const fetchMessages = async ({ before } = {}) => {
  let query = supabase
    .from('messages')
    .select('id, channel_id, user_id, content, created_at, edited_at, message_reactions(id, message_id, user_id, emoji)')
    .eq('channel_id', activeChannel.id)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (before) query = query.lt('created_at', before);
  return query;
};

const loadInitialMessages = async () => {
  chatState.hidden = false;
  chatState.textContent = 'Chargement des messages…';
  const channelId = activeChannel.id;
  const { data, error } = await fetchMessages();
  if (channelId !== activeChannel?.id) return;
  if (error) {
    chatState.textContent = `Les messages ne peuvent pas être chargés : ${error.message}`;
    return;
  }
  messages = [...data].reverse();
  await loadProfiles(messages.map((message) => message.user_id));
  oldestTimestamp = messages[0]?.created_at;
  reachedHistoryStart = data.length < PAGE_SIZE;
  loadMoreButton.hidden = reachedHistoryStart;
  renderMessages();
  requestAnimationFrame(() => scrollToBottom());
};

const switchChannel = async (channelIdentifier) => {
  const nextChannel = channels.find((channel) => channel.id === channelIdentifier || channel.slug === channelIdentifier);
  if (switchingChannel || activeChannel?.id === nextChannel?.id) return;
  if (!nextChannel) return;
  switchingChannel = true;
  await unsubscribeFromRoom();
  activeChannel = nextChannel;
  messages = [];
  oldestTimestamp = undefined;
  presenceCount.textContent = '0';
  channelName.textContent = nextChannel.name;
  channelDescription.textContent = nextChannel.description || '';
  messageInput.placeholder = `Écrire dans #${nextChannel.name.toLowerCase()}…`;
  renderChannels();
  const url = new URL(location.href);
  url.searchParams.set('canal', nextChannel.slug);
  window.history.replaceState(null, '', url);
  await loadInitialMessages();
  subscribeToRoom(nextChannel);
  switchingChannel = false;
};

const loadMoreMessages = async () => {
  if (!oldestTimestamp || reachedHistoryStart) return;
  loadMoreButton.disabled = true;
  loadMoreButton.textContent = 'Chargement…';
  const previousHeight = history.scrollHeight;
  const { data, error } = await fetchMessages({ before: oldestTimestamp });
  if (!error) {
    const older = [...data].reverse();
    await loadProfiles(older.map((message) => message.user_id));
    messages = [...older, ...messages];
    oldestTimestamp = messages[0]?.created_at;
    reachedHistoryStart = data.length < PAGE_SIZE;
    renderMessages();
    requestAnimationFrame(() => { history.scrollTop = history.scrollHeight - previousHeight; });
  }
  loadMoreButton.disabled = false;
  loadMoreButton.textContent = error ? 'Réessayer de charger' : 'Charger les messages précédents';
  loadMoreButton.hidden = reachedHistoryStart;
};

const sendMessage = async () => {
  const content = messageInput.value.trim();
  if (!content || !activeChannel) return;
  messageInput.disabled = true;
  messageForm.querySelector('button').disabled = true;
  const { data, error } = await supabase
    .from('messages')
    .insert({ channel_id: activeChannel.id, user_id: currentUser.id, content })
    .select('id, channel_id, user_id, content, created_at, edited_at')
    .single();
  messageInput.disabled = false;
  messageForm.querySelector('button').disabled = false;
  if (error) {
    chatState.hidden = false;
    chatState.textContent = `Le message n’a pas été envoyé : ${error.message}`;
    messageInput.focus();
    return;
  }
  messageInput.value = '';
  messageInput.style.height = '';
  await mergeRealtimeMessage({ ...data, message_reactions: [] });
  messageInput.focus();
};

const toggleReaction = async (messageId, emoji) => {
  if (!REACTIONS.includes(emoji)) return;
  const message = messages.find((item) => item.id === messageId);
  if (!message) return;
  const existing = (message.message_reactions || []).find((reaction) => reaction.user_id === currentUser.id && reaction.emoji === emoji);
  if (existing) {
    const { error } = await supabase.from('message_reactions').delete().eq('id', existing.id);
    if (!error) applyRealtimeReaction({ eventType: 'DELETE', old: existing });
  } else {
    const { data, error } = await supabase
      .from('message_reactions')
      .insert({ message_id: messageId, user_id: currentUser.id, emoji })
      .select('id, message_id, user_id, emoji')
      .single();
    if (!error) applyRealtimeReaction({ eventType: 'INSERT', new: data });
  }
};

const closeReactionPickers = (except) => {
  document.querySelectorAll('.reaction-picker:not([hidden])').forEach((picker) => {
    if (picker === except) return;
    picker.hidden = true;
    picker.closest('.message-tools')?.querySelector('.reaction-toggle')?.setAttribute('aria-expanded', 'false');
  });
};

const openReactionPicker = (entry) => {
  const picker = entry?.querySelector('.reaction-picker');
  const toggle = entry?.querySelector('.reaction-toggle');
  if (!picker || !toggle) return;
  closeReactionPickers(picker);
  picker.hidden = false;
  toggle.setAttribute('aria-expanded', 'true');
};

const showProfile = (profileId) => {
  const profile = getProfile(profileId);
  profileContent.innerHTML = `
    ${avatarMarkup(profile, 'community-profile-avatar')}
    <span class="eyebrow">PROFIL MEMBRE</span>
    <h2 id="community-profile-name">${escapeHtml(profile.display_name)}</h2>
    ${profile.username ? `<p class="community-profile-username">@${escapeHtml(profile.username)}</p>` : ''}
    <div class="community-profile-meta"><span>${escapeHtml(roleLabels[profile.role] || roleLabels.member)}</span><span>Membre depuis ${formatMemberSince(profile.created_at)}</span></div>`;
  profileDialog.showModal();
};

channelList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-channel-id]');
  if (button) switchChannel(button.dataset.channelId);
});

loadMoreButton.addEventListener('click', loadMoreMessages);
messageForm.addEventListener('submit', (event) => { event.preventDefault(); sendMessage(); });
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    sendMessage();
  }
});
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 132)}px`;
});

messageList.addEventListener('click', (event) => {
  const profileTrigger = event.target.closest('[data-profile-id]');
  if (profileTrigger) {
    showProfile(profileTrigger.dataset.profileId);
    return;
  }
  const entry = event.target.closest('[data-message-id]');
  if (!entry) return;
  const toggle = event.target.closest('.reaction-toggle');
  if (toggle) {
    const picker = entry.querySelector('.reaction-picker');
    if (picker.hidden) openReactionPicker(entry);
    else closeReactionPickers();
    return;
  }
  const reaction = event.target.closest('[data-reaction]');
  if (reaction) {
    toggleReaction(entry.dataset.messageId, reaction.dataset.reaction);
    closeReactionPickers();
  }
});

messageList.addEventListener('pointerdown', (event) => {
  if (!event.target.closest('.message-content')) return;
  const entry = event.target.closest('[data-message-id]');
  longPressTimer = window.setTimeout(() => openReactionPicker(entry), 480);
});
['pointerup', 'pointercancel', 'pointermove'].forEach((eventName) => {
  messageList.addEventListener(eventName, () => window.clearTimeout(longPressTimer));
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.message-tools')) closeReactionPickers();
});

document.querySelector('#community-profile-close').addEventListener('click', () => profileDialog.close());
profileDialog.addEventListener('click', (event) => {
  if (event.target === profileDialog) {
    const bounds = profileDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) profileDialog.close();
  }
});

window.addEventListener('pagehide', () => {
  if (roomSubscription) supabase.removeChannel(roomSubscription);
});

const initializeCommunity = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  currentUser = sessionData.session?.user;
  if (!currentUser) {
    location.replace('/#connexion');
    return;
  }

  await loadProfiles([currentUser.id]);
  const { data, error } = await supabase.from('channels').select('id, slug, name, description, order_index').order('order_index');
  if (error) {
    chatState.textContent = `La communauté ne peut pas être ouverte : ${error.message}`;
    return;
  }
  channels = data;
  if (!channels.length) {
    chatState.textContent = 'Aucun canal n’est encore disponible.';
    return;
  }
  const requestedChannel = new URLSearchParams(location.search).get('canal');
  const requested = channels.find((channel) => channel.slug === requestedChannel || channel.id === requestedChannel);
  await switchChannel(requested?.id || channels[0].id);
};

initializeCommunity();
