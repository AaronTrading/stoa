import { supabase } from './supabase.js';

const chapters = [
  ['alimentation','Alimentation','◒','Le carburant ancestral : une alimentation dense, consciente et adaptée à votre biologie.',[
    ['Les fondamentaux de l’assiette primale','Poser les principes d’une alimentation ancestrale et dense.',12],
    ['Les piliers de votre nutrition','Construire l’assiette autour des aliments essentiels.',25],
    ['Les aliments à éliminer','Identifier les produits modernes à écarter.',18],
    ['Structurer vos repas','Organiser ses repas selon sa faim et son activité.',15],
    ['Approvisionnement et préparation','Choisir ses produits et les préparer simplement.',18],
    ['L’esprit et l’intuition alimentaire','Retrouver écoute, souplesse et plaisir.',12]
  ]],
  ['hydratation','Hydratation','≈','Observer et organiser son hydratation au quotidien.',[['Comprendre l’hydratation','Les repères essentiels',15],['Créer ses repères','Une organisation adaptée à sa journée',16]]],
  ['sport','Sport','⌁','Bouger avec méthode, plaisir et régularité.',[['Choisir sa pratique','Trouver le mouvement qui vous correspond',20],['Construire sa progression','Avancer avec des repères adaptés',24]]],
  ['sante','Santé','✚','Mieux comprendre son parcours de santé et ses interlocuteurs.',[['Cultiver sa littératie en santé','Comprendre une information avant de décider',20],['Préparer une consultation','Formuler ses questions et ses priorités',17]]],
  ['sommeil','Sommeil','☾','Observer son rythme et donner une place au repos.',[['Comprendre son sommeil','Observer avant de changer',19],['Construire son rituel du soir','Créer une transition réaliste',16]]],
  ['hygiene','Hygiène','✧','Des gestes simples pour prendre soin de soi et de son environnement.',[['Les gestes essentiels','Choisir des routines sobres',14],['Un environnement sain','Observer ses espaces de vie',18]]],
  ['energie','Énergie','☼','Identifier ce qui soutient ou disperse son énergie.',[['Cartographier son énergie','Repérer les variations de la journée',17],['Gérer ses ressources','Choisir où placer son effort',20]]],
  ['productivite','Productivité','▦','Faire moins, avec davantage d’intention.',[['Clarifier ses priorités','Distinguer l’urgent de l’important',18],['Protéger son attention','Organiser des temps de concentration',21]]],
  ['longevite','Longévité','∞','Penser sa santé dans le temps long.',[['Le temps comme allié','Comprendre l’effet des habitudes répétées',20],['Construire pour durer','Créer des systèmes soutenables',23]]],
  ['societe','Société','◉','Comprendre l’influence de nos milieux de vie.',[['Lire son environnement','Observer les normes et les incitations',22],['Choisir sa participation','Agir à son échelle',19]]],
  ['spiritualite','Spiritualité','△','Explorer le sens, les valeurs et la présence.',[['Nommer ce qui compte','Clarifier ses valeurs',18],['Créer un temps de présence','Installer un espace de réflexion',16]]],
  ['courses','Courses','◇','Acheter avec méthode et simplicité.',[['Préparer ses courses','Partir de ses besoins réels',15],['Lire et choisir','Comparer sans se perdre',20]]],
  ['recettes','Recettes','◐','Développer un répertoire simple et adaptable.',[['Construire son répertoire','Choisir quelques bases fiables',18],['Cuisiner avec souplesse','Adapter une recette à ce que l’on a',22]]],
  ['autonomie','Autonomie','↗','Renforcer sa capacité à comprendre, choisir et agir.',[['Décider avec méthode','Passer de l’information au choix',21],['Apprendre par soi-même','Construire une pratique de recherche',24]]],
  ['relations','Relations','⋈','Cultiver les liens et poser des limites claires.',[['Prendre soin de ses liens','Donner du temps à ce qui compte',18],['Poser ses limites','Dire ce qui est possible',20]]],
  ['argent','Argent','◌','Mettre ses ressources au service de ses priorités.',[['Lire ses dépenses','Observer sans culpabiliser',19],['Construire un budget utile','Donner une fonction à son argent',23]]],
  ['toxines','Toxines','⌬','Évaluer les expositions avec mesure et discernement.',[['Comprendre l’exposition','Distinguer danger, dose et contexte',22],['Réduire avec pragmatisme','Prioriser les changements utiles',18]]],
].map(([slug,name,icon,description,modules])=>({slug,name,icon,description,modules:modules.map(([title,description,duration])=>({title,description,duration}))}));

