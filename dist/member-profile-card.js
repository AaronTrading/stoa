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
  const [{data:rows,error},{data:own},{data:locations}]=await Promise.all([
    supabase.rpc('get_community_profiles',{profile_ids:[userId]}),
    supabase.from('profiles').select('role').eq('id',session.user.id).maybeSingle(),
    supabase.rpc('get_profile_locations',{profile_ids:[userId]})
  ]);
  if(error||!rows?.[0]){content.innerHTML='<p class="member-card-loading">Ce profil n’est pas disponible.</p>';return;}
  const profile=rows[0],name=profile.display_name||'Membre STOA',locationLabel=locations?.[0]?.location_label||'';let contact=null,restriction=null;
  if(own?.role==='admin'){
    const [contactResult,restrictionResult]=await Promise.all([
      supabase.rpc('get_admin_member_contact',{target_user_id:userId}),
      supabase.from('chat_restrictions').select('restricted_until').eq('user_id',userId).maybeSingle()
    ]);
    contact=contactResult.data?.[0]||null;restriction=restrictionResult.data||null;
  }
  const avatar=profile.avatar_url?`<span class="member-card-avatar has-image"><img src="${esc(profile.avatar_url)}" alt=""></span>`:`<span class="member-card-avatar">${esc(name[0]?.toUpperCase()||'S')}</span>`;
  const completed=Number(profile.completed_modules)||0;
  const contactRows=contact?[
    contact.discord_username?`<a href="https://discord.com/users/${esc(contact.discord_id||'')}" target="_blank" rel="noopener"><span>Discord</span><strong>@${esc(contact.discord_username)}</strong></a>`:'',
    contact.email?`<a href="mailto:${esc(contact.email)}"><span>Email</span><strong>${esc(contact.email)}</strong></a>`:'',
    contact.phone?`<a href="tel:${esc(contact.phone)}"><span>Téléphone</span><strong>${esc(contact.phone)}</strong></a>`:''
  ].filter(Boolean).join(''):'';
  const restrictionText=restriction?(restriction.restricted_until===null?'Exclusion définitive active.':`Exclu jusqu’au ${new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(restriction.restricted_until))}.`):'Aucune exclusion active.';
  const moderation=own?.role==='admin'&&userId!==session.user.id&&profile.role!=='admin'?`<section class="member-card-moderation"><span class="eyebrow">MODÉRATION · ADMIN</span><form data-member-moderation><select aria-label="Durée de l’exclusion"><option value="day">1 jour</option><option value="week">1 semaine</option><option value="month">1 mois</option><option value="permanent">Définitive</option><option value="lift">Lever l’exclusion</option></select><button type="submit">Appliquer</button></form><p data-member-moderation-status>${esc(restrictionText)}</p></section>`:'';
  content.innerHTML=`<div class="member-card-head">${avatar}<div><span class="eyebrow">PROFIL MEMBRE</span><h2>${esc(name)}</h2>${profile.username?`<p>@${esc(profile.username)}</p>`:''}</div></div>${profile.bio?`<p class="member-card-bio">${esc(profile.bio)}</p>`:''}<div class="member-card-stats"><span><b>Niveau ${Number(profile.level_number)||1}</b>${esc(profile.level_label||'Initié')}</span><span><b>${completed}</b>leçon${completed>1?'s':''} terminée${completed>1?'s':''}</span></div><div class="member-card-meta"><span>${esc(roleLabels[profile.role]||roleLabels.member)}</span>${profile.department?`<span>${esc(departmentLabel(profile.department))}</span>`:locationLabel&&locationLabel!=='Non renseigné'?`<span>${esc(locationLabel)}</span>`:''}</div>${own?.role==='admin'?`<section class="member-card-contact"><span class="eyebrow">CONTACT · ADMIN</span>${contactRows||'<p>Aucune coordonnée supplémentaire.</p>'}</section>${moderation}`:''}`;
  const moderationForm=content.querySelector('[data-member-moderation]');
  moderationForm?.addEventListener('submit',async(event)=>{event.preventDefault();const button=moderationForm.querySelector('button'),status=content.querySelector('[data-member-moderation-status]'),duration=moderationForm.querySelector('select').value;button.disabled=true;status.textContent='Application…';status.dataset.tone='';const{error:restrictionError}=await supabase.rpc('set_chat_restriction',{p_user_id:userId,p_duration:duration});button.disabled=false;if(restrictionError){status.textContent=`Impossible d’appliquer la mesure : ${restrictionError.message}`;status.dataset.tone='error';return;}status.textContent=duration==='lift'?'L’exclusion a été levée.':'Le membre est désormais exclu de la communauté.';});
}
