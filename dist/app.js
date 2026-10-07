import { supabase } from './supabase.js';
import { academyOffer,coachingOffer,formatAcademyPrice,formatCommercialPrice } from './commercial-config.js';

document.querySelectorAll('[data-coaching-duration]').forEach(node=>node.textContent=`${coachingOffer.durationMonths} mois`);
document.querySelectorAll('[data-coaching-price]').forEach(node=>node.textContent=formatCommercialPrice(coachingOffer.price));
document.querySelectorAll('[data-academy-first-month-price]').forEach(node=>node.textContent=formatAcademyPrice(academyOffer.firstMonthPrice));
document.querySelectorAll('[data-academy-recurring-price]').forEach(node=>node.textContent=formatAcademyPrice(academyOffer.recurringPrice));

let pillars = [
  {id:'nourrir',name:'NOURRIR',orderIndex:0},
  {id:'corps',name:'CORPS',orderIndex:1},
  {id:'proteger',name:'PROTÉGER',orderIndex:2},
  {id:'vivre',name:'VIVRE',orderIndex:3},
  {id:'se-construire',name:'SE CONSTRUIRE',orderIndex:4},
];

const fallbackDescriptions = {
  alimentation:'Le carburant ancestral : une alimentation dense, consciente et adaptée à votre biologie.',
  courses:'Acheter, préparer et cuisiner avec méthode et simplicité.',
  hydratation:'Observer et organiser son hydratation au quotidien.', sport:'Bouger avec méthode, plaisir et régularité.',
  sommeil:'Observer son rythme, sa récupération et son énergie.', sante:'Mieux comprendre son parcours de santé et son hygiène.',
  toxines:'Évaluer les expositions avec mesure et discernement.', productivite:'Faire moins, avec davantage d’intention.',
  argent:'Mettre ses ressources au service de ses priorités.', relations:'Cultiver les liens et poser des limites claires.',
  societe:'Comprendre l’influence de nos milieux de vie.', autonomie:'Renforcer sa capacité à comprendre, choisir et agir.',
  spiritualite:'Explorer le sens, les valeurs et la présence.', longevite:'Penser sa santé dans le temps long.'
};
const icons = {alimentation:'◒',courses:'◇',hydratation:'≈',sport:'⌁',sommeil:'☾',sante:'✚',hygiene:'✧',toxines:'⌬',productivite:'▦',argent:'◌',relations:'⋈',societe:'◉',autonomie:'↗',spiritualite:'△',longevite:'∞'};
const makeChapter = (pillarId,slug,name,moduleTitles,description=fallbackDescriptions[slug]||'') => ({pillarId,slug,name,icon:icons[slug]||'◇',description,modules:moduleTitles.map(title=>({title,description:'',duration:10}))});

let chapters = [
  makeChapter('nourrir','alimentation','Alimentation primale',['Les Fondamentaux de l’Assiette Primale','Les Piliers de Votre Nutrition','Les Aliments à Éliminer','Structurer vos Repas']),
  makeChapter('nourrir','courses','Approvisionnement et Cuisine',['Approvisionnement et Préparation','Préparer ses courses','Lire et choisir','Construire son répertoire','Cuisiner avec souplesse']),
  makeChapter('nourrir','hydratation','Hydratation',['Comprendre l’hydratation','Choisir son eau','Créer ses repères']),
  makeChapter('corps','sport','Mouvement',['Choisir sa pratique','Construire sa progression']),
  makeChapter('corps','sommeil','Récupération',['Comprendre son sommeil','Construire son rituel du soir','Cartographier son énergie','Gérer ses ressources']),
  makeChapter('corps','sante','Santé & Hygiène',['Cultiver sa littératie en santé','Maladies chroniques','Les gestes essentiels','Un environnement sain']),
  makeChapter('corps','hygiene','Peau & Apparence',['Sentir bon','Se maquiller','Corriger ses problèmes de peau']),
  makeChapter('proteger','toxines','Expositions',['Comprendre l’exposition','Réduire avec pragmatisme','alimentation','environnement','produits ménagers','pollution','cosmétiques','matériaux']),
  makeChapter('proteger','autonomie','Sécurité personnelle',['Identifier une situation à risque','Éviter les situations dangereuses','Vigilance et conscience de l’environnement','Réagir face à une menace','Se déplacer en sécurité','Premiers réflexes en situation d’urgence'],'Savoir réduire les risques et réagir face aux situations dangereuses.'),
  makeChapter('proteger','relations','Protéger ses proches',['Sécurité des enfants','Protection des proches','Situations d’urgence','Organisation familiale','Prévention des accidents','Savoir alerter et demander de l’aide'],'Veiller sur les personnes dont on a la responsabilité.'),
  makeChapter('proteger','autonomie','Foyer & biens',['Sécurité du domicile','Cambriolage','Incendie','Dégâts des eaux','Sécurisation des accès','Protection des objets de valeur','Assurances','Inventaire et sauvegardes'],'Protéger son domicile et ce qui nous appartient.'),
  makeChapter('proteger','autonomie','Résilience',['Préparer une situation d’urgence','Trousse et équipements essentiels','Eau et alimentation','Électricité et communications','Plans d’urgence','Autonomie temporaire','Continuité familiale'],'Être capable de faire face lorsque les systèmes habituels ne fonctionnent plus.'),
  makeChapter('vivre','productivite','Organisation',['Clarifier ses priorités','Protéger son attention']),
  makeChapter('vivre','argent','Ressources',['Lire ses dépenses','Construire un budget utile']),
  makeChapter('vivre','relations','Relations',['Prendre soin de ses liens','Poser ses limites']),
  makeChapter('vivre','societe','Société',['Lire son environnement','Choisir sa participation']),
  makeChapter('se-construire','autonomie','Autonomie',['Décider avec méthode','Apprendre par soi-même']),
  makeChapter('se-construire','spiritualite','Sens',['Nommer ce qui compte','Créer un temps de présence']),
  makeChapter('se-construire','longevite','Longévité',['Le temps comme allié','Construire pour durer']),
];
let allModules = [];
const rebuildModuleIndex = () => {
  const perPillar = new Map();
  chapters.forEach(chapter => { const index=perPillar.get(chapter.pillarId)||0; chapter.pillarChapterIndex=index; perPillar.set(chapter.pillarId,index+1); });
  allModules = chapters.flatMap((chapter, chapterIndex) =>
    chapter.modules.map((module, moduleIndex) => ({...module, chapter, chapterIndex, moduleIndex, id:`${chapterIndex+1}-${moduleIndex+1}`}))
  );
};
rebuildModuleIndex();

