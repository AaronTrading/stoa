import { supabase } from './supabase.js';

let room, timer, user, notification, currentNotificationId;
let unread = [];
let channels = new Map();

const excerpt = (value = '') => { const clean = value.replace(/\s+/g, ' ').trim(); return clean.length > 150 ? `${clean.slice(0, 147)}…` : clean; };
const countsByChannel = () => unread.reduce((counts, item) => { counts[item.channel_id] = (counts[item.channel_id] || 0) + 1; return counts; }, {});
const broadcast = () => { window.__STOA_COMMUNITY_NOTIFICATION_COUNTS__ = countsByChannel(); window.dispatchEvent(new CustomEvent('stoa:community-notifications', { detail: window.__STOA_COMMUNITY_NOTIFICATION_COUNTS__ })); };

const buildNotification = () => {
  const node = document.createElement('aside');
  node.className = 'community-live-popup direct-notification'; node.setAttribute('role', 'status'); node.setAttribute('aria-live', 'polite'); node.hidden = true;
  node.innerHTML = `<button class="live-popup-close" type="button" aria-label="Fermer la notification">×</button><span class="eyebrow">COMMUNAUTÉ</span><strong data-notification-title></strong><p data-notification-content></p><a class="direct-notification-link" data-notification-link href="/communaute">Voir le message <span aria-hidden="true">→</span></a>`;
  document.body.append(node);
  node.querySelector('.live-popup-close').addEventListener('click', dismiss);
  node.querySelector('[data-notification-link]').addEventListener('click', async (event) => { event.preventDefault(); const destination = event.currentTarget.href; await markRead(currentNotificationId); location.href = destination; });
  return node;
};

const dismiss = () => { if (!notification || notification.hidden || notification.classList.contains('is-leaving')) return; clearTimeout(timer); notification.classList.remove('is-entering'); notification.classList.add('is-leaving'); setTimeout(() => { notification.hidden = true; notification.classList.remove('is-leaving'); }, 260); };
const reveal = () => { notification.hidden = false; notification.classList.remove('is-leaving', 'is-entering'); void notification.offsetWidth; notification.classList.add('is-entering'); clearTimeout(timer); timer = setTimeout(dismiss, 600000); };
const authorName = async (id) => { const { data } = await supabase.rpc('get_community_profiles', { profile_ids: [id] }); return data?.[0]?.display_name || 'Un membre'; };

const show = async (item) => {
  if (!item || !notification) return;
  currentNotificationId = item.id;
  const author = await authorName(item.actor_id);
  const titles = { reply: `${author} vous a répondu`, mention: `${author} vous a mentionné`, reply_mention: `${author} vous a répondu et mentionné` };
  notification.querySelector('[data-notification-title]').textContent = titles[item.kind] || 'Nouvelle notification';
  notification.querySelector('[data-notification-content]').textContent = excerpt(item.content);
  const channel = channels.get(item.channel_id), link = notification.querySelector('[data-notification-link]');
  link.href = channel?.slug ? `/communaute?canal=${encodeURIComponent(channel.slug)}` : '/communaute';
  link.firstChild.textContent = channel?.name ? `Voir dans #${channel.name} ` : 'Voir le message ';
  reveal();
};

async function markRead(id) {
  if (!id || !user) return;
  const { error } = await supabase.from('community_notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
  if (!error) { unread = unread.filter((item) => item.id !== id); broadcast(); }
}

async function markChannelRead(channelId) {
  if (!channelId) return;
  if (!user) user = (await supabase.auth.getSession()).data.session?.user;
  if (!user) return;
  const { error } = await supabase.from('community_notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).eq('channel_id', channelId).is('read_at', null);
  if (!error) { unread = unread.filter((item) => item.channel_id !== channelId); broadcast(); }
}

window.STOACommunityNotifications = { markChannelRead };

async function init() {
  user = (await supabase.auth.getSession()).data.session?.user;
  if (!user) return;
  const [{ data: channelRows }, { data: notificationRows }] = await Promise.all([
    supabase.from('channels').select('id,slug,name'),
    supabase.from('community_notifications').select('id,user_id,actor_id,message_id,channel_id,kind,content,created_at').is('read_at', null).order('created_at', { ascending: false }).limit(100),
  ]);
  channels = new Map((channelRows || []).map((channel) => [channel.id, channel]));
  unread = notificationRows || []; notification = buildNotification(); broadcast();
  if (unread[0]) show(unread[0]);
  room = supabase.channel(`personal-community-notifications:${user.id}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_notifications', filter: `user_id=eq.${user.id}` }, ({ new: item }) => { if (unread.some((current) => current.id === item.id)) return; unread.unshift(item); broadcast(); show(item); })
    .subscribe();
  window.addEventListener('pagehide', () => { clearTimeout(timer); if (room) supabase.removeChannel(room); }, { once: true });
}

init();
