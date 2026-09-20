import { supabase } from './supabase.js';

const REACTIONS = ['♡', '👍', '👏', '💡'];
const PAGE_SIZE = 50;
const roleLabels = { member: 'Membre de l’Académie', coaching: 'Membre accompagné', admin: 'Équipe STOA' };
const svg = {
  smile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8M9 9.5h.01M15 9.5h.01"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.1-1 10.6-10.6a2 2 0 0 0-2.8-2.8L5.3 16.2 4 20Z"/><path d="m14.5 7 2.8 2.8"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M7.5 7l.7 13h7.6l.7-13M10 11v5M14 11v5"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8"/><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  reply: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 8-5 4 5 4"/><path d="M5 12h8c3.3 0 6 2 6 6"/></svg>',
};
const $ = (s) => document.querySelector(s);
const els = {
  channels: $('#channel-list'), name: $('#active-channel-name'), description: $('#active-channel-description'),
  count: $('#presence-count'), plural: $('#presence-plural'), realtime: $('#realtime-label'), history: $('#message-history'),
  list: $('#message-list'), state: $('#chat-state'), more: $('#load-more'), form: $('#message-form'), input: $('#message-input'),
  context: $('#reply-context'), contextLabel: $('#composer-context-label'), guidance: $('#composer-guidance'), suggestions: $('#mention-suggestions'),
  profileDialog: $('#community-profile-dialog'), profile: $('#community-profile-content'), shareDialog: $('#share-message-dialog'),
  shareList: $('#share-channel-list'), externalDialog: $('#external-link-dialog'), externalHost: $('#external-link-host'),
  externalContinue: $('#external-link-continue'), announcement: $('#announcement-popup'), announcementAuthor: $('#announcement-author'),
  announcementContent: $('#announcement-content'), announcementTime: $('#announcement-time'),
};
let user, ownProfile, channels = [], active, messages = [], room, announcementRoom, announcementTimer;
let oldest, historyEnded = false, switching = false, replyId, editId, shareId, longPressTimer, allProfilesLoaded = false;
const profiles = new Map();
const isAdmin = () => ownProfile?.role === 'admin';
const esc = (v = '') => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const norm = (v = '') => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const time = (v) => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(v));
const memberSince = (v) => new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(v));
const sameMinute = (a, b) => Math.floor(new Date(a) / 60000) === Math.floor(new Date(b) / 60000);
const fallback = (id) => ({ id, display_name: 'Membre STOA', username: null, avatar_url: null, role: 'member', created_at: new Date().toISOString(), completed_modules: 0, level_number: 1, level_label: 'Initié' });
const profile = (id) => profiles.get(id) || fallback(id);

