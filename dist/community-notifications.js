import { supabase } from './supabase.js';

const seen = new Set();
let room;
let timer;
let currentMessageId;

function excerpt(value = '') {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > 150 ? `${clean.slice(0, 147)}…` : clean;
}

function containsMention(content, username) {
  if (!username) return false;
  const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\s)@${escaped}(?=$|[\\s.,!?;:])`, 'i').test(content || '');
}

function buildNotification() {
  const node = document.createElement('aside');
  node.className = 'community-live-popup direct-notification';
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', 'polite');
  node.hidden = true;
  node.innerHTML = `
    <button class="live-popup-close" type="button" aria-label="Fermer la notification">×</button>
    <span class="eyebrow">COMMUNAUTÉ</span>
    <strong data-notification-title></strong>
    <p data-notification-content></p>
    <a class="direct-notification-link" data-notification-link href="/communaute">Voir le message <span aria-hidden="true">→</span></a>`;
  document.body.append(node);
  node.querySelector('.live-popup-close').addEventListener('click', () => dismiss(node));
  node.querySelector('[data-notification-link]').addEventListener('click', () => markSeen());
  return node;
}

function markSeen() {
  if (currentMessageId) sessionStorage.setItem(`stoa-seen-message:${currentMessageId}`, '1');
}

function dismiss(node) {
  if (node.hidden || node.classList.contains('is-leaving')) return;
  markSeen(); clearTimeout(timer); node.classList.remove('is-entering'); node.classList.add('is-leaving');
  setTimeout(() => { node.hidden = true; node.classList.remove('is-leaving'); }, 260);
}

function reveal(node) {
  node.hidden = false; node.classList.remove('is-leaving', 'is-entering'); void node.offsetWidth; node.classList.add('is-entering');
  clearTimeout(timer); timer = setTimeout(() => dismiss(node), 600000);
}

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  const [{ data: profiles }, { data: channels }] = await Promise.all([
    supabase.rpc('get_community_profiles', { profile_ids: [user.id] }),
    supabase.from('channels').select('id,slug,name'),
  ]);
  const ownProfile = profiles?.[0];
  const channelMap = new Map((channels || []).map((channel) => [channel.id, channel]));
  const notification = buildNotification();

  async function handle(message) {
    if (!message?.id || message.user_id === user.id || seen.has(message.id) || sessionStorage.getItem(`stoa-seen-message:${message.id}`)) return;
    let isReply = false;
    if (message.reply_to_message_id) {
      const { data: target } = await supabase.from('messages').select('user_id').eq('id', message.reply_to_message_id).maybeSingle();
      isReply = target?.user_id === user.id;
    }
    const isMention = containsMention(message.content, ownProfile?.username);
    if (!isReply && !isMention) return;

    seen.add(message.id); currentMessageId = message.id;
    const { data: authors } = await supabase.rpc('get_community_profiles', { profile_ids: [message.user_id] });
    const author = authors?.[0]?.display_name || 'Un membre';
    const title = notification.querySelector('[data-notification-title]');
    title.textContent = isReply && isMention ? `${author} vous a répondu et mentionné` : isReply ? `${author} vous a répondu` : `${author} vous a mentionné`;
    notification.querySelector('[data-notification-content]').textContent = excerpt(message.content);
    const channel = channelMap.get(message.channel_id);
    const link = notification.querySelector('[data-notification-link]');
    link.href = channel?.slug ? `/communaute?canal=${encodeURIComponent(channel.slug)}` : '/communaute';
    link.firstChild.textContent = channel?.name ? `Voir dans #${channel.name} ` : 'Voir le message ';
    reveal(notification);
  }

  room = supabase.channel(`personal-community-notifications:${user.id}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: message }) => handle(message))
    .subscribe();

  window.addEventListener('pagehide', () => { clearTimeout(timer); if (room) supabase.removeChannel(room); }, { once: true });
}

init();
