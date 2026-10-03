import { supabase } from './supabase.js';

let room, timer, user, notification, currentNotification;
let unread = [];
let channels = new Map();

const excerpt = (value = '') => { const clean = value.replace(/\s+/g, ' ').trim(); return clean.length > 150 ? `${clean.slice(0, 147)}…` : clean; };
const countsByDestination = () => unread.reduce((counts, item) => { const key = item.source === 'post' ? 'posts' : item.channel_id; if (key) counts[key] = (counts[key] || 0) + 1; return counts; }, {});
const broadcast = () => { window.__STOA_COMMUNITY_NOTIFICATION_COUNTS__ = countsByDestination(); window.dispatchEvent(new CustomEvent('stoa:community-notifications', { detail: window.__STOA_COMMUNITY_NOTIFICATION_COUNTS__ })); };

const buildNotification = () => {
  const node = document.createElement('aside');
  node.className = 'community-live-popup direct-notification'; node.setAttribute('role', 'status'); node.setAttribute('aria-live', 'polite'); node.hidden = true;
  node.innerHTML = `<button class="live-popup-close" type="button" aria-label="Fermer la notification">×</button><span class="eyebrow">COMMUNAUTÉ</span><strong data-notification-title></strong><p data-notification-content></p><a class="direct-notification-link" data-notification-link href="/communaute">Voir le message <span aria-hidden="true">→</span></a>`;
  document.body.append(node);
  node.querySelector('.live-popup-close').addEventListener('click', dismiss);
  node.querySelector('[data-notification-link]').addEventListener('click', async (event) => { event.preventDefault(); const destination = event.currentTarget.href; await markRead(currentNotification); location.href = destination; });
  return node;
};

const dismiss = () => { if (!notification || notification.hidden || notification.classList.contains('is-leaving')) return; clearTimeout(timer); notification.classList.remove('is-entering'); notification.classList.add('is-leaving'); setTimeout(() => { notification.hidden = true; notification.classList.remove('is-leaving'); }, 260); };
const reveal = () => { notification.hidden = false; notification.classList.remove('is-leaving', 'is-entering'); void notification.offsetWidth; notification.classList.add('is-entering'); clearTimeout(timer); timer = setTimeout(dismiss, 600000); };
const authorName = async (id) => { const { data } = await supabase.rpc('get_community_profiles', { profile_ids: [id] }); return data?.[0]?.display_name || 'Un membre'; };

const show = async (item) => {
  if (!item || !notification) return;
  currentNotification = item;
  const author = await authorName(item.actor_id);
  const titles = {
    reply: `${author} vous a répondu`, mention: `${author} vous a mentionné`, reply_mention: `${author} vous a répondu et mentionné`,
    post_reply: `${author} a répondu à votre post`, post_mention: `${author} vous a mentionné dans un post`, post_reply_mention: `${author} vous a répondu et mentionné`,
  };
  notification.querySelector('[data-notification-title]').textContent = titles[item.kind] || 'Nouvelle notification';
  notification.querySelector('[data-notification-content]').textContent = excerpt(item.content);
  const link = notification.querySelector('[data-notification-link]');
  if (item.source === 'post') {
    link.href = `/posts?post=${encodeURIComponent(item.post_id)}`;
    link.firstChild.textContent = 'Voir la discussion ';
  } else {
    const channel = channels.get(item.channel_id);
    link.href = channel?.slug ? `/communaute?canal=${encodeURIComponent(channel.slug)}` : '/communaute';
    link.firstChild.textContent = channel?.name ? `Voir dans #${channel.name} ` : 'Voir le message ';
  }
  reveal();
};

async function markRead(item) {
  if (!item?.id || !user) return;
  const table = item.source === 'post' ? 'community_post_notifications' : 'community_notifications';
  const { error } = await supabase.from(table).update({ read_at: new Date().toISOString() }).eq('id', item.id).eq('user_id', user.id);
  if (!error) { unread = unread.filter((current) => !(current.id === item.id && current.source === item.source)); broadcast(); }
}

async function markChannelRead(channelId) {
  if (!channelId) return;
  if (!user) user = (await supabase.auth.getSession()).data.session?.user;
  if (!user) return;
  const { error } = await supabase.from('community_notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).eq('channel_id', channelId).is('read_at', null);
  if (!error) { unread = unread.filter((item) => item.source === 'post' || item.channel_id !== channelId); broadcast(); }
}

async function markPostRead(postId) {
  if (!postId) return;
  if (!user) user = (await supabase.auth.getSession()).data.session?.user;
  if (!user) return;
  const { error } = await supabase.from('community_post_notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).eq('post_id', postId).is('read_at', null);
  if (!error) { unread = unread.filter((item) => item.source !== 'post' || item.post_id !== postId); broadcast(); }
}

window.STOACommunityNotifications = { markChannelRead, markPostRead };

async function init() {
  user = (await supabase.auth.getSession()).data.session?.user;
  if (!user) return;
  const [{ data: channelRows }, { data: chatRows }, { data: postRows }] = await Promise.all([
    supabase.from('channels').select('id,slug,name'),
    supabase.from('community_notifications').select('id,user_id,actor_id,message_id,channel_id,kind,content,created_at').is('read_at', null).order('created_at', { ascending: false }).limit(100),
    supabase.from('community_post_notifications').select('id,user_id,actor_id,post_id,comment_id,kind,content,created_at').is('read_at', null).order('created_at', { ascending: false }).limit(100),
  ]);
  channels = new Map((channelRows || []).map((channel) => [channel.id, channel]));
  unread = [
    ...(chatRows || []).map((item) => ({ ...item, source: 'chat' })),
    ...(postRows || []).map((item) => ({ ...item, source: 'post' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  notification = buildNotification(); broadcast();
  if (unread[0]) show(unread[0]);
  room = supabase.channel(`personal-community-notifications:${user.id}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_notifications', filter: `user_id=eq.${user.id}` }, ({ new: item }) => receive({ ...item, source: 'chat' }))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_post_notifications', filter: `user_id=eq.${user.id}` }, ({ new: item }) => receive({ ...item, source: 'post' }))
    .subscribe();
  window.addEventListener('pagehide', () => { clearTimeout(timer); if (room) supabase.removeChannel(room); }, { once: true });
}

function receive(item) { if (unread.some((current) => current.id === item.id && current.source === item.source)) return; unread.unshift(item); broadcast(); show(item); }

init();