async function loadProfiles(ids) {
  const missing = [...new Set(ids)].filter((id) => id && !profiles.has(id));
  if (!missing.length) return;
  const { data, error } = await supabase.rpc('get_community_profiles', { profile_ids: missing });
  if (!error) data.forEach((item) => profiles.set(item.id, item));
  missing.forEach((id) => { if (!profiles.has(id)) profiles.set(id, fallback(id)); });
}
async function loadAllProfiles() {
  if (allProfilesLoaded) return;
  const { data, error } = await supabase.rpc('get_community_profiles', { profile_ids: null });
  if (!error) { data.forEach((item) => profiles.set(item.id, item)); allProfilesLoaded = true; }
}
function avatar(item, cls = 'message-avatar') {
  if (item.avatar_url) return `<span class="${cls} has-image" aria-hidden="true"><img src="${esc(item.avatar_url)}" alt=""></span>`;
  return `<span class="${cls}" aria-hidden="true">${esc(item.display_name.trim().charAt(0).toUpperCase() || 'S')}</span>`;
}
const channelFor = (tag) => channels.find((c) => norm(c.slug) === norm(tag) || norm(c.name) === norm(tag));
function rich(text = '') {
  const re = /(https?:\/\/[^\s<]+|@[A-Za-z0-9_.-]{2,32}|#[A-Za-zÀ-ÖØ-öø-ÿ0-9_-]+)/gu;
  let out = '', cursor = 0;
  for (const match of text.matchAll(re)) {
    out += esc(text.slice(cursor, match.index)).replaceAll('\n', '<br>');
    const token = match[0];
    if (token.startsWith('http')) {
      let url = token, suffix = '';
      while (/[),.;!?]$/.test(url)) { suffix = url.at(-1) + suffix; url = url.slice(0, -1); }
      out += `<a class="external-link" href="${esc(url)}" data-external-url="${esc(url)}">${esc(url)}</a>${esc(suffix)}`;
    } else if (token[0] === '@') out += `<button class="inline-mention" type="button" data-mention-username="${esc(token.slice(1))}">${esc(token)}</button>`;
    else {
      const tag = token.slice(1), target = channelFor(tag);
      out += `<button class="inline-mention" type="button" data-channel-slug="${esc(target?.slug || tag)}">${esc(token)}</button>`;
    }
    cursor = match.index + token.length;
  }
  return out + esc(text.slice(cursor)).replaceAll('\n', '<br>');
}
function reactions(message) {
  const groups = new Map();
  (message.message_reactions || []).forEach((r) => {
    const group = groups.get(r.emoji) || { count: 0, mine: false };
    group.count += 1; if (r.user_id === user.id) group.mine = true; groups.set(r.emoji, group);
  });
  return groups.size ? `<div class="reaction-summary">${[...groups].map(([emoji, group]) => `<button type="button" class="reaction-chip${group.mine ? ' mine' : ''}" data-reaction="${emoji}" aria-pressed="${group.mine}"><span>${emoji}</span><b>${group.count}</b></button>`).join('')}</div>` : '';
}
function shared(message) {
  const item = message.shared_message;
  if (!item) return '';
  return `<div class="shared-message"><button type="button" data-channel-slug="${esc(item.channel_slug || '')}"><strong>${esc(profile(item.user_id).display_name)}</strong> dans #${esc(item.channel_name || 'canal')}</button><span>${item.deleted_at ? '<em>Message supprimé</em>' : rich(item.content)}</span></div>`;
}
const iconButton = (action, icon, label, cls = '') => `<button class="message-action ${cls}" type="button" data-message-action="${action}" aria-label="${label}" title="${label}">${svg[icon]}</button>`;
function tools(message, reply = false) {
  if (message.deleted_at) return '';
  const own = message.user_id === user.id;
  return `<div class="message-tools">${reply ? iconButton('reply', 'reply', 'Répondre') : ''}${own ? iconButton('edit', 'edit', 'Modifier') : ''}${iconButton('share', 'share', 'Partager')}<button class="message-action reaction-toggle" type="button" aria-label="Ajouter une réaction" title="Réagir" aria-expanded="false">${svg.smile}</button>${isAdmin() || own ? iconButton('delete', 'trash', 'Supprimer', 'message-delete') : ''}<div class="reaction-picker" hidden>${REACTIONS.map((e) => `<button type="button" data-reaction="${e}" aria-label="Réagir avec ${e}">${e}</button>`).join('')}</div></div>`;
}
const deletedLabel = (m) => m.deleted_at ? `<span class="deleted-label">${isAdmin() ? 'Supprimé · visible pour la modération' : 'Message supprimé'}</span>` : '';
function messageMarkup(m, index = -1) {
  const prev = index >= 0 ? messages[index - 1] : null;
  const grouped = prev && !m.parent_message_id && prev.user_id === m.user_id && sameMinute(prev.created_at, m.created_at);
  const author = profile(m.user_id);
  return `<article class="message-entry${grouped ? ' grouped' : ''}${m.user_id === user.id ? ' mine' : ''}${m.deleted_at ? ' deleted' : ''}" data-message-id="${m.id}"><button class="profile-trigger message-profile" type="button" data-profile-id="${m.user_id}" aria-label="Voir le profil de ${esc(author.display_name)}">${avatar(author)}</button><div class="message-column"><header class="message-meta"><button class="profile-trigger message-author" type="button" data-profile-id="${m.user_id}">${esc(author.display_name)}</button><time datetime="${esc(m.created_at)}">${time(m.created_at)}</time></header>${shared(m)}${m.deleted_at && !isAdmin() ? '' : `<div class="message-content">${rich(m.content)}</div>`}${deletedLabel(m)}${m.edited_at && !m.deleted_at ? '<span class="edited-label">modifié</span>' : ''}${m.deleted_at ? '' : reactions(m)}</div>${tools(m)}</article>`;
}
function questionMarkup(q) {
  const author = profile(q.user_id), replies = messages.filter((m) => m.parent_message_id === q.id);
  return `<article class="question-thread"><div class="message-entry question-root${q.deleted_at ? ' deleted' : ''}" data-message-id="${q.id}"><button class="profile-trigger message-profile" type="button" data-profile-id="${q.user_id}">${avatar(author)}</button><div class="message-column"><header class="message-meta"><button class="profile-trigger message-author" type="button" data-profile-id="${q.user_id}">${esc(author.display_name)}</button><time datetime="${esc(q.created_at)}">${time(q.created_at)}</time></header>${shared(q)}${q.deleted_at && !isAdmin() ? '' : `<div class="message-content question-content">${rich(q.content)}</div>`}${deletedLabel(q)}${q.edited_at && !q.deleted_at ? '<span class="edited-label">modifié</span>' : ''}${q.deleted_at ? '' : reactions(q)}<span class="answer-count">${replies.length} réponse${replies.length > 1 ? 's' : ''}</span></div>${tools(q, true)}</div>${replies.length ? `<div class="question-replies">${replies.map((m) => messageMarkup(m)).join('')}</div>` : '<p class="no-answer">Soyez le premier à répondre.</p>'}</article>`;
}
function renderMessages() {
  if (!messages.length) { els.list.innerHTML = ''; els.state.hidden = false; els.state.textContent = 'Le canal est calme. Posez la première pierre.'; return; }
  els.state.hidden = true;
  els.list.innerHTML = active?.kind === 'questions' ? messages.filter((m) => !m.parent_message_id).map(questionMarkup).join('') : messages.map(messageMarkup).join('');
}
const nearBottom = () => els.history.scrollHeight - els.history.scrollTop - els.history.clientHeight < 140;
const bottom = (smooth = false) => els.history.scrollTo({ top: els.history.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
function renderChannels() {
  const marks = { chat: '#', announcements: '!', questions: '?' };
  els.channels.innerHTML = channels.map((c) => `<button class="channel-button${c.id === active?.id ? ' active' : ''}" type="button" data-channel-id="${c.id}"><span aria-hidden="true">${marks[c.kind] || '#'}</span><span><strong>${esc(c.name)}</strong><small>${esc(c.description || '')}</small></span></button>`).join('');
}
async function unsubscribe() { if (room) { const old = room; room = null; await supabase.removeChannel(old); } }
function fetchMessages(before) { return supabase.rpc('get_channel_messages', { p_channel_id: active.id, p_before: before || null, p_limit: PAGE_SIZE }); }
async function loadMessages({ preserve = false, smooth = false } = {}) {
  const keepBottom = nearBottom(), oldTop = els.history.scrollTop, channelId = active.id;
  if (!preserve) { els.state.hidden = false; els.state.textContent = 'Chargement des messages…'; }
  const { data, error } = await fetchMessages();
  if (channelId !== active?.id) return;
  if (error) { els.state.hidden = false; els.state.textContent = `Les messages ne peuvent pas être chargés : ${error.message}`; return; }
  messages = [...data].reverse();
  await loadProfiles(messages.flatMap((m) => [m.user_id, m.shared_message?.user_id]));
  oldest = messages[0]?.created_at; historyEnded = data.length < PAGE_SIZE; els.more.hidden = historyEnded; renderMessages();
  requestAnimationFrame(() => { if (!preserve || keepBottom) bottom(smooth); else els.history.scrollTop = oldTop; });
}
function applyReaction(payload) {
  const r = payload.new?.id ? payload.new : payload.old, m = messages.find((item) => item.id === r.message_id); if (!m) return;
  m.message_reactions ||= [];
  if (payload.eventType === 'DELETE') m.message_reactions = m.message_reactions.filter((item) => item.id !== r.id);
  else if (!m.message_reactions.some((item) => item.id === r.id)) m.message_reactions.push(r);
  const top = els.history.scrollTop; renderMessages(); els.history.scrollTop = top;
}
function subscribe(channel) {
  els.realtime.textContent = 'Connexion…';
  const sub = supabase.channel(`community:${channel.id}`, { config: { presence: { key: user.id } } }); room = sub;
  const presence = () => { if (sub !== room) return; const count = Object.keys(sub.presenceState()).length; els.count.textContent = count; els.plural.textContent = count > 1 ? 's' : ''; };
  sub.on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${channel.id}` }, () => loadMessages({ preserve: true, smooth: true }))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, applyReaction)
    .on('presence', { event: 'sync' }, presence).on('presence', { event: 'join' }, presence).on('presence', { event: 'leave' }, presence)
    .subscribe(async (status) => { if (sub !== room) return; if (status === 'SUBSCRIBED') { els.realtime.textContent = 'En direct'; await sub.track({ user_id: user.id, name: profile(user.id).display_name }); } else if (['CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) els.realtime.textContent = 'Reconnexion…'; });
}
const placeholder = () => active?.kind === 'questions' ? 'Ex. Comment mieux organiser mon sommeil ?' : active?.kind === 'announcements' ? 'Publier une annonce…' : `Écrire dans #${active?.name.toLowerCase() || 'canal'}…`;
function resetComposer() {
  replyId = editId = undefined; els.context.hidden = true; els.input.value = ''; els.input.style.height = ''; els.input.placeholder = placeholder(); els.suggestions.hidden = true;
  if (active?.kind === 'questions') { els.guidance.textContent = 'Posez une question claire qui se termine par « ? ».'; els.guidance.dataset.tone = ''; els.guidance.hidden = false; }
  else if (active?.kind !== 'announcements') els.guidance.hidden = true;
}
async function switchChannel(id) {
  const next = channels.find((c) => c.id === id || c.slug === id); if (!next || switching || active?.id === next.id) return;
  switching = true; await unsubscribe(); active = next; messages = []; oldest = undefined; els.count.textContent = '0'; els.name.textContent = next.name; els.description.textContent = next.description || '';
  els.form.hidden = next.kind === 'announcements' && !isAdmin(); els.guidance.hidden = true;
  if (next.kind === 'announcements' && isAdmin()) { els.guidance.textContent = 'Cette annonce sera affichée à tous les membres pendant 10 minutes.'; els.guidance.dataset.tone = ''; els.guidance.hidden = false; }
  resetComposer(); renderChannels(); const url = new URL(location.href); url.searchParams.set('canal', next.slug); window.history.replaceState(null, '', url);
  await loadMessages(); subscribe(next); switching = false;
}
async function loadMore() {
  if (!oldest || historyEnded) return; els.more.disabled = true; const oldHeight = els.history.scrollHeight; const { data, error } = await fetchMessages(oldest);
  if (!error) { const older = [...data].reverse(); await loadProfiles(older.flatMap((m) => [m.user_id, m.shared_message?.user_id])); messages = [...older, ...messages]; oldest = messages[0]?.created_at; historyEnded = data.length < PAGE_SIZE; renderMessages(); requestAnimationFrame(() => { els.history.scrollTop = els.history.scrollHeight - oldHeight; }); }
  els.more.disabled = false; els.more.textContent = error ? 'Réessayer de charger' : 'Charger les messages précédents'; els.more.hidden = historyEnded;
}
function errorMessage(text) { els.guidance.textContent = text; els.guidance.dataset.tone = 'error'; els.guidance.hidden = false; }
async function send() {
  const content = els.input.value.trim(); if (!content || !active || (active.kind === 'announcements' && !isAdmin())) return;
  if (!editId && active.kind === 'questions' && !replyId && !content.endsWith('?')) { errorMessage('Ajoutez « ? » à la fin pour publier votre question.'); return els.input.focus(); }
  const submit = els.form.querySelector('[type="submit"]'); submit.disabled = els.input.disabled = true;
  const result = editId ? await supabase.from('messages').update({ content }).eq('id', editId).eq('user_id', user.id).select('id').single() : await supabase.from('messages').insert({ channel_id: active.id, user_id: user.id, content, parent_message_id: replyId || null }).select('id').single();
  submit.disabled = els.input.disabled = false;
  if (result.error) { errorMessage(`Le message n’a pas été enregistré : ${result.error.message}`); return els.input.focus(); }
  resetComposer(); await loadMessages({ preserve: true, smooth: true }); els.input.focus();
}
function startReply(id) {
  const q = messages.find((m) => m.id === id && !m.parent_message_id && !m.deleted_at); if (!q || active.kind !== 'questions') return;
  editId = undefined; replyId = q.id; els.contextLabel.innerHTML = `Réponse à <strong>${esc(profile(q.user_id).display_name)}</strong>`; els.context.hidden = false; els.guidance.hidden = true; els.input.value = ''; els.input.placeholder = 'Écrire votre réponse…'; els.input.focus();
}
function startEdit(id) {
  const m = messages.find((item) => item.id === id); if (!m || m.user_id !== user.id || m.deleted_at) return;
  replyId = undefined; editId = m.id; els.contextLabel.innerHTML = '<strong>Modification du message</strong>'; els.context.hidden = false; els.guidance.hidden = true; els.input.value = m.content; els.input.placeholder = 'Modifier le message…'; els.input.dispatchEvent(new Event('input')); els.input.focus(); els.input.setSelectionRange(m.content.length, m.content.length);
}
async function removeMessage(id) {
  const m = messages.find((item) => item.id === id); if (!m || m.deleted_at || (!isAdmin() && m.user_id !== user.id)) return;
  if (!confirm('Supprimer ce message ? Il restera disponible pour la modération.')) return;
  const { error } = await supabase.rpc('soft_delete_message', { p_message_id: id }); if (error) return errorMessage(`Le message n’a pas pu être supprimé : ${error.message}`); await loadMessages({ preserve: true });
}
async function toggleReaction(id, emoji) {
  const m = messages.find((item) => item.id === id); if (!m || m.deleted_at || !REACTIONS.includes(emoji)) return;
  const found = (m.message_reactions || []).find((r) => r.user_id === user.id && r.emoji === emoji);
  if (found) { const { error } = await supabase.from('message_reactions').delete().eq('id', found.id); if (!error) applyReaction({ eventType: 'DELETE', old: found }); }
  else { const { data, error } = await supabase.from('message_reactions').insert({ message_id: id, user_id: user.id, emoji }).select('id,message_id,user_id,emoji').single(); if (!error) applyReaction({ eventType: 'INSERT', new: data }); }
}
function closePickers(except) { document.querySelectorAll('.reaction-picker:not([hidden])').forEach((p) => { if (p !== except) { p.hidden = true; p.closest('.message-tools')?.querySelector('.reaction-toggle')?.setAttribute('aria-expanded', 'false'); } }); }
function openPicker(entry) { const picker = entry?.querySelector('.reaction-picker'), toggle = entry?.querySelector('.reaction-toggle'); if (!picker) return; closePickers(picker); picker.hidden = false; toggle.setAttribute('aria-expanded', 'true'); }
function showProfile(id) {
  const p = profile(id); els.profile.innerHTML = `${avatar(p, 'community-profile-avatar')}<span class="eyebrow">PROFIL MEMBRE</span><h2 id="community-profile-name">${esc(p.display_name)}</h2>${p.username ? `<p class="community-profile-username">@${esc(p.username)}</p>` : ''}<div class="community-profile-level"><strong>Niveau ${Number(p.level_number) || 1}</strong><span>${esc(p.level_label || 'Initié')} · ${Number(p.completed_modules) || 0} module${Number(p.completed_modules) > 1 ? 's' : ''} terminé${Number(p.completed_modules) > 1 ? 's' : ''}</span></div><div class="community-profile-meta"><span>${esc(roleLabels[p.role] || roleLabels.member)}</span>${p.department ? `<span>Département ${esc(p.department)}</span>` : ''}<span>Membre depuis ${memberSince(p.created_at)}</span></div>`; els.profileDialog.showModal();
}
function openShare(id) {
  const m = messages.find((item) => item.id === id); if (!m || m.deleted_at) return; shareId = id;
  els.shareList.innerHTML = channels.filter((c) => c.kind !== 'announcements' || isAdmin()).map((c) => `<button type="button" data-share-channel="${c.id}"><span>#</span><strong>${esc(c.name)}</strong><small>${esc(c.description || '')}</small></button>`).join(''); els.shareDialog.showModal();
}
async function shareMessage(channelId) {
  if (!shareId) return; const { error } = await supabase.from('messages').insert({ channel_id: channelId, user_id: user.id, content: 'Message partagé', shared_message_id: shareId });
  if (error) return errorMessage(`Le message n’a pas été partagé : ${error.message}`); els.shareDialog.close(); shareId = undefined; if (channelId === active.id) await loadMessages({ preserve: true, smooth: true });
}
function external(url) { try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol)) return; els.externalHost.textContent = parsed.hostname; els.externalContinue.href = parsed.href; els.externalDialog.showModal(); } catch {} }
function mentionToken() { const before = els.input.value.slice(0, els.input.selectionStart), match = before.match(/(^|\s)([@#])([\p{L}\p{N}_.-]*)$/u); return match ? { marker: match[2], query: match[3], start: before.length - match[2].length - match[3].length, end: before.length } : null; }
async function suggest() {
  const token = mentionToken(); if (!token) return void (els.suggestions.hidden = true); if (token.marker === '@') await loadAllProfiles(); const q = norm(token.query);
  const items = token.marker === '@' ? [...profiles.values()].filter((p) => p.username && (norm(p.username).includes(q) || norm(p.display_name).includes(q))).slice(0, 6).map((p) => ({ value: p.username, title: `@${p.username}`, detail: p.display_name, icon: avatar(p, 'suggestion-avatar') })) : channels.filter((c) => norm(c.slug).includes(q) || norm(c.name).includes(q)).slice(0, 6).map((c) => ({ value: c.slug, title: `#${c.slug}`, detail: c.name, icon: '<span class="suggestion-channel">#</span>' }));
  if (!items.length) return void (els.suggestions.hidden = true);
  els.suggestions.innerHTML = items.map((item) => `<button type="button" role="option" data-suggestion-marker="${token.marker}" data-suggestion-value="${esc(item.value)}">${item.icon}<span><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></span></button>`).join(''); els.suggestions.hidden = false;
}
function applySuggestion(button) { const token = mentionToken(); if (!token) return; els.input.setRangeText(`${button.dataset.suggestionMarker}${button.dataset.suggestionValue} `, token.start, token.end, 'end'); els.suggestions.hidden = true; els.input.focus(); }

els.channels.addEventListener('click', (e) => { const b = e.target.closest('[data-channel-id]'); if (b) switchChannel(b.dataset.channelId); });
els.more.addEventListener('click', loadMore); els.form.addEventListener('submit', (e) => { e.preventDefault(); send(); });
els.input.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !els.suggestions.hidden) els.suggestions.hidden = true; else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && els.suggestions.hidden) { e.preventDefault(); send(); } });
els.input.addEventListener('input', () => { els.input.style.height = 'auto'; els.input.style.height = `${Math.min(els.input.scrollHeight, 132)}px`; if (active?.kind === 'questions' && !replyId && !editId) { els.guidance.textContent = 'Posez une question claire qui se termine par « ? ».'; els.guidance.dataset.tone = ''; } suggest(); });
els.suggestions.addEventListener('click', (e) => { const b = e.target.closest('[data-suggestion-value]'); if (b) applySuggestion(b); });
els.list.addEventListener('click', async (e) => {
  const link = e.target.closest('[data-external-url]'); if (link) { e.preventDefault(); return external(link.dataset.externalUrl); }
  const mention = e.target.closest('[data-mention-username]'); if (mention) { await loadAllProfiles(); const p = [...profiles.values()].find((item) => norm(item.username || '') === norm(mention.dataset.mentionUsername)); if (p) showProfile(p.id); return; }
  const channel = e.target.closest('[data-channel-slug]'); if (channel) return switchChannel(channel.dataset.channelSlug);
  const profileButton = e.target.closest('[data-profile-id]'); if (profileButton) return showProfile(profileButton.dataset.profileId);
  const entry = e.target.closest('[data-message-id]'); if (!entry) return; const action = e.target.closest('[data-message-action]')?.dataset.messageAction;
  if (action === 'reply') return startReply(entry.dataset.messageId); if (action === 'edit') return startEdit(entry.dataset.messageId); if (action === 'share') return openShare(entry.dataset.messageId); if (action === 'delete') return removeMessage(entry.dataset.messageId);
  const toggle = e.target.closest('.reaction-toggle'); if (toggle) { const picker = entry.querySelector('.reaction-picker'); return picker.hidden ? openPicker(entry) : closePickers(); }
  const reaction = e.target.closest('[data-reaction]'); if (reaction) { toggleReaction(entry.dataset.messageId, reaction.dataset.reaction); closePickers(); }
});
$('#reply-cancel').addEventListener('click', resetComposer); $('#community-profile-close').addEventListener('click', () => els.profileDialog.close()); $('#share-dialog-close').addEventListener('click', () => els.shareDialog.close()); $('#external-link-close').addEventListener('click', () => els.externalDialog.close()); $('#external-link-cancel').addEventListener('click', () => els.externalDialog.close()); els.externalContinue.addEventListener('click', () => els.externalDialog.close());
els.shareList.addEventListener('click', (e) => { const b = e.target.closest('[data-share-channel]'); if (b) shareMessage(b.dataset.shareChannel); });
els.list.addEventListener('pointerdown', (e) => { if (e.target.closest('.message-content')) longPressTimer = setTimeout(() => openPicker(e.target.closest('[data-message-id]')), 480); }); ['pointerup', 'pointercancel', 'pointermove'].forEach((name) => els.list.addEventListener(name, () => clearTimeout(longPressTimer)));
document.addEventListener('click', (e) => { if (!e.target.closest('.message-tools')) closePickers(); if (!e.target.closest('.composer-input-wrap')) els.suggestions.hidden = true; });
[els.profileDialog, els.shareDialog, els.externalDialog].forEach((dialog) => dialog.addEventListener('click', (e) => { if (e.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); }));
window.addEventListener('pagehide', () => { if (room) supabase.removeChannel(room); if (announcementRoom) supabase.removeChannel(announcementRoom); clearTimeout(announcementTimer); });