const allModules = chapters.flatMap((chapter, chapterIndex) =>
  chapter.modules.map((module, moduleIndex) => ({...module, chapter, chapterIndex, moduleIndex, id:`${chapterIndex+1}-${moduleIndex+1}`}))
);

document.querySelectorAll('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });

const imagePath = chapter => `assets/categories/${chapter.slug}.jpg`;
const number = value => String(value).padStart(2,'0');
const readSaved = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
let completed = new Set(readSaved('stoa-progress', []).filter(id => allModules.some(module => module.id === id)));
const params = new URLSearchParams(location.search);
const moduleUuidByLocalId = new Map();
let currentAuthUser;

const syncRemoteProgress = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  currentAuthUser = sessionData.session?.user;
  if (!currentAuthUser) return;
  const [{ data: dbChapters }, { data: progressRows }] = await Promise.all([
    supabase.from('chapters').select('id, order_index, modules(id, order_index)').order('order_index'),
    supabase.from('user_progress').select('module_id, status').eq('user_id', currentAuthUser.id).eq('status', 'completed'),
  ]);
  (dbChapters || []).forEach(chapter => {
    (chapter.modules || []).forEach(module => {
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
  save('stoa-progress', [...completed]);
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
  categoryStrip.insertAdjacentHTML('beforeend', chapters.slice(0,6).map((chapter,index)=>`<a href="/academie?chapitre=${index+1}">${number(index+1)} <b>${chapter.name}</b></a>`).join(''));
}

const landingChapters = document.querySelector('#landing-chapters');
if (landingChapters) {
  landingChapters.innerHTML = chapters.map((chapter,index)=>`<a class="chapter-card" href="/academie?chapitre=${index+1}"><span class="chapter-num">CHAPITRE ${number(index+1)}</span><img class="chapter-visual" src="${imagePath(chapter)}" alt="Illustration du chapitre ${chapter.name}" loading="lazy"><h3>${chapter.name}</h3><p>${chapter.description}</p><div class="card-bottom"><span>${chapter.modules.length} modules</span><span>↗</span></div></a>`).join('');
}

const dialog = document.querySelector('#plan-dialog');
document.querySelectorAll('[data-plan]').forEach(button => button.addEventListener('click',()=>{
  document.querySelector('#plan-title').textContent = button.dataset.plan;
  dialog.showModal();
}));
document.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();}});

const courseList = document.querySelector('#course-list');
const normalizeSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

function renderCourses(search='') {
  if (!courseList) return;
  const tokens=normalizeSearch(search).split(/\s+/).filter(Boolean);
  let resultCount=0;
  courseList.innerHTML = chapters.map((chapter,chapterIndex)=>{
    const chapterNumber=chapterIndex+1;
    const chapterText=normalizeSearch(`${chapter.name} ${chapter.description}`);
    const matchingModules=chapter.modules.map((module,moduleIndex)=>({module,moduleIndex})).filter(({module})=>{
      const haystack=normalizeSearch(`${chapterText} ${module.title} ${module.description}`);
      return !tokens.length || tokens.every(token=>haystack.includes(token));
    });
    if(!matchingModules.length) return '';
    resultCount+=matchingModules.length;
    const finished=chapter.modules.filter((_,moduleIndex)=>completed.has(`${chapterNumber}-${moduleIndex+1}`)).length;
    return `<section class="course-chapter"><div class="course-chapter-title"><img class="module-thumbnail" src="${imagePath(chapter)}" alt="" loading="lazy"><div><span class="eyebrow">CHAPITRE ${number(chapterNumber)}</span><h3>${chapter.name}</h3><p>${chapter.description}</p></div><span class="chapter-completion">${finished} / ${chapter.modules.length}</span></div><div class="module-list">${matchingModules.map(({module,moduleIndex})=>{const id=`${chapterNumber}-${moduleIndex+1}`,done=completed.has(id);return `<a href="/module?chapitre=${chapterNumber}&module=${moduleIndex+1}" class="module-row"><span class="module-number ${done?'done':''}">${done?'✓':number(moduleIndex+1)}</span><span class="module-label"><strong>${module.title}</strong><small>${module.description}</small></span><span class="module-state">${module.duration} min · ${done?'Terminé':'À découvrir'}</span><span aria-hidden="true">↗</span></a>`;}).join('')}</div></section>`;
  }).join('');
  if(!resultCount) courseList.innerHTML='<div class="search-empty"><span>⌕</span><h3>Aucun module trouvé.</h3><p>Essayez un thème plus large ou un autre mot.</p></div>';
  const status=document.querySelector('#module-search-status');
  if(status) status.textContent=tokens.length?`${resultCount} module${resultCount>1?'s':''} trouvé${resultCount>1?'s':''}`:'';
}

if (courseList) {
  const requested=params.get('chapitre');
  const searchInput=document.querySelector('#module-search');
  const clearSearch=document.querySelector('#module-search-clear');
  if(params.get('recherche')) searchInput.value=params.get('recherche');
  else if(chapters[Number(requested)-1]) searchInput.value=chapters[Number(requested)-1].name;
  renderCourses(searchInput.value);
  searchInput.addEventListener('input',()=>{renderCourses(searchInput.value);clearSearch.hidden=!searchInput.value;const url=new URL(location);url.searchParams.delete('chapitre');searchInput.value?url.searchParams.set('recherche',searchInput.value):url.searchParams.delete('recherche');history.replaceState(null,'',url);});
  clearSearch.hidden=!searchInput.value;
  clearSearch.addEventListener('click',()=>{searchInput.value='';clearSearch.hidden=true;renderCourses();searchInput.focus();history.replaceState(null,'',location.pathname);});
  document.querySelector('#progress-count').textContent=completed.size;
  document.querySelector('#progress-total').textContent=`/ ${allModules.length} modules`;
  const progress=document.querySelector('#total-progress');progress.max=allModules.length;progress.value=completed.size;progress.textContent=`${completed.size} sur ${allModules.length}`;
  document.querySelector('#library-count').textContent=`${chapters.length} chapitres · ${allModules.length} modules`;
  if(completed.size)document.querySelector('#progress-caption').textContent=completed.size===allModules.length?'Vos fondations sont posées. Continuez à les cultiver.':'Chaque module compte. Continuez à votre rythme.';
  const next=allModules.find(module=>!completed.has(module.id));
  if(next){document.querySelector('#continue-title').textContent=next.title;document.querySelector('#continue-chapter').textContent=`CHAPITRE ${number(next.chapterIndex+1)} — ${next.chapter.name.toUpperCase()}`;document.querySelector('.continue-icon').textContent=next.chapter.icon;document.querySelector('#continue-link').href=`/module?chapitre=${next.chapterIndex+1}&module=${next.moduleIndex+1}`;if(completed.size){document.querySelector('#continue-link').innerHTML='Continuer <span>↗</span>';document.querySelector('#continue-description').textContent='La prochaine étape de votre parcours.';}}
  syncRemoteProgress().then(()=>{
    renderCourses(searchInput.value);
    document.querySelector('#progress-count').textContent=completed.size;
    const progress=document.querySelector('#total-progress');progress.value=completed.size;progress.textContent=`${completed.size} sur ${allModules.length}`;
  });
}

if (document.querySelector('#lesson-content')) {
  const chapterIndex=Math.min(Math.max(Number(params.get('chapitre'))||1,1),chapters.length)-1;
  const chapter=chapters[chapterIndex];
  const moduleIndex=Math.min(Math.max(Number(params.get('module'))||1,1),chapter.modules.length)-1;
  const module=chapter.modules[moduleIndex],id=`${chapterIndex+1}-${moduleIndex+1}`;
  document.title=`${module.title} — STOA`;
  document.querySelector('#lesson-title').textContent=module.title;
  document.querySelector('#lesson-kicker').textContent=`CHAPITRE ${number(chapterIndex+1)} — ${chapter.name.toUpperCase()} / MODULE ${number(moduleIndex+1)}`;
  const artwork=document.querySelector('#lesson-artwork');artwork.src=imagePath(chapter);artwork.alt=`Illustration du chapitre ${chapter.name}`;
  document.querySelector('#lesson-chapter').innerHTML=`<span class="eyebrow">CHAPITRE ${number(chapterIndex+1)}</span><h2>${chapter.name}</h2>`;
  const nav=document.querySelector('#lesson-nav');
  const renderNav=()=>{nav.innerHTML=chapter.modules.map((item,index)=>`<a href="/module?chapitre=${chapterIndex+1}&module=${index+1}" ${index===moduleIndex?'aria-current="page"':''}><span>${completed.has(`${chapterIndex+1}-${index+1}`)?'✓':number(index+1)}</span>${item.title}</a>`).join('');};renderNav();
  document.querySelector('#lesson-copy').innerHTML=`<h2>${module.description}</h2><p>Ce module pose des repères clairs pour observer votre situation, comprendre les notions essentielles et choisir une action adaptée à votre quotidien.</p><p>Le contenu définitif sera servi depuis Supabase sous forme de sous-chapitres ordonnés. Cette page montre la structure de lecture et de progression.</p>`;
  const escapeContent=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const paragraphMarkup=(value)=>escapeContent(value).replace(/^([^:]{2,90})\s*:\s*/, '<strong>$1 :</strong> ');
  const loadLessonContent=async()=>{
    const {data:dbChapter}=await supabase.from('chapters').select('id,title,category').eq('order_index',chapterIndex).maybeSingle();
    if(!dbChapter)return;
    const {data:dbModule}=await supabase.from('modules').select('id,title,description,duration_minutes').eq('chapter_id',dbChapter.id).eq('order_index',moduleIndex).maybeSingle();
    if(!dbModule)return;
    const {data:sections}=await supabase.from('subchapters').select('id,title,content,order_index').eq('module_id',dbModule.id).order('order_index');
    if(!sections?.length)return;
    const {data:imageRows}=await supabase.from('subchapter_images').select('subchapter_id,image_url,alt_text,caption,position_index,order_index').in('subchapter_id',sections.map(section=>section.id)).order('order_index');
    const images=imageRows||[];
    document.title=`${dbModule.title} — STOA`; document.querySelector('#lesson-title').textContent=dbModule.title;
    document.querySelector('#lesson-copy').innerHTML=`<p class="lesson-introduction">${escapeContent(dbModule.description)}</p>`+sections.map((section,sectionIndex)=>{
      const paragraphs=section.content.split(/\n\s*\n/).filter(Boolean);
      const sectionImages=images.filter(image=>image.subchapter_id===section.id);
      const body=paragraphs.map((paragraph,index)=>{
        const placed=sectionImages.filter(image=>image.position_index===index+1).map(image=>`<figure class="lesson-inline-image"><img src="${escapeContent(image.image_url)}" alt="${escapeContent(image.alt_text||'')}" loading="lazy">${image.caption?`<figcaption>${escapeContent(image.caption)}</figcaption>`:''}</figure>`).join('');
        return `<p>${paragraphMarkup(paragraph)}</p>${placed}`;
      }).join('');
      const remaining=sectionImages.filter(image=>image.position_index>paragraphs.length).map(image=>`<figure class="lesson-inline-image"><img src="${escapeContent(image.image_url)}" alt="${escapeContent(image.alt_text||'')}" loading="lazy"></figure>`).join('');
      const heading=section.title==='Cours'?'':`<span class="eyebrow">${number(sectionIndex+1)}</span><h2>${escapeContent(section.title)}</h2>`;
      return `<section class="lesson-subchapter">${heading}${body}${remaining}</section>`;
    }).join('');
  };
  loadLessonContent();
  document.querySelector('#practice-prompt').textContent=`Quel premier changement concret pourriez-vous essayer autour de « ${module.title.toLowerCase()} » ?`;
  const notes=document.querySelector('#lesson-notes'),noteKey=`stoa-note-${id}`,savedNote=readSaved(noteKey,'');notes.value=typeof savedNote==='string'?savedNote:'';
  notes.addEventListener('input',()=>{document.querySelector('#note-status').textContent=save(noteKey,notes.value)?'Notes enregistrées sur cet appareil.':'Le navigateur ne permet pas l’enregistrement.';});
  const completeButton=document.querySelector('#complete-module');
  const updateCompletion=()=>{const done=completed.has(id);completeButton.innerHTML=done?'Terminé — annuler <span>↶</span>':'Marquer comme terminé <span>✓</span>';completeButton.setAttribute('aria-pressed',String(done));};updateCompletion();
  completeButton.addEventListener('click',()=>{completed.has(id)?completed.delete(id):completed.add(id);const saved=save('stoa-progress',[...completed]);persistModuleProgress(id,completed.has(id));updateCompletion();renderNav();document.querySelector('#completion-status').textContent=saved?(completed.has(id)?'Module terminé. Votre progression est enregistrée.':'Ce module est de nouveau à découvrir.'):'Progression modifiée pour cette session.';});
  const nextIndex=allModules.findIndex(item=>item.id===id)+1,nextLink=document.querySelector('#next-module');
  if(nextIndex<allModules.length){const next=allModules[nextIndex];nextLink.href=`/module?chapitre=${next.chapterIndex+1}&module=${next.moduleIndex+1}`;}else nextLink.innerHTML='Retour à mon académie <span>→</span>';
  syncRemoteProgress().then(()=>{renderNav();updateCompletion();});
}
