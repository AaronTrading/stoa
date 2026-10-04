import { supabase } from './supabase.js';

const $=selector=>document.querySelector(selector),esc=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const dateLabel=value=>value?new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short'}).format(new Date(value)):'—';
const timeLabel=value=>value?new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value)):'À planifier';
let user,access,data={},actionView='tasks',channel;
const alert=(message,tone='')=>{const node=$('#coaching-alert');node.hidden=!message;node.textContent=message;node.dataset.tone=tone;};

function renderActions(){
  const rows=actionView==='tasks'?data.tasks:data.goals;
  $('#coaching-actions-list').innerHTML=rows.length?rows.map(row=>`<article class="coaching-list-row ${row.status==='completed'?'completed':''}"><button type="button" data-complete="${row.id}" data-kind="${actionView}" aria-label="${row.status==='completed'?'Rouvrir':'Terminer'}">${row.status==='completed'?'✓':''}</button><div><strong>${esc(row.title)}</strong><p>${esc(row.description||'')}</p><small>${row.target_date||row.due_at?`Échéance · ${dateLabel(row.target_date||row.due_at)}`:'Sans échéance'}${row.progress!=null?` · ${row.progress} %`:''}</small></div></article>`).join(''):'<p class="coaching-empty">Aucune action pour le moment.</p>';
}
function renderHabits(){
  const completed=new Set(data.logs.map(row=>row.habit_id));
  $('#coaching-habits-list').innerHTML=data.habits.length?data.habits.map(row=>`<article class="coaching-list-row habit ${completed.has(row.id)?'completed':''}"><button type="button" data-habit="${row.id}" aria-pressed="${completed.has(row.id)}">${completed.has(row.id)?'✓':''}</button><div><strong>${esc(row.title)}</strong><p>${esc(row.description||'Rituel quotidien')}</p></div><span>${completed.has(row.id)?'Fait':'À faire'}</span></article>`).join(''):'<p class="coaching-empty">Votre coach ajoutera ici les habitudes à suivre.</p>';
  $('#metric-habits').textContent=`${completed.size}/${data.habits.length}`;
}
function assignmentUrl(row){const chapter=row.modules?.chapters;return chapter?`/module?chapitre=${Number(chapter.order_index)+1}&module=${Number(row.modules.order_index)+1}`:'/academie';}
function renderAssignments(){
  $('#coaching-assignments-list').innerHTML=data.assignments.length?data.assignments.map(row=>`<article><span>${row.status==='completed'?'TERMINÉ':'RECOMMANDÉ'}</span><h3>${esc(row.modules?.title||'Leçon STOA')}</h3><p>${esc(row.note||row.modules?.description||'')}</p><footer><a href="${assignmentUrl(row)}">Ouvrir la leçon →</a>${row.status!=='completed'?`<button type="button" data-assignment="${row.id}">Marquer comme terminée</button>`:''}</footer></article>`).join(''):'<p class="coaching-empty">Aucune leçon assignée pour le moment.</p>';
}
function renderMessages(){
  const list=$('#coaching-message-list');list.innerHTML=data.messages.length?data.messages.map(row=>`<article class="${row.sender_id===user.id?'mine':'coach'}"><small>${row.sender_id===user.id?'Vous':'Votre coach'} · ${timeLabel(row.created_at)}</small><p>${esc(row.content)}</p></article>`).join(''):'<p class="coaching-empty">Votre fil privé commence ici.</p>';list.scrollTop=list.scrollHeight;
}
function render(){
  const incompleteTasks=data.tasks.filter(row=>row.status!=='completed'),activeGoals=data.goals.filter(row=>row.status==='active'),completedHabits=new Set(data.logs.map(row=>row.habit_id)).size,total=Math.max(1,incompleteTasks.length+data.habits.length),done=data.tasks.filter(row=>row.status==='completed').length+completedHabits,progress=Math.min(100,Math.round(done/Math.max(1,total+done)*100));
  $('#metric-goals').textContent=activeGoals.length;$('#metric-tasks').textContent=incompleteTasks.length;$('#coaching-week-progress').textContent=`${progress} %`;$('#coaching-week-progress-bar').style.width=`${progress}%`;
  const priority=incompleteTasks[0]||activeGoals[0];$('#coaching-priority').textContent=priority?.title||'Votre semaine est à jour';$('#coaching-priority-copy').textContent=priority?.description||'Profitez de cet espace pour consolider vos acquis.';
  const appointment=data.appointments[0];$('#metric-appointment').textContent=appointment?dateLabel(appointment.starts_at):'—';$('#metric-appointment-copy').textContent=appointment?timeLabel(appointment.starts_at):'À planifier';
  const plan=data.plans[0];$('#coaching-plan').innerHTML=plan?`<h2>${esc(plan.title)}</h2><p>${esc(plan.content)}</p>${plan.starts_on||plan.ends_on?`<small>${dateLabel(plan.starts_on)} — ${dateLabel(plan.ends_on)}</small>`:''}`:'<h2>En préparation</h2><p>Votre plan apparaîtra dès sa publication par votre coach.</p>';
  $('#coaching-reviews-list').innerHTML=data.reviews.length?data.reviews.map(row=>`<article><strong>${esc(row.title)}</strong><p>${esc(row.content)}</p><small>${dateLabel(row.created_at)}</small></article>`).join(''):'<p class="coaching-empty">Aucun bilan publié.</p>';
  renderActions();renderHabits();renderAssignments();renderMessages();
}

