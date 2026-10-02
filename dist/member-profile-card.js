import { supabase } from './supabase.js';
import { departmentLabel } from './departments.js';

const esc=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const roleLabels={member:'Membre de l’Académie',coaching:'Membre accompagné',admin:'Équipe STOA'};
let dialog;

function ensureDialog(){
  if(dialog)return dialog;
  dialog=document.createElement('dialog');dialog.className='member-card-dialog';dialog.innerHTML='<button class="member-card-close" type="button" aria-label="Fermer">×</button><div data-member-card-content></div>';
  document.body.append(dialog);
  dialog.querySelector('.member-card-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  return dialog;
}

export async function openMemberProfile(userId){
  if(!userId)return;
  const panel=ensureDialog(),content=panel.querySelector('[data-member-card-content]');
  content.innerHTML='<p class="member-card-loading">Ouverture du profil…</p>';panel.showModal();
  const session=(await supabase.auth.getSession()).data.session;if(!session)return;
  const [{data:rows,error},{data:own}]=await Promise.all([
    supabase.rpc('get_community_profiles',{profile_ids:[userId]}),
    supabase.from('profiles').select('role').eq('id',session.user.id).maybeSingle()
  ]);
  if(error||!rows?.[0]){content.innerHTML='<p class="member-card-loading">Ce profil n’est pas disponible.</p>';return;}
  const profile=rows[0],name=profile.display_name||'Membre STOA';let contact=null;
  if(own?.role==='admin')contact=(await supabase.rpc('get_admin_member_contact',{target_user_id:userId})).data?.[0]||null;
  const avatar=profile.avatar_url?`<span class="member-card-avatar has-image"><img src="${esc(profile.avatar_url)}" alt=""></span>`:`<span class="member-card-avatar">${esc(name[0]?.toUpperCase()||'S')}</span>`;
  const completed=Number(profile.completed_modules)||0;
  const contactRows=contact?[
    contact.discord_username?`<a href="https://discord.com/users/${esc(contact.discord_id||'')}" target="_blank" rel="noopener"><span>Discord</span><strong>@${esc(contact.discord_username)}</strong></a>`:'',
    contact.email?`<a href="mailto:${esc(contact.email)}"><span>Email</span><strong>${esc(contact.email)}</strong></a>`:'',
    contact.phone?`<a href="tel:${esc(contact.phone)}"><span>Téléphone</span><strong>${esc(contact.phone)}</strong></a>`:''
  ].filter(Boolean).join(''):'';
  content.innerHTML=`<div class="member-card-head">${avatar}<div><span class="eyebrow">PROFIL MEMBRE</span><h2>${esc(name)}</h2>${profile.username?`<p>@${esc(profile.username)}</p>`:''}</div></div>${profile.bio?`<p class="member-card-bio">${esc(profile.bio)}</p>`:''}<div class="member-card-stats"><span><b>Niveau ${Number(profile.level_number)||1}</b>${esc(profile.level_label||'Initié')}</span><span><b>${completed}</b>leçon${completed>1?'s':''} terminée${completed>1?'s':''}</span></div><div class="member-card-meta"><span>${esc(roleLabels[profile.role]||roleLabels.member)}</span>${profile.department?`<span>${esc(departmentLabel(profile.department))}</span>`:''}</div>${own?.role==='admin'?`<section class="member-card-contact"><span class="eyebrow">CONTACT · ADMIN</span>${contactRows||'<p>Aucune coordonnée supplémentaire.</p>'}</section>`:''}`;
}
