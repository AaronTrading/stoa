import { supabase } from './supabase.js';
import { coachingQuestionnaire, visibleQuestions, validateCoachingStep } from './coaching-questionnaire.js';

const form=document.querySelector('#coaching-questionnaire-form'),content=document.querySelector('#coaching-step-content'),status=document.querySelector('#coaching-form-status'),back=document.querySelector('#coaching-back'),next=document.querySelector('#coaching-next'),label=document.querySelector('#coaching-step-label'),bar=document.querySelector('#coaching-progress-bar'),nav=document.querySelector('#coaching-step-nav');
const esc=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let user,questionnaire,stepIndex=0,answers={},saveTimer,saving=false,pendingSave=false,hasBooking=false;

const showStatus=(text,tone='')=>{status.textContent=text;status.dataset.tone=tone;};
const answerValue=(key)=>answers[key];
const selected=(question,value)=>Array.isArray(answerValue(question.key))&&answerValue(question.key).includes(value);
const field=(question)=>{
  const value=answerValue(question.key);
  const help=question.help?`<small>${esc(question.help)}</small>`:'';
  if(question.type==='choice'||question.type==='multiselect') return `<fieldset class="coaching-choice-field" data-question="${question.key}"><legend>${esc(question.label)}${question.required?' <b>*</b>':''}</legend><div class="coaching-choice-grid">${question.options.map(option=>`<label><input type="${question.type==='choice'?'radio':'checkbox'}" name="${question.key}" value="${esc(option)}" ${(question.type==='choice'?value===option:selected(question,option))?'checked':''}><span>${esc(option)}</span></label>`).join('')}</div>${help}</fieldset>`;
  if(question.type==='scale') return `<fieldset class="coaching-scale-field" data-question="${question.key}"><legend>${esc(question.label)}</legend><div><small>${esc(question.low)}</small><output>${value||Math.ceil((question.min+question.max)/2)}</output><small>${esc(question.high)}</small></div><input type="range" name="${question.key}" min="${question.min}" max="${question.max}" value="${value||Math.ceil((question.min+question.max)/2)}"></fieldset>`;
  if(question.type==='checkbox') return `<label class="coaching-confirm-field" data-question="${question.key}"><input type="checkbox" name="${question.key}" ${value===true?'checked':''}><span>${esc(question.label)}${question.required?' *':''}</span></label>`;
  if(question.type==='textarea') return `<label class="coaching-text-field" data-question="${question.key}"><span>${esc(question.label)}${question.required?' <b>*</b>':''}</span><textarea name="${question.key}" maxlength="${question.maxlength||1200}" placeholder="${esc(question.placeholder||'')}">${esc(value||'')}</textarea>${help}</label>`;
  return `<label class="coaching-text-field" data-question="${question.key}"><span>${esc(question.label)}${question.required?' <b>*</b>':''}</span><input type="${question.type||'text'}" name="${question.key}" value="${esc(value||'')}" placeholder="${esc(question.placeholder||'')}">${help}</label>`;
};

function render(){
  const step=coachingQuestionnaire[stepIndex],questions=visibleQuestions(step,answers);
  label.textContent=`Étape ${stepIndex+1} sur ${coachingQuestionnaire.length}`;bar.style.width=`${((stepIndex+1)/coachingQuestionnaire.length)*100}%`;
  nav.innerHTML=coachingQuestionnaire.map((item,index)=>`<button type="button" data-step="${index}" class="${index===stepIndex?'active':''}${index<stepIndex?' done':''}" ${index>Math.max(stepIndex,questionnaire.current_step||0)?'disabled':''}><span>${index<stepIndex?'✓':String(index+1).padStart(2,'0')}</span><b>${esc(item.title)}</b></button>`).join('');
  const booking=stepIndex===coachingQuestionnaire.length-1?`<aside class="coaching-booking-required ${hasBooking?'complete':''}"><span>${hasBooking?'✓':'12 bis'}</span><div><strong>${hasBooking?'Votre appel est réservé':'Réservez votre appel de 15 minutes'}</strong><p>${hasBooking?'Le créneau est bien associé à votre admission.':'Cette étape gratuite est obligatoire avant la transmission finale à votre coach.'}</p>${hasBooking?'':'<a class="button" href="/rendez-vous?etape=post&retour=/coaching-onboarding">Choisir un créneau →</a>'}</div></aside>`:'';
  content.innerHTML=`<header><span class="eyebrow">${esc(step.eyebrow)}</span><h2>${esc(step.title)}</h2><p>${esc(step.intro)}</p></header><div class="coaching-fields">${questions.map(field).join('')}</div>${booking}`;
  back.disabled=stepIndex===0;next.innerHTML=stepIndex===coachingQuestionnaire.length-1?'Transmettre à mon coach <span>✓</span>':'Continuer <span>→</span>';
  content.querySelectorAll('input[type=range]').forEach(input=>input.addEventListener('input',()=>{input.closest('fieldset').querySelector('output').textContent=input.value;}));
}

const collect=()=>{
  const step=coachingQuestionnaire[stepIndex];
  visibleQuestions(step,answers).forEach(question=>{
    const elements=[...form.querySelectorAll(`[name="${CSS.escape(question.key)}"]`)];if(!elements.length)return;
    if(question.type==='multiselect')answers[question.key]=elements.filter(item=>item.checked).map(item=>item.value);
    else if(question.type==='checkbox')answers[question.key]=elements[0].checked;
    else if(question.type==='scale')answers[question.key]=Number(elements[0].value);
    else answers[question.key]=elements.find(item=>item.checked)?.value??elements[0].value.trim();
  });
};