const hydrateCatalog = async () => {
  const { data, error } = await supabase.from('chapters').select('id,title,category,description,order_index,pillar_id,visual_key,is_visible,pillar:pillars(id,title,order_index),modules(id,title,description,duration_minutes,order_index,is_visible)').eq('is_visible',true).order('order_index');
  if (error || !data?.length) return;
  const dbPillars=[...new Map(data.filter(item=>item.pillar).map(item=>[item.pillar.id,item.pillar])).values()].sort((a,b)=>a.order_index-b.order_index);
  if(dbPillars.length) pillars=dbPillars.map(item=>({id:item.id,name:item.title,orderIndex:item.order_index}));
  chapters=data.map(dbChapter=>({
    id:dbChapter.id,pillarId:dbChapter.pillar_id,slug:dbChapter.visual_key||'autonomie',icon:icons[dbChapter.visual_key]||'◇',
    name:dbChapter.title||dbChapter.category,description:dbChapter.description||'',
    modules:(dbChapter.modules||[]).filter(module=>module.is_visible!==false).sort((a,b)=>a.order_index-b.order_index).map(module=>({id:module.id,title:module.title,description:module.description||'',duration:module.duration_minutes||1}))
  }));
  rebuildModuleIndex();
  window.dispatchEvent(new CustomEvent('stoa:catalog-ready'));
};

if (document.querySelector('#lesson-content')) await hydrateCatalog();
else if (document.querySelector('#course-list')) await Promise.race([hydrateCatalog(),new Promise(resolve=>setTimeout(resolve,1800))]);

document.querySelectorAll('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });

const imagePath = chapter => `assets/categories/${chapter.slug}.jpg`;
const number = value => String(value).padStart(2,'0');
const readSaved = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const progressStorageKey='stoa-progress-pillars-v1';
let completed = new Set(readSaved(progressStorageKey, []).filter(id => allModules.some(module => module.id === id)));
const params = new URLSearchParams(location.search);
const moduleUuidByLocalId = new Map();
let currentAuthUser;

const syncRemoteProgress = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  currentAuthUser = sessionData.session?.user;
  if (!currentAuthUser) return;
  const [{ data: dbChapters }, { data: progressRows }] = await Promise.all([
    supabase.from('chapters').select('id, order_index, modules(id, order_index, is_visible)').eq('is_visible',true).order('order_index'),
    supabase.from('user_progress').select('module_id, status').eq('user_id', currentAuthUser.id).eq('status', 'completed'),
  ]);
  (dbChapters || []).forEach(chapter => {
    (chapter.modules || []).filter(module=>module.is_visible!==false).forEach(module => {
      moduleUuidByLocalId.set(`${chapter.order_index + 1}-${module.order_index + 1}`, module.id);
    });
  });
  const localIdByUuid = new Map([...moduleUuidByLocalId].map(([localId, uuid]) => [uuid, localId]));
  const remoteCompleted = new Set((progressRows || []).map(row => localIdByUuid.get(row.module_id)).filter(Boolean));
  const legacyLocal = [...completed].filter(localId => moduleUuidByLocalId.has(localId) && !remoteCompleted.has(localId));
  if (legacyLocal.length) {
    await supabase.from('user_progress').upsert(legacyLocal.map(localId => ({
      user_id: currentAuthUser.id,
      module_id: moduleUuidByLocalId.get(localId),
      subchapter_id: null,
      status: 'completed',
    })), { onConflict: 'user_id,module_id,subchapter_id' });
  }
  completed = new Set([...remoteCompleted, ...completed]);
  save(progressStorageKey, [...completed]);
};

