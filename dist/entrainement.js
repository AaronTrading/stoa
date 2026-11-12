import {supabase} from './supabase.js';
import {loadCatalog} from './member-data.js';

const overview=document.querySelector('#training-overview');
const sessionPanel=document.querySelector('#training-session');
const questionCard=document.querySelector('#training-question-card');
const mapSection=document.querySelector('#training-map-section');
const lowerGrid=document.querySelector('#training-lower-grid');
const esc=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const normalize=(value='')=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr-FR').replace(/[^a-z0-9\s-]/g,' ');
const clip=(value,length=230)=>{const text=String(value||'').replace(/\s+/g,' ').trim();return text.length>length?`${text.slice(0,length).replace(/\s+\S*$/,'')}…`:text;};
const hash=value=>{let result=2166136261;for(const char of String(value)){result^=char.charCodeAt(0);result=Math.imul(result,16777619)}return result>>>0;};
const seeded=(items,seed)=>[...items].sort((a,b)=>(hash(`${seed}:${a.key||a}`)%100000)-(hash(`${seed}:${b.key||b}`)%100000));
const stopWords=new Set('avec dans pour sans sous entre cette celui celle votre vous nous mais donc plus moins très tout tous toute comme quand puis peut sont être avoir faire fait dont afin vers après avant chaque même aussi encore chez aux des les une que qui quoi leur leurs ses son sur par pas est et ou un du de la le au en ce se'.split(' '));
const typeLabels={choice:'CHOIX MULTIPLE',true_false:'VRAI OU FAUX',scenario:'MISE EN SITUATION',ordering:'REMETTRE DANS L’ORDRE',trap:'RAISONNEMENT TROMPEUR',open:'AVEC VOS MOTS'};
const stateLabels={undiscovered:'À découvrir',fragile:'Fragile',progressing:'En progression',mastered:'Maîtrisé'};
const SESSION_SIZE=7;

let user,catalog,states=[],reviews=[],activities=[],candidates=[],queue=[],index=0,currentOrder=[],questionStartedAt=0,sessionResults=[],retryCounts=new Map();
const reviewMap=()=>new Map(reviews.map(row=>[row.question_key,row]));
const moduleMap=()=>new Map(catalog.lessons.map(lesson=>[lesson.id,lesson]));

