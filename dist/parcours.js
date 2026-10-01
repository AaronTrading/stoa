import { supabase } from './supabase.js';
import { loadMemberSnapshot, resumeUrl } from './member-data.js';

const $=selector=>document.querySelector(selector);
const esc=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const roman=['I','II','III','IV','V'];
const session=(await supabase.auth.getSession()).data.session;
if(!session)location.replace('/#connexion');else hydrateJourney(session.user);

async function hydrateJourney(user){
  const snapshot=await loadMemberSnapshot(user.id);
  $('#journey-percent').textContent=`${snapshot.percent}%`;
  $('#journey-progress').value=snapshot.percent;
  $('#journey-count').textContent=`${snapshot.completed.size} leçon${snapshot.completed.size>1?'s':''} terminée${snapshot.completed.size>1?'s':''}`;
  $('#journey-pillars').innerHTML=snapshot.pillars.map((pillar,index)=>{
    const items=snapshot.lessons.filter(item=>item.pillar?.id===pillar.id),count=items.filter(item=>snapshot.completed.has(item.id)).length,value=items.length?Math.round(count/items.length*100):0;
    const next=items.find(item=>!snapshot.completed.has(item.id))||items[0];
    return `<a class="journey-pillar" href="${esc(next?.url||'/academie')}"><span>${roman[index]||index+1}</span><div><strong>${esc(pillar.title)}</strong><small>${count}/${items.length} leçons terminées</small><progress max="100" value="${value}"></progress></div><b>${value}%</b><i>→</i></a>`;
  }).join('');
  if(snapshot.resume){const block=$('#journey-continue');block.hidden=false;$('#journey-continue-title').textContent=snapshot.resume.lesson.title;$('#journey-continue-meta').textContent=`${snapshot.resume.lesson.pillar?.title||''} · ${snapshot.resume.lesson.chapter.title} · ${Math.round(Number(snapshot.resume.state.progress_ratio||0)*100)}% lu`;$('#journey-continue-link').href=resumeUrl(snapshot.resume);}
  $('#journey-recent').innerHTML=snapshot.recent.slice(0,6).map(item=>`<a href="${esc(resumeUrl(item))}"><span>${esc(item.lesson.pillar?.title||'Académie')} · ${esc(item.lesson.chapter.title)}</span><strong>${esc(item.lesson.title)}</strong><div><progress max="100" value="${Math.round(Number(item.state.progress_ratio||0)*100)}"></progress><small>${Math.round(Number(item.state.progress_ratio||0)*100)}%</small></div></a>`).join('')||'<p>Commencez une leçon pour construire votre historique de lecture.</p>';
}