const persistModuleProgress = async (localId, done) => {
  if (!currentAuthUser || !moduleUuidByLocalId.has(localId)) return;
  const match = { user_id: currentAuthUser.id, module_id: moduleUuidByLocalId.get(localId) };
  if (done) {
    await supabase.from('user_progress').upsert({ ...match, subchapter_id: null, status: 'completed' }, { onConflict: 'user_id,module_id,subchapter_id' });
  } else {
    await supabase.from('user_progress').delete().eq('user_id', match.user_id).eq('module_id', match.module_id).is('subchapter_id', null);
  }
};

const categoryStrip = document.querySelector('#category-strip');
if (categoryStrip) {
  const roman = ['I', 'II', 'III', 'IV', 'V'];
  categoryStrip.insertAdjacentHTML('beforeend', pillars.map((pillar,index)=>`<span class="pillar-item"><i>${roman[index]}</i><b>${pillar.name}</b></span>`).join(''));
}

const landingChapters = document.querySelector('#landing-chapters');
if (landingChapters) {
  landingChapters.innerHTML = chapters.map((chapter,index)=>`<a class="chapter-card" href="/academie?chapitre=${index+1}"><span class="chapter-num">CHAPITRE ${number(index+1)}</span><img class="chapter-visual" src="${imagePath(chapter)}" alt="Illustration du chapitre ${chapter.name}" loading="lazy"><h3>${chapter.name}</h3><p>${chapter.description}</p><div class="card-bottom"><span>${chapter.modules.length} modules</span><span>↗</span></div></a>`).join('');
}

const dialog = document.querySelector('#plan-dialog');
const academyCheckoutButton=document.querySelector('[data-plan="Académie"]');
const academyCheckoutStatus=document.querySelector('#academy-checkout-status');
let academyCheckoutBusy=false;
const setAcademyCheckoutStatus=(message,tone='info')=>{if(academyCheckoutStatus){academyCheckoutStatus.textContent=message;academyCheckoutStatus.dataset.tone=tone;}};
const startAcademyCheckout=async()=>{
  if(academyCheckoutBusy)return;
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){sessionStorage.setItem('stoa-pending-checkout','academy');document.querySelector('[data-auth-link]')?.click();return;}
  sessionStorage.removeItem('stoa-pending-checkout');
  const {data:hasAccess}=await supabase.rpc('has_active_academy_access',{p_user_id:session.user.id});
  if(hasAccess){location.assign('/accueil');return;}
  academyCheckoutBusy=true;academyCheckoutButton.disabled=true;academyCheckoutButton.setAttribute('aria-busy','true');setAcademyCheckoutStatus('Ouverture du paiement sécurisé…');
  const {data,error}=await supabase.functions.invoke('create-checkout',{body:{offer:'academy'}});
  academyCheckoutBusy=false;academyCheckoutButton.disabled=false;academyCheckoutButton.setAttribute('aria-busy','false');
  if(error||!data?.url){setAcademyCheckoutStatus(data?.error||error?.message||'Le paiement ne peut pas être ouvert pour le moment.','error');return;}
  location.assign(data.url);
};
academyCheckoutButton?.addEventListener('click',startAcademyCheckout);
window.addEventListener('stoa:auth-ready',event=>{if(event.detail?.session&&sessionStorage.getItem('stoa-pending-checkout')==='academy')startAcademyCheckout();});
document.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();}});

const courseList = document.querySelector('#course-list');
const normalizeSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const escapeHtml = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let selectedPillarId=chapters[Math.max(0,(Number(params.get('chapitre'))||1)-1)]?.pillarId||pillars[0]?.id;