async function load(){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),tables={
    tasks:supabase.from('coaching_tasks').select('*').eq('client_id',user.id).neq('status','cancelled').order('due_at',{ascending:true,nullsFirst:false}),
    goals:supabase.from('coaching_goals').select('*').eq('client_id',user.id).neq('status','cancelled').order('priority',{ascending:false}),
    habits:supabase.from('coaching_habits').select('*').eq('client_id',user.id).eq('active',true).order('created_at'),
    logs:supabase.from('coaching_habit_logs').select('*').eq('client_id',user.id).eq('completed_on',today),
    assignments:supabase.from('coaching_assignments').select('*,modules(id,title,description,order_index,chapters(title,order_index))').eq('client_id',user.id).order('created_at',{ascending:false}),
    plans:supabase.from('coaching_plans').select('*').eq('client_id',user.id).eq('status','active').eq('visible_to_client',true).order('created_at',{ascending:false}).limit(1),
    reviews:supabase.from('coaching_reviews').select('*').eq('client_id',user.id).eq('visible_to_client',true).order('created_at',{ascending:false}).limit(4),
    appointments:supabase.from('coaching_appointments').select('*').eq('client_id',user.id).eq('status','planned').gte('starts_at',new Date().toISOString()).order('starts_at').limit(1),
    messages:supabase.from('coaching_messages').select('*').eq('client_id',user.id).order('created_at',{ascending:false}).limit(100)
  };
  const entries=await Promise.all(Object.entries(tables).map(async([key,promise])=>{const result=await promise;return[key,key==='messages'?[...(result.data||[])].reverse():result.data||[],result.error];})),failures=entries.filter(([, ,error])=>error).map(([key])=>key);data=Object.fromEntries(entries.map(([key,value])=>[key,value]));render();if(failures.length)alert('Certaines données ne peuvent pas être chargées. Réessayez dans un instant.','error');
}
async function updateCompletion(kind,id){
  const table=kind==='tasks'?'coaching_tasks':'coaching_goals',rows=data[kind],row=rows.find(item=>item.id===id),completed=row.status==='completed';
  const payload=kind==='tasks'?{status:completed?'todo':'completed',completed_at:completed?null:new Date().toISOString()}:{status:completed?'active':'completed',progress:completed?Math.min(row.progress,99):100};
  const {error}=await supabase.from(table).update(payload).eq('id',id);if(error)return alert(error.message,'error');Object.assign(row,payload);render();
}
document.addEventListener('click',async event=>{
  const tab=event.target.closest('[data-action-view]');if(tab){actionView=tab.dataset.actionView;document.querySelectorAll('[data-action-view]').forEach(node=>node.classList.toggle('active',node===tab));renderActions();return;}
  const complete=event.target.closest('[data-complete]');if(complete)return updateCompletion(complete.dataset.kind,complete.dataset.complete);
  const habit=event.target.closest('[data-habit]');if(habit){const existing=data.logs.find(row=>row.habit_id===habit.dataset.habit);const result=existing?await supabase.from('coaching_habit_logs').delete().eq('id',existing.id):await supabase.from('coaching_habit_logs').insert({habit_id:habit.dataset.habit,client_id:user.id}).select().single();if(result.error)return alert(result.error.message,'error');if(existing)data.logs=data.logs.filter(row=>row.id!==existing.id);else data.logs.push(result.data);renderHabits();render();return;}
  const assignment=event.target.closest('[data-assignment]');if(assignment){const {error}=await supabase.from('coaching_assignments').update({status:'completed'}).eq('id',assignment.dataset.assignment);if(error)return alert(error.message,'error');data.assignments.find(row=>row.id===assignment.dataset.assignment).status='completed';renderAssignments();}
});