function parisDate(offset=0){
  const date=new Date(Date.now()+offset*86400000),parts=new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date),part=type=>parts.find(item=>item.type===type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
function stripContent(html=''){
  const template=document.createElement('template');template.innerHTML=String(html);
  template.content.querySelectorAll('script,style,figure,table').forEach(node=>node.remove());
  const paragraphs=[...template.content.querySelectorAll('p,blockquote')].map(node=>clip(node.textContent,420)).filter(text=>text.length>=55);
  if(!paragraphs.length){const plain=template.content.textContent.replace(/\s+/g,' ').trim();plain.split(/(?<=[.!?])\s+/).filter(text=>text.length>=55).slice(0,4).forEach(text=>paragraphs.push(clip(text,420)));}
  const lists=[...template.content.querySelectorAll('ol,ul')].map(list=>[...list.children].filter(item=>item.tagName==='LI').map(item=>clip(item.textContent,180)).filter(Boolean)).filter(items=>items.length>=3);
  return {paragraphs:paragraphs.slice(0,4),lists:lists.slice(0,2)};
}
function keywords(text){
  const counts=new Map();normalize(text).split(/\s+/).filter(word=>word.length>4&&!stopWords.has(word)).forEach(word=>counts.set(word,(counts.get(word)||0)+1));
  return [...counts].sort((a,b)=>b[1]-a[1]||b[0].length-a[0].length).slice(0,10).map(([word])=>word);
}
function mutateStatement(statement){
  const replacements=[[/\bprivilégiez?\b/i,'évitez'],[/\bévitez?\b/i,'privilégiez'],[/\bimportant(?:e)?\b/i,'sans importance'],[/\btoujours\b/i,'jamais'],[/\baugmente\b/i,'réduit'],[/\bréduit\b/i,'augmente']];
  for(const [pattern,replacement] of replacements)if(pattern.test(statement))return statement.replace(pattern,replacement);
  return null;
}
function choiceOptions(correct,pool,seed){
  const distractors=seeded(pool.filter(value=>value!==correct&&normalize(value)!==normalize(correct)),seed).slice(0,3);
  while(distractors.length<3)distractors.push(['Tout appliquer d’un coup, sans observer le contexte.','Se fier uniquement à une formule mémorisée.','Ignorer le passage et choisir au hasard.'][distractors.length]);
  const options=seeded([correct,...distractors],`${seed}:options`);return {options,correctIndex:options.indexOf(correct)};
}
function buildCandidates(sections){
  const lessons=moduleMap(),sources=sections.map(section=>{const lesson=lessons.get(section.module_id),content=stripContent(section.content),passage=content.paragraphs[0]||content.lists[0]?.join(' ; ');return {...section,lesson,...content,passage};}).filter(item=>item.lesson&&item.passage);
  const pool=sources.flatMap(item=>item.paragraphs.slice(0,2).map(text=>clip(text,175)));
  const result=[];
  for(const source of sources){
    const explanation=clip(source.passage,380),short=clip(source.passage,175),base=`${source.module_id}:${source.id}`,sourceUrl=`${source.lesson.url}#lesson-${source.id}`,sourceLabel=`${source.lesson.title} · ${source.title}`;
    const add=(type,data)=>result.push({key:`${base}:${type}:0`,type,moduleId:source.module_id,subchapterId:source.id,lesson:source.lesson,sourceUrl,sourceLabel,explanation,...data});
    const choice=choiceOptions(short,pool,`${base}:choice`);
    add('choice',{prompt:`Quel passage correspond le mieux à la leçon « ${source.lesson.title} » ?`,...choice});
    const altered=hash(base)%2?mutateStatement(short):null,statement=altered||short;
    add('true_false',{prompt:`Vrai ou faux ? « ${statement} »`,options:['Vrai','Faux'],correctIndex:altered?1:0});
    const scenario=choiceOptions(short,pool,`${base}:scenario`);
    add('scenario',{prompt:`Vous voulez mettre en pratique « ${source.lesson.title} » aujourd’hui. Quel repère doit guider votre choix ?`,...scenario});
    add('trap',{prompt:'Quel raisonnement déforme le plus le message de ce passage ?',options:['En faire une règle absolue, identique pour tout le monde et sans tenir compte du contexte.','Revenir au passage avant de décider.','Observer le résultat puis ajuster progressivement.','Relier le conseil à sa situation réelle.'],correctIndex:0});
    add('open',{prompt:`Expliquez avec vos propres mots l’idée centrale de « ${source.title} ».`,keywords:keywords(source.passage)});
    if(source.lists[0]?.length>=3){const order=source.lists[0].slice(0,5);add('ordering',{prompt:'Replacez ces étapes dans l’ordre présenté dans la leçon.',correctOrder:order,options:seeded(order,`${base}:order`)})}
  }
  return result;
}

function masteryState(score,hasReview=true){if(!hasReview)return'undiscovered';if(score<30)return'fragile';if(score<70)return'progressing';return'mastered';}
function moduleMastery(moduleId){const rows=reviews.filter(row=>row.module_id===moduleId);return rows.length?{score:Math.round(rows.reduce((sum,row)=>sum+row.mastery_score,0)/rows.length),count:rows.length}:{score:0,count:0};}
function streakCount(){
  const byDate=new Map(activities.map(row=>[row.activity_date,row])),today=byDate.get(parisDate()),start=today&&(today.answered_count>=5||today.is_rest_day)?0:-1;let count=0;
  for(let day=start;day>-100;day--){const row=byDate.get(parisDate(day));if(row&&(row.answered_count>=5||row.is_rest_day))count++;else break}return count;
}
function restEligible(){const yesterday=parisDate(-1),previous=activities.find(row=>row.activity_date===parisDate(-2));return !activities.some(row=>row.activity_date===yesterday)&&Number(previous?.answered_count||0)>=5&&!activities.some(row=>row.is_rest_day&&row.activity_date>=parisDate(-7));}
function prepareQueue(){
  const byKey=reviewMap(),now=Date.now(),today=parisDate();
  const available=candidates.filter(question=>states.some(state=>state.module_id===question.moduleId));
  const due=available.filter(question=>{const review=byKey.get(question.key);return review&&new Date(review.due_at).getTime()<=now}).sort((a,b)=>new Date(byKey.get(a.key).due_at)-new Date(byKey.get(b.key).due_at));
  const unseen=seeded(available.filter(question=>!byKey.has(question.key)),today);
  const maintenance=available.filter(question=>byKey.has(question.key)&&!due.includes(question)).sort((a,b)=>new Date(byKey.get(a.key).due_at)-new Date(byKey.get(b.key).due_at));
  const unique=new Map([...due,...unseen,...maintenance].map(question=>[question.key,question]));
  const ordered=[...unique.values()],types=new Set(),balanced=[];
  for(const question of ordered)if(!types.has(question.type)){balanced.push(question);types.add(question.type)}
  for(const question of ordered)if(!balanced.includes(question))balanced.push(question);
  queue=balanced.slice(0,SESSION_SIZE);
}

function renderOverview(){
  const dueCount=reviews.filter(row=>new Date(row.due_at)<=new Date()).length,streak=streakCount(),today=activities.find(row=>row.activity_date===parisDate()),todayCount=Number(today?.answered_count||0),mastered=states.filter(state=>moduleMastery(state.module_id).score>=70).length;
  document.querySelector('#training-today-count').textContent=Math.min(todayCount,5);document.querySelector('#training-goal-bar').style.width=`${Math.min(100,todayCount/5*100)}%`;document.querySelector('#training-goal-copy').textContent=todayCount>=5?'Objectif quotidien atteint.':'Cinq minutes suffisent.';
  overview.innerHTML=`<div class="training-stat-grid"><article><span>SÉRIE ACTUELLE</span><strong>${streak}<small> jour${streak>1?'s':''}</small></strong><p>Un jour de respiration protège votre rythme.</p></article><article><span>À REVOIR</span><strong>${dueCount}<small> notion${dueCount>1?'s':''}</small></strong><p>Les plus fragiles passent en premier.</p></article><article><span>MAÎTRISÉ</span><strong>${mastered}<small> leçon${mastered>1?'s':''}</small></strong><p>Une maîtrise vivante, entretenue dans le temps.</p></article></div><article class="training-start-card"><div><span class="eyebrow">SESSION DU JOUR</span><h2>${queue.length?`${queue.length} questions · environ 5 minutes`:'Votre session se construit avec vos lectures.'}</h2><p>${queue.length?'Choix, situations concrètes, classement et explication avec vos mots.':'Ouvrez d’abord une leçon de l’Académie. Elle rejoindra automatiquement vos prochaines sessions.'}</p></div><div>${restEligible()?'<button class="training-rest-button" type="button" id="training-rest-day">Utiliser mon jour de respiration</button>':''}<button class="button dark" type="button" id="training-start" ${queue.length?'':'disabled'}>${queue.length?'Commencer ma session':'Découvrir une leçon'} <span>→</span></button></div></article>`;
  overview.querySelector('#training-start')?.addEventListener('click',()=>queue.length?startSession():location.assign('/academie'));
  overview.querySelector('#training-rest-day')?.addEventListener('click',claimRestDay);
  renderKnowledgeMap();renderWeek();renderAchievements();mapSection.hidden=false;lowerGrid.hidden=false;
}
function renderKnowledgeMap(){
  const lessons=moduleMap(),rows=states.map(state=>{const lesson=lessons.get(state.module_id),mastery=moduleMastery(state.module_id);return lesson?{lesson,...mastery,state:masteryState(mastery.score,mastery.count>0)}:null}).filter(Boolean).sort((a,b)=>b.score-a.score);
  document.querySelector('#training-module-map').innerHTML=rows.length?rows.map(row=>`<a href="${row.lesson.url}" class="training-module-row"><i class="${row.state}"></i><span><strong>${esc(row.lesson.title)}</strong><small>${esc(row.lesson.chapter.title)}</small></span><div><b>${row.count?`${row.score}%`:'—'}</b><small>${stateLabels[row.state]}</small></div><em>→</em></a>`).join(''):'<p class="training-empty">Votre carte apparaîtra après votre première lecture.</p>';
}
function renderWeek(){
  const days=[-6,-5,-4,-3,-2,-1,0],byDate=new Map(activities.map(row=>[row.activity_date,row])),labels=['D','L','M','M','J','V','S'],week=days.map(day=>{const date=new Date(Date.now()+day*86400000),row=byDate.get(parisDate(day));return {label:labels[date.getDay()],count:Number(row?.answered_count||0),rest:Boolean(row?.is_rest_day),seconds:Number(row?.duration_seconds||0)}}),max=Math.max(5,...week.map(day=>day.count)),answers=week.reduce((sum,day)=>sum+day.count,0),seconds=week.reduce((sum,day)=>sum+day.seconds,0),correct=activities.filter(row=>row.activity_date>=parisDate(-6)).reduce((sum,row)=>sum+Number(row.correct_count||0),0);
  document.querySelector('#training-week-minutes').textContent=`${Math.max(0,Math.round(seconds/60))} min`;
  document.querySelector('#training-week-bars').innerHTML=week.map(day=>`<div><span><i style="height:${day.rest?28:Math.max(5,Math.round(day.count/max*100))}%" class="${day.rest?'rest':''}"></i></span><small>${day.label}</small></div>`).join('');
  document.querySelector('#training-week-summary').innerHTML=`<span><strong>${answers}</strong> réponses</span><span><strong>${answers?Math.round(correct/answers*100):0}%</strong> consolidées</span><span><strong>${streakCount()}</strong> jours de série</span>`;
}
function renderAchievements(){
  const attempts=reviews.reduce((sum,row)=>sum+Number(row.attempts||0),0),mastered=states.some(state=>moduleMastery(state.module_id).score>=70),items=[['Première empreinte','Terminer une première question',attempts>=1],['Rythme installé','Atteindre une série de 3 jours',streakCount()>=3],['Carte vivante','Travailler 20 notions',reviews.length>=20],['Cent réponses','Répondre 100 fois',attempts>=100],['Fondation solide','Maîtriser une leçon',mastered]];
  document.querySelector('#training-achievement-list').innerHTML=items.map(([title,copy,unlocked])=>`<div class="${unlocked?'unlocked':'locked'}"><i>${unlocked?'✓':'○'}</i><span><strong>${title}</strong><small>${copy}</small></span></div>`).join('');
}

function startSession(){index=0;currentOrder=[];sessionResults=[];retryCounts=new Map();document.body.classList.add('training-session-active');overview.hidden=true;mapSection.hidden=true;lowerGrid.hidden=true;sessionPanel.hidden=false;renderQuestion(true);scrollTo({top:0,behavior:'instant'});}
function optionMarkup(question){
  if(question.type==='ordering')return `<div class="training-order"><div class="training-order-selected" id="training-order-selected">${currentOrder.length?currentOrder.map((value,i)=>`<button type="button" data-order-value="${esc(value)}"><b>${i+1}</b>${esc(value)}<span>×</span></button>`).join(''):'<p>Sélectionnez les étapes dans leur ordre.</p>'}</div><div class="training-order-pool">${question.options.filter(value=>!currentOrder.includes(value)).map(value=>`<button type="button" data-order-value="${esc(value)}">${esc(value)} <span>+</span></button>`).join('')}</div></div>`;
  if(question.type==='open')return '<label class="training-open-answer"><span>Votre réponse</span><textarea id="training-open-value" rows="5" placeholder="Expliquez l’idée simplement, sans chercher la formulation exacte."></textarea></label>';
  return `<div class="training-options">${question.options.map((option,i)=>`<label><input type="radio" name="training-answer" value="${i}"><span><i>${String.fromCharCode(65+i)}</i>${esc(option)}</span></label>`).join('')}</div>`;
}
function renderQuestion(resetTimer=false){
  const question=queue[index];if(!question)return finishSession();if(resetTimer)questionStartedAt=Date.now();
  document.querySelector('#training-session-position').textContent=`Question ${index+1} sur ${queue.length}`;document.querySelector('#training-session-bar').style.width=`${Math.round(index/queue.length*100)}%`;
  questionCard.innerHTML=`<span class="training-question-type">${typeLabels[question.type]}</span><h2>${esc(question.prompt)}</h2><p class="training-question-origin">${esc(question.sourceLabel)}</p>${optionMarkup(question)}<p class="training-answer-status" role="status"></p><button class="button dark training-validate" type="button" id="training-validate">Valider ma réponse <span>→</span></button>`;
}
function answerIsCorrect(question){
  if(question.type==='ordering')return currentOrder.length===question.correctOrder.length&&currentOrder.every((value,i)=>value===question.correctOrder[i]);
  if(question.type==='open'){const answer=normalize(document.querySelector('#training-open-value')?.value),matches=question.keywords.filter(word=>answer.includes(word)).length;return answer.trim().length>=20&&matches>=Math.min(2,Math.max(1,question.keywords.length));}
  const selected=questionCard.querySelector('input[name="training-answer"]:checked');return selected?Number(selected.value)===question.correctIndex:null;
}
function showCorrection(){
  const question=queue[index],correct=answerIsCorrect(question),status=questionCard.querySelector('.training-answer-status');
  if(correct===null||question.type==='ordering'&&!currentOrder.length||question.type==='open'&&!document.querySelector('#training-open-value')?.value.trim()){status.textContent='Choisissez ou écrivez une réponse avant de continuer.';status.dataset.tone='error';return;}
  questionCard.querySelectorAll('input,textarea,.training-order button').forEach(node=>node.disabled=true);document.querySelector('#training-validate').remove();
  const verdict=correct?(question.type==='open'?'L’idée centrale est retrouvée.':'Bonne réponse.'):'Cette notion mérite encore un passage.';
  questionCard.insertAdjacentHTML('beforeend',`<section class="training-correction ${correct?'correct':'incorrect'}"><span>${correct?'✓':'↺'} ${verdict}</span><p>${esc(question.explanation)}</p><a href="${question.sourceUrl}">Revoir le passage dans la leçon <b>→</b></a><div class="training-confidence">${correct?'<button type="button" data-training-result="hesitant">J’hésitais encore</button><button class="button dark" type="button" data-training-result="mastered">Je maîtrise <span>→</span></button>':'<button class="button dark" type="button" data-training-result="incorrect">Revoir bientôt <span>→</span></button>'}</div><small data-training-save-status></small></section>`);
}
async function recordAndContinue(result,button){
  const question=queue[index],duration=Math.round((Date.now()-questionStartedAt)/1000);button.disabled=true;const status=questionCard.querySelector('[data-training-save-status]');status.textContent='Enregistrement…';
  const {data,error}=await supabase.rpc('record_training_answer',{p_module_id:question.moduleId,p_subchapter_id:question.subchapterId,p_question_key:question.key,p_question_type:question.type,p_result:result,p_duration_seconds:duration});
  if(error){button.disabled=false;status.textContent='Impossible d’enregistrer pour le moment. Réessayez.';status.dataset.tone='error';return;}
  const saved=Array.isArray(data)?data[0]:data;if(saved){const existing=reviews.findIndex(row=>row.question_key===saved.question_key);existing>=0?reviews.splice(existing,1,saved):reviews.push(saved)}
  sessionResults.push(result);if(result==='incorrect'&&(retryCounts.get(question.key)||0)<1&&queue.length<10){retryCounts.set(question.key,1);queue.push(question)}
  index++;currentOrder=[];renderQuestion(true);
}
function finishSession(){
  const strengthened=sessionResults.filter(result=>result!=='incorrect').length,reviewsSoon=sessionResults.length-strengthened;document.querySelector('#training-session-bar').style.width='100%';
  questionCard.innerHTML=`<div class="training-finish-mark">✓</div><span class="eyebrow">SESSION TERMINÉE</span><h2>Les notions commencent à s’ancrer.</h2><p>Vous avez consolidé <strong>${strengthened}</strong> notion${strengthened>1?'s':''}.${reviewsSoon?` ${reviewsSoon} reviendra${reviewsSoon>1?'ont':''} rapidement.`:''}</p><div class="training-finish-actions"><button class="button dark" type="button" id="training-finish-overview">Voir ma progression <span>→</span></button><a href="/academie">Retour aux leçons</a></div>`;
  document.querySelector('#training-finish-overview').addEventListener('click',async()=>{document.body.classList.remove('training-session-active');sessionPanel.hidden=true;overview.hidden=false;overview.innerHTML='<div class="training-loading"><i></i><i></i><i></i></div>';await loadTraining();scrollTo({top:0,behavior:'smooth'})});
}
async function claimRestDay(){
  const button=document.querySelector('#training-rest-day');button.disabled=true;button.textContent='Enregistrement…';const {error}=await supabase.rpc('claim_training_rest_day',{p_date:parisDate(-1)});if(error){button.disabled=false;button.textContent='Jour indisponible';return}await loadTraining();
}

questionCard.addEventListener('click',event=>{
  const orderButton=event.target.closest('[data-order-value]');if(orderButton&&!orderButton.disabled){const value=orderButton.dataset.orderValue,current=currentOrder.indexOf(value);if(current>=0)currentOrder.splice(current,1);else currentOrder.push(value);renderQuestion(false);return;}
  if(event.target.closest('#training-validate')){showCorrection();return;}
  const resultButton=event.target.closest('[data-training-result]');if(resultButton)recordAndContinue(resultButton.dataset.trainingResult,resultButton);
});
document.querySelector('#training-session-close').addEventListener('click',()=>{document.body.classList.remove('training-session-active');sessionPanel.hidden=true;overview.hidden=false;mapSection.hidden=false;lowerGrid.hidden=false;scrollTo({top:0,behavior:'smooth'})});

async function loadTraining(){
  const session=(await supabase.auth.getSession()).data.session;if(!session)return;user=session.user;
  const since=parisDate(-90),[catalogResult,stateResult,reviewResult,activityResult]=await Promise.all([
    loadCatalog(),
    supabase.from('user_learning_state').select('module_id,last_read_at').eq('user_id',user.id).order('last_read_at',{ascending:false}).limit(30),
    supabase.from('training_reviews').select('*').eq('user_id',user.id).order('due_at',{ascending:true}).limit(800),
    supabase.from('training_daily_activity').select('*').eq('user_id',user.id).gte('activity_date',since).order('activity_date',{ascending:false}).limit(100)
  ]);
  catalog=catalogResult;states=stateResult.data||[];reviews=reviewResult.data||[];activities=activityResult.data||[];
  if(reviewResult.error||activityResult.error){overview.innerHTML='<article class="training-error"><h2>L’entraînement est presque prêt.</h2><p>La synchronisation de la progression n’est pas encore disponible. Réessayez dans un instant.</p><button class="button dark" onclick="location.reload()">Réessayer</button></article>';return;}
  const dueModules=reviews.filter(row=>new Date(row.due_at)<=new Date()).map(row=>row.module_id),moduleIds=[...new Set([...dueModules,...states.map(state=>state.module_id)])].slice(0,12);
  let sections=[];if(moduleIds.length){const result=await supabase.from('subchapters').select('id,module_id,title,content,order_index').in('module_id',moduleIds).order('order_index');sections=result.data||[];}
  candidates=buildCandidates(sections);prepareQueue();renderOverview();
}

loadTraining().catch(()=>{overview.innerHTML='<article class="training-error"><h2>La session n’a pas pu être préparée.</h2><p>Rechargez la page pour reprendre.</p><button class="button dark" onclick="location.reload()">Recharger</button></article>';});