function renderCourses() {
  if (!courseList) return;
  const tokens=[];
  const requestedChapter=Math.max(0,(Number(params.get('chapitre'))||1)-1);
  const learningStates=window.__STOA_LEARNING_STATES__||[];
  let resultCount=0;
  const roman=['I','II','III','IV','V'];
  const pillarData=pillars.map((pillar,pillarIndex)=>{
    const pillarChapters=chapters.map((chapter,chapterIndex)=>({chapter,chapterIndex})).filter(({chapter})=>chapter.pillarId===pillar.id);
    const visibleChapters=pillarChapters.map(({chapter,chapterIndex})=>{
      const chapterNumber=chapterIndex+1;
      const chapterText=normalizeSearch(`${pillar.name} ${chapter.name} ${chapter.description}`);
      const matchingModules=chapter.modules.map((module,moduleIndex)=>({module,moduleIndex})).filter(({module})=>{
        const haystack=normalizeSearch(`${chapterText} ${module.title} ${module.description}`);
        return !tokens.length || tokens.every(token=>haystack.includes(token));
      });
      if(!matchingModules.length)return null;
      resultCount+=matchingModules.length;
      const finished=chapter.modules.filter((_,moduleIndex)=>completed.has(`${chapterNumber}-${moduleIndex+1}`)).length;
      const percentage=chapter.modules.length?Math.round(finished/chapter.modules.length*100):0;
      return {chapter,chapterIndex,chapterNumber,matchingModules,finished,percentage};
    }).filter(Boolean);
    const moduleTotal=pillarChapters.reduce((sum,item)=>sum+item.chapter.modules.length,0);
    const pillarFinished=pillarChapters.reduce((sum,{chapter,chapterIndex})=>sum+chapter.modules.filter((_,moduleIndex)=>completed.has(`${chapterIndex+1}-${moduleIndex+1}`)).length,0);
    const pillarPercentage=moduleTotal?Math.round(pillarFinished/moduleTotal*100):0;
    const state=learningStates.find(item=>pillarChapters.some(({chapter})=>chapter.modules.some(module=>module.id===item.module_id)));
    let continueItem=state?allModules.find(item=>item.chapter.modules[item.moduleIndex]?.id===state.module_id):null;
    continueItem ||= allModules.find(item=>item.chapter.pillarId===pillar.id&&!completed.has(item.id))||allModules.find(item=>item.chapter.pillarId===pillar.id);
    const description={NOURRIR:'Alimentation, hydratation et cuisine.',CORPS:'Mouvement, récupération et santé.',PROTÉGER:'Expositions, sécurité et résilience.',VIVRE:'Organisation, ressources et relations.','SE CONSTRUIRE':'Autonomie, sens et temps long.'}[pillar.name]||'Un parcours pour construire des fondations durables.';
    return {pillar,pillarIndex,pillarChapters,visibleChapters,moduleTotal,pillarFinished,pillarPercentage,state,continueItem,description,image:pillarChapters[0]?.chapter?.slug||'alimentation'};
  });
  const available=pillarData.filter(item=>item.visibleChapters.length);
  const selected=pillarData.find(item=>item.pillar.id===selectedPillarId)||available[0]||pillarData[0];
  if(!resultCount||!selected){courseList.innerHTML='<div class="search-empty"><span>⌕</span><h3>Aucune leçon trouvée.</h3><p>Essayez un thème plus large ou un autre mot.</p></div>';return;}
  const gateways=pillarData.map(item=>`<button class="pillar-gateway ${item.pillar.id===selected.pillar.id?'active':''}" type="button" data-pillar-select="${escapeHtml(item.pillar.id)}" aria-pressed="${item.pillar.id===selected.pillar.id}"><span class="pillar-roman">${roman[item.pillarIndex]||number(item.pillarIndex+1)}</span><span class="pillar-shaft" aria-hidden="true"><i></i></span><strong>${escapeHtml(item.pillar.name)}</strong><small>${item.pillarPercentage}%</small></button>`).join('');
  const focusChapters=selected.visibleChapters.map(({chapter,chapterIndex,chapterNumber,matchingModules,finished,percentage})=>`<details class="pillar-chapter-row" ${tokens.length||chapterIndex===requestedChapter?'open':''}><summary><span>${number(chapter.pillarChapterIndex+1)}</span><div><strong>${escapeHtml(chapter.name)}</strong><small>${finished}/${chapter.modules.length} leçons · ${percentage}%</small></div><i></i></summary><div class="pillar-module-list">${matchingModules.map(({module,moduleIndex})=>{const id=`${chapterNumber}-${moduleIndex+1}`,done=completed.has(id),last=learningStates.some(item=>item.module_id===module.id);return `<a href="/module?chapitre=${chapterNumber}&module=${moduleIndex+1}${last?'&reprendre=1':''}" class="${last?'last-read':''}"><span class="module-number ${done?'done':''}">${done?'✓':number(moduleIndex+1)}</span><span><strong>${escapeHtml(module.title)}</strong><small>${last?'Dernière lecture · Reprendre exactement ici':`${module.duration} min · ${done?'Terminé':'À découvrir'}`}</small></span><b>→</b></a>`;}).join('')}</div></details>`).join('');
  courseList.innerHTML=`<section class="academy-colonnade"><div class="pillar-gateways" aria-label="Choisir un pilier">${gateways}</div><article class="pillar-focus-panel"><div class="pillar-focus-visual" style="--pillar-image:url('/assets/categories/${escapeHtml(selected.image)}.jpg')"><span>PILIER ${roman[selected.pillarIndex]}</span><strong>${escapeHtml(selected.pillar.name)}</strong></div><div class="pillar-focus-content"><header><div><span class="eyebrow">PILIER ${roman[selected.pillarIndex]}</span><h2>${escapeHtml(selected.pillar.name)}</h2><p>${selected.description}</p></div><div class="pillar-card-progress"><strong>${selected.pillarPercentage}%</strong><span>complété</span></div></header><div class="pillar-progress-track"><i style="--progress:${selected.pillarPercentage}%"></i></div><div class="pillar-card-meta"><span>${selected.pillarChapters.length} chapitres · ${selected.moduleTotal} leçons</span>${selected.state?'<strong>Dernière lecture disponible</strong>':'<span>Parcours à découvrir</span>'}</div><div class="pillar-card-chapters">${focusChapters}</div>${selected.continueItem?`<a class="pillar-continue" href="/module?chapitre=${selected.continueItem.chapterIndex+1}&module=${selected.continueItem.moduleIndex+1}${selected.state?'&reprendre=1':''}"><span>${selected.state?'Continuer votre dernière lecture':'Commencer ce pilier'}</span><strong>${escapeHtml(selected.continueItem.title)}</strong><i>→</i></a>`:''}</div></article></section>`;
}