async function saveCurrent(){
  if(saving){pendingSave=true;return;}collect();saving=true;showStatus('Enregistrement…');
  const step=coachingQuestionnaire[stepIndex],questions=visibleQuestions(step,answers),rows=questions.filter(question=>answers[question.key]!==undefined).map(question=>({questionnaire_id:questionnaire.id,client_id:user.id,section_key:step.key,question_key:question.key,answer:answers[question.key],answered_at:new Date().toISOString()}));
  const response=rows.length?await supabase.from('coaching_questionnaire_responses').upsert(rows,{onConflict:'questionnaire_id,question_key'}):{error:null};
  const progress=await supabase.from('coaching_questionnaires').update({current_step:Math.max(questionnaire.current_step||0,stepIndex),updated_at:new Date().toISOString()}).eq('id',questionnaire.id);
  saving=false;if(response.error||progress.error)showStatus('Sauvegarde impossible. Vos réponses restent affichées.', 'error');else{questionnaire.current_step=Math.max(questionnaire.current_step||0,stepIndex);showStatus('Réponses enregistrées.', 'success');}
  if(pendingSave){pendingSave=false;saveCurrent();}
}
const queueSave=()=>{clearTimeout(saveTimer);showStatus('Modifications en attente…');saveTimer=setTimeout(saveCurrent,450);};

form.addEventListener('input',event=>{collect();if(event.target.type==='radio'||event.target.type==='checkbox'){render();}queueSave();});
form.addEventListener('submit',async event=>{event.preventDefault();collect();const missing=validateCoachingStep(coachingQuestionnaire[stepIndex],answers);if(missing.length){showStatus(`Répondez aux ${missing.length} question${missing.length>1?'s':''} obligatoire${missing.length>1?'s':''}.`,'error');content.querySelector(`[data-question="${missing[0].key}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});return;}await saveCurrent();if(stepIndex<coachingQuestionnaire.length-1){stepIndex++;render();scrollTo({top:0,behavior:'smooth'});return;}
  if(!hasBooking){showStatus('Réservez votre appel gratuit avant de transmettre le questionnaire.','error');content.querySelector('.coaching-booking-required')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
  next.disabled=true;showStatus('Transmission sécurisée à votre coach…');
  const summary={main_goal:answers.main_goal||'',main_goal_category:answers.main_goal_category||'',time_horizon:answers.time_horizon||'',weekly_time:answers.weekly_time||'',domains:{nourrir:answers.nutrition_change||'',corps:answers.activity_types||[],sommeil:answers.sleep_change||'',proteger:answers.home_exposures||[],construire:answers.organization_issues||[],se_construire:answers.long_term_vision||''}};
  const priorities=[answers.priority_1,answers.priority_2,answers.priority_3].filter(Boolean),constraints=[...(answers.anticipated_difficulties||[]),answers.food_constraints,answers.professional_constraints_details].filter(Boolean),preferences={coach_style:answers.coach_style||[],contact_frequency:answers.contact_frequency||'',communication:answers.communication||[],feedback_style:answers.feedback_style||''};
  const {error}=await supabase.rpc('complete_coaching_onboarding',{p_questionnaire_id:questionnaire.id,p_summary:summary,p_priorities:priorities,p_constraints:constraints,p_preferences:preferences});
  if(error){next.disabled=false;showStatus(`Transmission impossible : ${error.message}`,'error');return;}location.assign('/coaching?bienvenue=1');
});
back.addEventListener('click',async()=>{if(stepIndex===0)return;await saveCurrent();stepIndex--;render();});
nav.addEventListener('click',async event=>{const button=event.target.closest('[data-step]');if(!button||button.disabled)return;await saveCurrent();stepIndex=Number(button.dataset.step);render();});

async function initialize(){
  user=(await supabase.auth.getSession()).data.session?.user;if(!user){location.replace('/#connexion');return;}
  const {data:access,error:accessError}=await supabase.rpc('get_my_coaching_access').maybeSingle();
  if(accessError||!access){content.innerHTML='<div class="coaching-access-empty"><span>◇</span><h2>Accès Coaching requis</h2><p>Ce questionnaire est réservé aux clients du Coaching Privé STOA.</p><a class="button dark" href="/decouvrir-coaching">Découvrir le Coaching</a></div>';form.querySelector('footer').hidden=true;return;}
  const {data:existing}=await supabase.from('coaching_questionnaires').select('*').eq('client_id',user.id).eq('kind','admission').in('status',['draft','submitted']).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(existing?.status==='submitted'){location.replace('/coaching');return;}
  if(existing)questionnaire=existing;else{const created=await supabase.from('coaching_questionnaires').insert({client_id:user.id,kind:'admission'}).select().single();if(created.error){showStatus(created.error.message,'error');return;}questionnaire=created.data;}
  const [{data:rows},{data:booking}]=await Promise.all([supabase.from('coaching_questionnaire_responses').select('question_key,answer').eq('questionnaire_id',questionnaire.id),supabase.from('coaching_call_bookings').select('id').eq('user_id',user.id).eq('status','confirmed').limit(1).maybeSingle()]);hasBooking=Boolean(booking);(rows||[]).forEach(row=>{answers[row.question_key]=row.answer;});stepIndex=Math.min(11,questionnaire.current_step||access.onboarding_step||0);render();
}
initialize();