async function subscribeAnnouncements() {
  const channel = channels.find((c) => c.kind === 'announcements'); if (!channel) return;
  const show = async (m) => { const end = new Date(m.announcement_expires_at || new Date(m.created_at).getTime() + 600000), remaining = end - Date.now(); if (remaining <= 0 || m.deleted_at) return; await loadProfiles([m.user_id]); els.announcementAuthor.textContent = profile(m.user_id).display_name; els.announcementContent.textContent = m.content; els.announcementTime.textContent = `Publié à ${time(m.created_at)}`; els.announcement.hidden = false; clearTimeout(announcementTimer); announcementTimer = setTimeout(() => { els.announcement.hidden = true; }, remaining); };
  const { data } = await supabase.from('messages').select('id,user_id,content,created_at,deleted_at,announcement_expires_at').eq('channel_id', channel.id).is('deleted_at', null).gt('announcement_expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle(); if (data) show(data);
  announcementRoom = supabase.channel(`community-announcements:${channel.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channel.id}` }, (payload) => show(payload.new)).subscribe();
}
async function init() {
  const { data: session } = await supabase.auth.getSession(); user = session.session?.user; if (!user) return location.replace('/#connexion');
  await loadProfiles([user.id]); ownProfile = profile(user.id); const { data, error } = await supabase.from('channels').select('id,slug,kind,name,description,order_index').order('order_index');
  if (error) return void (els.state.textContent = `La communauté ne peut pas être ouverte : ${error.message}`); channels = data; if (!channels.length) return void (els.state.textContent = 'Aucun canal n’est encore disponible.');
  const requested = new URLSearchParams(location.search).get('canal'); await subscribeAnnouncements(); await switchChannel(channels.find((c) => c.slug === requested || c.id === requested)?.id || channels[0].id);
}
init();
