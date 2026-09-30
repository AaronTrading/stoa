import { supabase } from './supabase.js';

const $=selector=>document.querySelector(selector),esc=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const roman=['I','II','III','IV','V'];
const session=(await supabase.auth.getSession()).data.session;
if(!session) location.replace('/#connexion');
else hydrateJourney(session.user);

async function hydrateJourney(user){
  const [{data:chapters},{data:progress},{data:states}]=await Promise.all([
    supabase.from('chapters').select('id,title,order_index,pillar_id,pillar:pillars(id,title,order_index),modules(id,title,order_index,is_visible,duration_minutes)').eq('is_visible',true).order('order_index'),
    supabase.from('user_progress').select('module_id,status').eq('user_id',user.id).eq('status','completed'),
    supabase.from('user_learning_state').select('*').eq('user_id',user.id).order('last_read_at',{ascending:false})
  ]);
  const catalog=(chapters||[]).map(chapter=>({...chapter,modules:(chapter.modules||[]).filter(module=>module.is_visible!==false).sort((a,b)=>a.order_index-b.order_index)}));
  const done=new Set((progress||[]).map(item=>item.module_id));
  const modules=catalog.flatMap(chapter=>chapter.modules.map(module=>({module,chapter,pillar:chapter.pillar,url:`/module?chapitre=${chapter.order_index+1}&module=${module.order_index+1}`})));
  const total=modules.length,percent=total?Math.round(done.size/total*100):0;
  $('#journey-percent').textContent=`${percent}%`;$('#journey-progress').value=percent;$('#journey-count').textContent=`${done.size} module${done.size>1?'s':''} terminé${done.size>1?'s':''}`;
  const groups=[...new Map(catalog.map(chapter=>[chapter.pillar?.id,chapter.pillar])).values()].filter(Boolean).sort((a,b)=>a.order_index-b.order_index);
  $('#journey-pillars').innerHTML=groups.map((pillar,index)=>{const items=modules.filter(item=>item.pillar?.id===pillar.id),count=items.filter(item=>done.has(item.module.id)).length,value=items.length?Math.round(count/items.length*100):0;return `<a class="journey-pillar" href="/academie?chapitre=${Math.min(...catalog.filter(chapter=>chapter.pillar_id===pillar.id).map(chapter=>chapter.order_index))+1}"><span>${roman[index]}</span><div><strong>${esc(pillar.title)}</strong><small>${count}/${items.length} modules terminés</small><progress max="100" value="${value}"></progress></div><b>${value}%</b><i>→</i></a>`;}).join('');
  const recent=(states||[]).map(state=>({...state,item:modules.find(entry=>entry.module.id===state.module_id)})).filter(state=>state.item);
  if(recent[0]){const state=recent[0],block=$('#journey-continue');block.hidden=false;$('#journey-continue-title').textContent=state.item.module.title;$('#journey-continue-meta').textContent=`${state.item.pillar?.title||''} · ${state.item.chapter.title} · ${Math.round(Number(state.progress_ratio||0)*100)}% lu`;$('#journey-continue-link').href=`${state.url_path}${state.url_path.includes('?')?'&':'?'}reprendre=1`;}
  $('#journey-recent').innerHTML=recent.slice(0,6).map(state=>`<a href="${esc(state.url_path)}${state.url_path.includes('?')?'&':'?'}reprendre=1"><span>${esc(state.item.pillar?.title||'Académie')} · ${esc(state.item.chapter.title)}</span><strong>${esc(state.item.module.title)}</strong><div><progress max="100" value="${Math.round(Number(state.progress_ratio||0)*100)}"></progress><small>${Math.round(Number(state.progress_ratio||0)*100)}%</small></div></a>`).join('')||'<p>Commencez un module pour construire votre historique de lecture.</p>';
}