$('#coaching-message-form').addEventListener('submit',async event=>{event.preventDefault();const field=event.currentTarget.elements.content,content=field.value.trim();if(!content)return;field.disabled=true;const {error}=await supabase.from('coaching_messages').insert({client_id:user.id,sender_id:user.id,content});field.disabled=false;if(error)return alert(error.message,'error');field.value='';});
$('#coaching-checkin-form').addEventListener('submit',async event=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.currentTarget)),{error}=await supabase.rpc('submit_my_coaching_checkin',{p_energy:Number(values.energy),p_sleep:Number(values.sleep),p_nutrition:Number(values.nutrition),p_activity:Number(values.activity),p_main_win:String(values.main_win||'').trim(),p_main_difficulty:String(values.main_difficulty||'').trim(),p_next_focus:String(values.next_focus||'').trim(),p_help_needed:String(values.help_needed||'').trim()});$('#checkin-status').textContent=error?'Le bilan n’a pas pu être transmis. Réessayez.':'Bilan transmis à votre coach.';if(!error)event.currentTarget.reset();});

async function initialize(){
  user=(await supabase.auth.getSession()).data.session?.user;if(!user){location.replace('/#connexion');return;}
  const {data:accessRows,error}=await supabase.rpc('get_my_coaching_access');access=accessRows?.[0];if(error||!access){location.replace('/#offres');return;}if(!access.onboarding_completed){location.replace('/coaching-onboarding');return;}
  $('#coaching-coach-name').textContent=access.coach_name||'Équipe STOA';if(access.coach_avatar_url){$('#coaching-coach-avatar').style.backgroundImage=`url("${access.coach_avatar_url.replaceAll('"','%22')}")`;$('#coaching-coach-avatar').textContent='';}
  $('#coaching-today').textContent=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
  $('#coaching-scores').innerHTML=['energy|Énergie','sleep|Sommeil','nutrition|Alimentation','activity|Mouvement'].map(item=>{const [key,label]=item.split('|');return `<label><span>${label}</span><input name="${key}" type="range" min="1" max="10" value="5"><output>5/10</output></label>`;}).join('');$('#coaching-scores').addEventListener('input',event=>{event.target.closest('label').querySelector('output').textContent=`${event.target.value}/10`;});
  await load();channel=supabase.channel(`coaching:${user.id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'coaching_messages',filter:`client_id=eq.${user.id}`},payload=>{if(!data.messages.some(row=>row.id===payload.new.id)){data.messages.push(payload.new);renderMessages();}}).subscribe();
  await supabase.from('coaching_messages').update({read_at:new Date().toISOString()}).eq('client_id',user.id).neq('sender_id',user.id).is('read_at',null);
}
addEventListener('pagehide',()=>{if(channel)supabase.removeChannel(channel);});initialize();
