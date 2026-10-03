import { supabase } from './supabase.js';
import { openMemberProfile } from './member-profile-card.js';

const session = (await supabase.auth.getSession()).data.session;
if (session) initialize(session.user);

async function initialize(user) {
  const { data: ownProfile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const isAdmin = ownProfile?.role === 'admin';
  const supportIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M6 12H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v-7Zm12 0h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2v-7Z"/><path d="M17 19c-1 2-3 2-5 2"/></svg>';
  const sendIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 14-7-4 14-3-5-7-2Zm7 2 7-9"/></svg>';
  const widget = document.createElement('section');
  widget.className = `support-widget${isAdmin ? ' support-widget-admin' : ''}`;
  widget.innerHTML = `<button class="support-trigger" type="button" aria-label="${isAdmin ? 'Ouvrir la boîte support' : 'Contacter le support STOA'}" title="${isAdmin ? 'Boîte support' : 'Aide et support'}" aria-expanded="false">${supportIcon}<b hidden></b></button><div class="support-panel" hidden><header><div><span class="eyebrow">${isAdmin ? 'ESPACE STAFF' : 'AIDE & SUPPORT'}</span><strong>${isAdmin ? 'Boîte support' : 'Support STOA'}</strong><small>${isAdmin ? 'Demandes des membres' : 'Académie, compte et abonnement'}</small></div><button type="button" data-support-close aria-label="Fermer">×</button></header><button class="support-back" type="button" hidden>← Toutes les demandes</button><div class="support-roster-search" ${isAdmin ? '' : 'hidden'}><label class="sr-only" for="support-member-search">Rechercher une demande</label><input id="support-member-search" type="search" placeholder="Rechercher un membre…" autocomplete="off"></div><div class="support-content"><p class="support-loading">Ouverture du support…</p></div><form class="support-form" hidden><label class="sr-only" for="support-message">Votre message</label><textarea id="support-message" rows="1" maxlength="2000" placeholder="${isAdmin ? 'Répondre en tant que Support STOA…' : 'Posez votre question au support…'}" required></textarea><button type="submit" aria-label="Envoyer">${sendIcon}</button></form><p class="support-status" role="status"></p></div>`;
  document.body.append(widget);

  const trigger = widget.querySelector('.support-trigger');
  const panel = widget.querySelector('.support-panel');
  const content = widget.querySelector('.support-content');
  const form = widget.querySelector('.support-form');
  const back = widget.querySelector('.support-back');
  const status = widget.querySelector('.support-status');
  const search = widget.querySelector('#support-member-search');
  const rosterSearch = widget.querySelector('.support-roster-search');
  let messages = [], profiles = new Map(), activeMember = isAdmin ? null : user.id, channel;

  const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const normalize = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const time = (value) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  const profile = (id) => profiles.get(id) || { display_name: 'Membre STOA', username: '', avatar_url: null };
  const avatar = (item, id, clickable = false) => {
    const tag = clickable ? 'button' : 'span', attrs = clickable ? `type="button" data-member-profile="${id}" aria-label="Voir le profil de ${esc(item.display_name)}"` : 'aria-hidden="true"';
    return item.avatar_url ? `<${tag} class="support-avatar has-image" ${attrs} style="background-image:url('${esc(item.avatar_url)}')"></${tag}>` : `<${tag} class="support-avatar" ${attrs}>${esc((item.display_name || 'S')[0].toUpperCase())}</${tag}>`;
  };
  const supportAvatar = '<span class="support-avatar support-avatar-staff" aria-hidden="true">?</span>';
  const loadProfiles = async (ids) => { const missing = [...new Set(ids)].filter((id) => id && !profiles.has(id)); if (!missing.length) return; const { data } = await supabase.rpc('get_community_profiles', { profile_ids: missing }); (data || []).forEach((item) => profiles.set(item.id, item)); };
  const incoming = (item) => isAdmin ? item.sender_id === item.member_id : item.sender_id !== item.member_id;
  const setUnread = () => { const count = messages.filter((item) => !item.read_at && incoming(item)).length, badge = trigger.querySelector('b'); badge.textContent = count ? (count > 9 ? '9+' : String(count)) : ''; badge.hidden = count === 0; trigger.classList.toggle('has-unread', count > 0); };
  const markRead = async () => { if (panel.hidden || !activeMember) return; const ids = messages.filter((item) => item.member_id === activeMember && !item.read_at && incoming(item)).map((item) => item.id); if (!ids.length) return; await supabase.from('support_messages').update({ read_at: new Date().toISOString() }).in('id', ids); messages.forEach((item) => { if (ids.includes(item.id)) item.read_at = new Date().toISOString(); }); setUnread(); };

  const renderThread = async () => {
    const rows = messages.filter((item) => item.member_id === activeMember);
    await loadProfiles([activeMember, ...rows.map((item) => item.sender_id)]);
    const member = profile(activeMember);
    const threadHead = isAdmin ? `<div class="support-thread-member">${avatar(member, activeMember, true)}<button type="button" data-member-profile="${activeMember}"><small>DEMANDE DE</small><strong>${esc(member.display_name)}</strong>${member.username ? `<span>@${esc(member.username)}</span>` : ''}</button></div>` : '<div class="support-welcome"><span>?</span><div><strong>Une question ?</strong><p>Écrivez ici. Un membre du staff STOA vous répondra dans cette conversation.</p></div></div>';
    const items = rows.map((item) => {
      const mine = item.sender_id === user.id;
      if (!isAdmin) {
        const fromSupport = item.sender_id !== item.member_id;
        return `<article class="support-message ${mine ? 'mine' : 'support-reply'}"><header>${fromSupport ? supportAvatar : ''}<strong>${fromSupport ? 'Support STOA' : 'Vous'}</strong><time>${time(item.created_at)}</time></header><p>${esc(item.content).replaceAll('\n', '<br>')}</p></article>`;
      }
      const fromMember = item.sender_id === item.member_id;
      const person = profile(item.sender_id);
      return `<article class="support-message ${fromMember ? 'support-member-message' : 'mine'}"><header>${fromMember ? avatar(person, item.sender_id, true) : supportAvatar}<strong>${fromMember ? esc(person.display_name) : item.sender_id === user.id ? 'Vous · Support' : 'Support STOA'}</strong><time>${time(item.created_at)}</time></header><p>${esc(item.content).replaceAll('\n', '<br>')}</p></article>`;
    }).join('');
    content.innerHTML = `${threadHead}${items || '<p class="support-empty">Aucun message pour le moment.<br>Vous pouvez poser votre première question ici.</p>'}`;
    content.scrollTop = content.scrollHeight;
    form.hidden = false;
    back.hidden = !isAdmin;
    rosterSearch.hidden = true;
    await markRead();
  };

  const renderConversations = async () => {
    const memberIds = [...new Set(messages.map((item) => item.member_id))];
    await loadProfiles(memberIds);
    const query = normalize(search?.value || '');
    const filtered = memberIds.filter((id) => { const person = profile(id); return !query || normalize(`${person.display_name} ${person.username}`).includes(query); });
    filtered.sort((a, b) => { const aDate = [...messages].reverse().find((item) => item.member_id === a)?.created_at || '', bDate = [...messages].reverse().find((item) => item.member_id === b)?.created_at || ''; return bDate.localeCompare(aDate); });
    content.innerHTML = filtered.map((id) => {
      const person = profile(id), rows = messages.filter((item) => item.member_id === id), last = rows.at(-1), unread = rows.filter((item) => !item.read_at && item.sender_id === id).length;
      return `<div class="support-conversation" data-support-member="${id}">${avatar(person, id, true)}<button class="support-conversation-open" type="button" data-support-member="${id}"><strong>${esc(person.display_name)}</strong><small>${last ? esc(last.content) : 'Nouvelle demande'}</small></button><div><time>${last ? time(last.created_at) : ''}</time>${unread ? `<b>${unread > 9 ? '9+' : unread}</b>` : ''}</div></div>`;
    }).join('') || '<p class="support-empty">Aucune demande de support pour le moment.</p>';
    form.hidden = true;
    back.hidden = true;
    rosterSearch.hidden = false;
  };

  const render = () => isAdmin && !activeMember ? renderConversations() : renderThread();
  const load = async () => { let query = supabase.from('support_messages').select('*').order('created_at'); if (!isAdmin) query = query.eq('member_id', user.id); const { data, error } = await query; if (error) { content.innerHTML = `<p class="support-empty">Le support est momentanément indisponible.<br>${esc(error.message)}</p>`; return; } messages = data || []; setUnread(); await render(); };
  const fitMobileViewport = () => {
    if (panel.hidden || !matchMedia('(max-width: 760px)').matches) { panel.classList.remove('support-viewport-fit'); panel.style.removeProperty('top'); panel.style.removeProperty('height'); return; }
    const viewport = window.visualViewport;
    const viewportHeight = viewport?.height || innerHeight;
    const keyboardOpen = viewportHeight < document.documentElement.clientHeight - 120;
    const topOffset = (viewport?.offsetTop || 0) + 64;
    panel.classList.add('support-viewport-fit');
    panel.style.top = `${topOffset}px`;
    panel.style.height = `${Math.max(160, viewportHeight - 72)}px`;
    if (keyboardOpen) requestAnimationFrame(() => { content.scrollTop = content.scrollHeight; });
  };
  const toggle = (open) => { panel.hidden = !open; trigger.setAttribute('aria-expanded', String(open)); widget.classList.toggle('support-open', open); if (open) { render(); requestAnimationFrame(fitMobileViewport); } else fitMobileViewport(); };

  trigger.addEventListener('click', () => toggle(panel.hidden));
  widget.querySelector('[data-support-close]').addEventListener('click', () => toggle(false));
  content.addEventListener('click', (event) => { const profileButton = event.target.closest('[data-member-profile]'); if (profileButton && isAdmin) return openMemberProfile(profileButton.dataset.memberProfile); const button = event.target.closest('[data-support-member]'); if (button && isAdmin) { activeMember = button.dataset.supportMember; render(); } });
  back.addEventListener('click', () => { activeMember = null; render(); });
  search?.addEventListener('input', renderConversations);
  form.addEventListener('submit', async (event) => { event.preventDefault(); const textarea = form.querySelector('textarea'), value = textarea.value.trim(); if (!value || !activeMember) return; const button = form.querySelector('button'); button.disabled = true; const { error } = await supabase.from('support_messages').insert({ member_id: activeMember, sender_id: user.id, content: value }); button.disabled = false; status.textContent = error ? error.message : ''; if (!error) { textarea.value = ''; textarea.style.height = ''; await load(); } });
  form.querySelector('textarea').addEventListener('input', (event) => { event.currentTarget.style.height = ''; event.currentTarget.style.height = `${Math.min(96, event.currentTarget.scrollHeight)}px`; });
  form.querySelector('textarea').addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); } });
  form.querySelector('textarea').addEventListener('focus', () => setTimeout(fitMobileViewport, 120));
  form.querySelector('textarea').addEventListener('blur', () => setTimeout(fitMobileViewport, 120));
  window.visualViewport?.addEventListener('resize', fitMobileViewport);
  window.visualViewport?.addEventListener('scroll', fitMobileViewport);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) toggle(false); });

  await load();
  channel = supabase.channel(`support:${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, load).subscribe();
  addEventListener('pagehide', () => { if (channel) supabase.removeChannel(channel); window.visualViewport?.removeEventListener('resize', fitMobileViewport); window.visualViewport?.removeEventListener('scroll', fitMobileViewport); }, { once: true });
}