if (courseList) {
  renderCourses();
  courseList.addEventListener('click',event=>{const button=event.target.closest('[data-pillar-select]');if(!button)return;selectedPillarId=button.dataset.pillarSelect;renderCourses();courseList.querySelector('.pillar-focus-panel')?.scrollIntoView({behavior:'smooth',block:'nearest'});});
  const progressCount=document.querySelector('#progress-count');if(progressCount)progressCount.textContent=completed.size;
  const progressTotal=document.querySelector('#progress-total');if(progressTotal)progressTotal.textContent=`/ ${allModules.length} leçons`;
  const progress=document.querySelector('#total-progress');if(progress){progress.max=allModules.length;progress.value=completed.size;progress.textContent=`${completed.size} sur ${allModules.length}`;}
  document.querySelector('#library-count').textContent=`${pillars.length} piliers · ${chapters.length} chapitres · ${allModules.length} leçons`;
  const progressCaption=document.querySelector('#progress-caption');if(completed.size&&progressCaption)progressCaption.textContent=completed.size===allModules.length?'Vos fondations sont posées. Continuez à les cultiver.':'Chaque leçon compte. Continuez à votre rythme.';
  const next=allModules.find(module=>!completed.has(module.id));
  if(next&&document.querySelector('#continue-title')){const pillar=pillars.find(item=>item.id===next.chapter.pillarId);document.querySelector('#continue-title').textContent=next.title;document.querySelector('#continue-chapter').textContent=`${pillar?.name||''} · CHAPITRE ${number(next.chapter.pillarChapterIndex+1)} — ${next.chapter.name.toUpperCase()}`;document.querySelector('.continue-icon').textContent=next.chapter.icon;document.querySelector('#continue-link').href=`/module?chapitre=${next.chapterIndex+1}&module=${next.moduleIndex+1}`;if(completed.size){document.querySelector('#continue-link').innerHTML='Continuer <span>↗</span>';document.querySelector('#continue-description').textContent='La prochaine étape de votre parcours.';}}
  syncRemoteProgress().then(()=>{
    renderCourses();
    const count=document.querySelector('#progress-count');if(count)count.textContent=completed.size;
    const progress=document.querySelector('#total-progress');if(progress){progress.value=completed.size;progress.textContent=`${completed.size} sur ${allModules.length}`;}
  });
  window.addEventListener('stoa:learning-state',()=>renderCourses());
  window.addEventListener('stoa:catalog-ready',()=>renderCourses());
}

if (document.querySelector('#lesson-content')) {
  const chapterIndex=Math.min(Math.max(Number(params.get('chapitre'))||1,1),chapters.length)-1;
  const chapter=chapters[chapterIndex];
  const moduleIndex=Math.min(Math.max(Number(params.get('module'))||1,1),chapter.modules.length)-1;
  const module=chapter.modules[moduleIndex],id=`${chapterIndex+1}-${moduleIndex+1}`;
  const lessonPillar=pillars.find(item=>item.id===chapter.pillarId);
  document.title=`${module.title} — STOA`;
  document.querySelector('#lesson-title').textContent=module.title;
  document.querySelector('#lesson-kicker').textContent=`PILIER ${lessonPillar?.name||''} / CHAPITRE ${number(chapter.pillarChapterIndex+1)} — ${chapter.name.toUpperCase()} / LEÇON ${number(moduleIndex+1)}`;
  const artwork=document.querySelector('#lesson-artwork');artwork.src=imagePath(chapter);artwork.alt=`Illustration du chapitre ${chapter.name}`;
  document.querySelector('#lesson-chapter').innerHTML=`<span class="eyebrow">${lessonPillar?.name||''} · CHAPITRE ${number(chapter.pillarChapterIndex+1)}</span><h2>${chapter.name}</h2>`;
  const nav=document.querySelector('#lesson-nav');
  const renderNav=()=>{nav.innerHTML=chapter.modules.map((item,index)=>`<a href="/module?chapitre=${chapterIndex+1}&module=${index+1}" ${index===moduleIndex?'aria-current="page"':''}><span>${completed.has(`${chapterIndex+1}-${index+1}`)?'✓':number(index+1)}</span>${item.title}</a>`).join('');};renderNav();
  document.querySelector('#lesson-copy').innerHTML=`<h2>${module.description}</h2><p>Cette leçon pose des repères clairs pour observer votre situation, comprendre les notions essentielles et choisir une action adaptée à votre quotidien.</p><p>Le contenu est servi depuis Supabase sous forme de sections ordonnées.</p>`;
  const escapeContent=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const inlineMarkup=(value)=>escapeContent(value).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_]+)__/g,'<u>$1</u>').replace(/(^|[^*])\*([^*]+)\*/g,'$1<em>$2</em>');
  const normalizeQuiz=(value)=>{
    try{
      const parsed=typeof value==='string'?JSON.parse(value):value;
      if(!parsed||!Array.isArray(parsed.questions))return null;
      return {questions:parsed.questions.map(question=>({question:String(question.question||''),answers:Array.isArray(question.answers)?question.answers.map(String):[],correct:Number(question.correct)})).filter(question=>question.question&&question.answers.length>=2&&Number.isInteger(question.correct)&&question.correct>=0&&question.correct<question.answers.length)};
    }catch{return null;}
  };
  const sanitizeStoredHtml=(html)=>{
    const template=document.createElement('template'); template.innerHTML=html;
    template.content.querySelectorAll('font[face]').forEach(font=>{
      const face=(font.getAttribute('face')||'').toLowerCase(),kind=face.includes('cormorant')?'serif':face.includes('segoe')?'sans':'';
      if(!kind){font.replaceWith(...font.childNodes);return;}
      const span=document.createElement('span');span.dataset.font=kind;span.append(...font.childNodes);font.replaceWith(span);
    });
    const allowed=new Set(['P','DIV','BR','H2','H3','H4','STRONG','B','EM','I','U','UL','OL','LI','BLOCKQUOTE','FIGURE','IMG','FIGCAPTION','SECTION','A','SPAN']);
    [...template.content.querySelectorAll('*')].forEach(element=>{
      if(!allowed.has(element.tagName)){element.replaceWith(...element.childNodes);return;}
      const imageSource=element.tagName==='IMG'?(element.getAttribute('src')||''):'';
      const linkTarget=element.tagName==='A'?(element.getAttribute('href')||''):'';
      const quiz=element.tagName==='SECTION'?normalizeQuiz(element.getAttribute('data-quiz')):null;
      const font=element.tagName==='SPAN'?(element.getAttribute('data-font')||''):'';
      if(element.tagName==='SECTION'&&!quiz){element.replaceWith(...element.childNodes);return;}
      if(element.tagName==='SPAN'&&!['sans','serif'].includes(font)){element.replaceWith(...element.childNodes);return;}
      [...element.attributes].forEach(attribute=>element.removeAttribute(attribute.name));
      if(element.tagName==='IMG'){
        if(imageSource.startsWith('https://')||imageSource.startsWith('/')) element.setAttribute('src',imageSource); else element.remove();
        element.setAttribute('alt',''); element.setAttribute('loading','lazy');
      }
      if(element.tagName==='A'){
        if(/^(https?:\/\/|mailto:|\/|#)/i.test(linkTarget)) element.setAttribute('href',linkTarget); else {element.replaceWith(...element.childNodes);return;}
        if(/^https?:\/\//i.test(linkTarget)){element.setAttribute('target','_blank');element.setAttribute('rel','noopener noreferrer');}
      }
      if(element.tagName==='FIGURE') element.className='lesson-inline-image';
      if(element.tagName==='SECTION'){element.className='lesson-quiz';element.dataset.quiz=JSON.stringify(quiz);element.replaceChildren();}
      if(element.tagName==='SPAN') element.dataset.font=font;
    });
    return template.innerHTML;
  };
  const renderLessonQuizzes=()=>document.querySelectorAll('.lesson-quiz[data-quiz]').forEach(element=>{
    const quiz=normalizeQuiz(element.dataset.quiz); if(!quiz?.questions.length){element.remove();return;}
    element.innerHTML=`<span class="eyebrow">MINI QUIZ</span><h3>Vérifiez ce que vous retenez.</h3><div class="lesson-quiz-questions">${quiz.questions.map((question,questionIndex)=>`<fieldset data-quiz-question="${questionIndex}"><legend><span>${number(questionIndex+1)}</span>${escapeContent(question.question)}</legend><div>${question.answers.map((answer,answerIndex)=>`<button type="button" data-quiz-answer="${answerIndex}" aria-pressed="false"><i></i>${escapeContent(answer)}</button>`).join('')}</div></fieldset>`).join('')}</div><div class="lesson-quiz-footer"><button type="button" class="button dark" data-quiz-check>Vérifier mes réponses</button><p role="status"></p></div>`;
  });
  const renderContentBlock=(value)=>{
    const trimmed=value.trim();
    if(/^##\s+/.test(trimmed)) return `<h3>${inlineMarkup(trimmed.replace(/^##\s+/,''))}</h3>`;
    if(/^>\s+/.test(trimmed)) return `<blockquote>${inlineMarkup(trimmed.replace(/^>\s+/gm,'')).replaceAll('\n','<br>')}</blockquote>`;
    const lines=trimmed.split('\n');
    if(lines.every(line=>/^[-*]\s+/.test(line))) return `<ul>${lines.map(line=>`<li>${inlineMarkup(line.replace(/^[-*]\s+/,''))}</li>`).join('')}</ul>`;
    return `<p>${inlineMarkup(trimmed).replace(/^([^:]{2,90})\s*:\s*/, '<strong>$1 :</strong> ').replaceAll('\n','<br>')}</p>`;
  };
  const loadLessonContent=async()=>{
    const {data:dbChapter}=await supabase.from('chapters').select('id,title,category').eq('is_visible',true).eq('order_index',chapterIndex).maybeSingle();
    if(!dbChapter)return;
    const {data:dbModule}=await supabase.from('modules').select('id,title,description,duration_minutes').eq('chapter_id',dbChapter.id).eq('is_visible',true).eq('order_index',moduleIndex).maybeSingle();
    if(!dbModule)return;
    const {data:sections}=await supabase.from('subchapters').select('id,title,content,order_index').eq('module_id',dbModule.id).order('order_index');
    if(!sections?.length)return;
    const {data:imageRows}=await supabase.from('subchapter_images').select('subchapter_id,image_url,alt_text,caption,position_index,order_index').in('subchapter_id',sections.map(section=>section.id)).order('order_index');
    const images=imageRows||[];
    document.title=`${dbModule.title} — STOA`; document.querySelector('#lesson-title').textContent=dbModule.title;
    document.querySelector('#lesson-copy').innerHTML=`<p class="lesson-introduction" data-module-description>${escapeContent(dbModule.description)}</p>`+sections.map((section,sectionIndex)=>{
      const paragraphs=section.content.split(/\n\s*\n/).filter(Boolean);
      const storedAsHtml=/^\s*<(?:p|div|h[2-4]|ul|ol|blockquote|figure)\b/i.test(section.content);
      const sectionImages=storedAsHtml?[]:images.filter(image=>image.subchapter_id===section.id);
      const imageMarkup=(image)=>`<figure class="lesson-inline-image"><img src="${escapeContent(image.image_url)}" alt="${escapeContent(image.alt_text||'')}" loading="lazy">${image.caption?`<figcaption>${escapeContent(image.caption)}</figcaption>`:''}</figure>`;
      const leading=sectionImages.filter(image=>image.position_index===0).map(imageMarkup).join('');
      const body=storedAsHtml?sanitizeStoredHtml(section.content):paragraphs.map((paragraph,index)=>{
        const placed=sectionImages.filter(image=>image.position_index===index+1).map(imageMarkup).join('');
        return `${renderContentBlock(paragraph)}${placed}`;
      }).join('');
      const remaining=sectionImages.filter(image=>image.position_index>paragraphs.length).map(imageMarkup).join('');
      const heading=section.title==='Cours'?'':`<h2 data-subchapter-title>${escapeContent(section.title)}</h2>`;
      return `<section class="lesson-subchapter" id="lesson-${section.id}" data-subchapter-id="${section.id}">${heading}<div class="lesson-subchapter-content">${leading}${body}${remaining}</div></section>`;
    }).join('');
    window.__STOA_LESSON_DATA__={moduleId:dbModule.id,sections:sections.map(section=>({id:section.id,title:section.title}))};
    renderLessonQuizzes();
    window.dispatchEvent(new CustomEvent('stoa:lesson-ready'));
  };
  loadLessonContent();
  document.querySelector('#lesson-copy').addEventListener('click',(event)=>{
    const answer=event.target.closest('[data-quiz-answer]');
    if(answer){const fieldset=answer.closest('[data-quiz-question]');fieldset.querySelectorAll('[data-quiz-answer]').forEach(button=>{button.classList.remove('selected','correct','incorrect');button.setAttribute('aria-pressed','false');});answer.classList.add('selected');answer.setAttribute('aria-pressed','true');fieldset.closest('.lesson-quiz').querySelector('.lesson-quiz-footer p').textContent='';return;}
    const check=event.target.closest('[data-quiz-check]'); if(!check)return;
    const quizElement=check.closest('.lesson-quiz'),quiz=normalizeQuiz(quizElement.dataset.quiz),fields=[...quizElement.querySelectorAll('[data-quiz-question]')];
    if(fields.some(field=>!field.querySelector('.selected'))){quizElement.querySelector('.lesson-quiz-footer p').textContent='Répondez à toutes les questions avant de vérifier.';return;}
    let score=0; fields.forEach((field,index)=>{const selected=field.querySelector('.selected'),answerIndex=Number(selected.dataset.quizAnswer),correct=quiz.questions[index].correct;if(answerIndex===correct){score++;selected.classList.add('correct');}else{selected.classList.add('incorrect');field.querySelector(`[data-quiz-answer="${correct}"]`)?.classList.add('correct');}});
    quizElement.querySelector('.lesson-quiz-footer p').textContent=`${score} bonne${score>1?'s':''} réponse${score>1?'s':''} sur ${fields.length}.`;
  });
  document.querySelector('#practice-prompt').textContent=`Quel premier changement concret pourriez-vous essayer autour de « ${module.title.toLowerCase()} » ?`;
  const notes=document.querySelector('#lesson-notes'),noteKey=`stoa-note-${module.id||id}`,noteStatus=document.querySelector('#note-status'),savedNote=readSaved(noteKey,''),lessonUuid=/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(module.id||'')?module.id:null;notes.value=typeof savedNote==='string'?savedNote:'';
  const noteSession=(await supabase.auth.getSession()).data.session;
  if(noteSession&&lessonUuid){const {data:remoteNote}=await supabase.from('user_lesson_notes').select('content').eq('user_id',noteSession.user.id).eq('module_id',lessonUuid).maybeSingle();if(remoteNote){notes.value=remoteNote.content||'';save(noteKey,notes.value);}noteStatus.textContent='Notes synchronisées avec votre compte.';}else noteStatus.textContent='Notes enregistrées sur cet appareil.';
  let noteTimer;notes.addEventListener('input',()=>{save(noteKey,notes.value);noteStatus.textContent=noteSession&&lessonUuid?'Enregistrement…':'Notes enregistrées sur cet appareil.';clearTimeout(noteTimer);if(noteSession&&lessonUuid)noteTimer=setTimeout(async()=>{const {error}=await supabase.from('user_lesson_notes').upsert({user_id:noteSession.user.id,module_id:lessonUuid,content:notes.value,updated_at:new Date().toISOString()},{onConflict:'user_id,module_id'});noteStatus.textContent=error?'La note reste enregistrée sur cet appareil.':'Notes synchronisées avec votre compte.';},650);});
  const completeButton=document.querySelector('#complete-module');
  const updateCompletion=()=>{const done=completed.has(id);completeButton.innerHTML=done?'Terminé — annuler <span>↶</span>':'Marquer comme terminé <span>✓</span>';completeButton.setAttribute('aria-pressed',String(done));};updateCompletion();
  completeButton.addEventListener('click',()=>{const wasCompleted=completed.has(id);wasCompleted?completed.delete(id):completed.add(id);const saved=save(progressStorageKey,[...completed]);persistModuleProgress(id,completed.has(id));updateCompletion();renderNav();document.querySelector('#completion-status').textContent=saved?(completed.has(id)?'Leçon terminée. Votre progression est enregistrée.':'Cette leçon est de nouveau à découvrir.'):'Progression modifiée pour cette session.';if(!wasCompleted&&completed.has(id))window.dispatchEvent(new CustomEvent('stoa:lesson-completed',{detail:{moduleId:module.id||id}}));});
  const currentIndex=allModules.findIndex(item=>item.id===id),previousLink=document.querySelector('#previous-module'),nextLink=document.querySelector('#next-module');
  if(currentIndex>0){const previous=allModules[currentIndex-1];previousLink.href=`/module?chapitre=${previous.chapterIndex+1}&module=${previous.moduleIndex+1}`;}else{previousLink.href='/academie';previousLink.innerHTML='<span>←</span> Académie';}
  if(currentIndex+1<allModules.length){const next=allModules[currentIndex+1];nextLink.href=`/module?chapitre=${next.chapterIndex+1}&module=${next.moduleIndex+1}`;}else nextLink.innerHTML='Retour à l’Académie <span>→</span>';
  syncRemoteProgress().then(()=>{renderNav();updateCompletion();});
}
