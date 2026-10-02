import { supabase } from './supabase.js';
import { loadMemberSnapshot } from './member-data.js';
import './support-widget.js';

const body=document.body;

const icon=(name)=>({home:'<path d="M4 11 12 4l8 7v9h-6v-6h-4v6H4Z"/>',route:'<path d="M6 19c4-1 1-7 6-7s2-6 6-7"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/>',academy:'<path d="M4 5h6a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H4Zm16 0h-4a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h4Z"/>',community:'<path d="M16 18c2.5 0 4-1.2 4-3s-1.5-3-4-3-4 1.2-4 3 1.5 3 4 3ZM8 12c2.2 0 3.5-1.2 3.5-3S10.2 6 8 6 4.5 7.2 4.5 9 5.8 12 8 12Zm0 2c-3.3 0-6 1.7-6 4v1h9"/>',shop:'<path d="M5 8h14l-1 12H6Zm3 0V6a4 4 0 0 1 8 0v2"/>',map:'<path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2Zm5-2v13m8-10v13"/>',scanner:'<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4M8 12h8"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',moon:'<path d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z"/>',profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21c.5-5 3-7 8-7s7.5 2 8 7"/>',chevron:'<path d="m9 6 6 6-6 6"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',collapse:'<path d="m14 7-5 5 5 5"/>',back:'<path d="m15 18-6-6 6-6"/>'}[name]||'');
const svg=(name)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icon(name)}</svg>`;
const esc=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const sentenceCase=(value='')=>{const text=String(value).trim().toLocaleLowerCase('fr-FR');return text?text[0].toLocaleUpperCase('fr-FR')+text.slice(1):text;};
const path=location.pathname.replace(/\.html$/,'')||'/';
const chapterParam=Math.max(1,Number(new URLSearchParams(location.search).get('chapitre'))||1);
const moduleParam=Math.max(1,Number(new URLSearchParams(location.search).get('module'))||1);
const mobilePageLabel=path==='/module'?'Leçon':path==='/parcours'?'Mon parcours':path==='/posts'||path==='/communaute'?'Communauté':path==='/profil'?'Profil':path==='/boutique'?'Boutique':path==='/glossaire'?'Glossaire':path==='/carte'?'Carte':path==='/scanner'?'Scanner':path==='/academie'?'Académie':'Accueil';
const primary=[
  ['/accueil','Accueil','home','home'],['/academie','Académie','academy','academy'],
  ['/parcours','Mon parcours','route','journey'],['/posts','Communauté','community','community']
];

const shell=document.createElement('div');
shell.className='academy-shell-ui';
shell.innerHTML=`<button class="academy-mobile-menu" type="button" aria-label="Ouvrir le menu Académie" aria-expanded="false">${svg('menu')}<img src="/assets/branding/fondtransparent.png" alt="STOA"><span>${mobilePageLabel}</span></button><div class="academy-sidebar-backdrop"></div><aside class="academy-sidebar" aria-label="Navigation Académie"><div class="academy-sidebar-brand"><a href="/" aria-label="Retourner au site STOA"><img src="/assets/branding/fondtransparent.png" alt="STOA"></a><div class="academy-sidebar-controls"><button class="academy-theme-toggle" type="button" aria-label="Activer le thème sombre" aria-pressed="false">${svg('moon')}</button><button class="academy-sidebar-close" type="button" aria-label="Fermer le menu">${svg('close')}</button></div></div><form class="academy-global-search" role="search"><label class="sr-only" for="academy-global-search-input">Rechercher dans STOA</label>${svg('search')}<input id="academy-global-search-input" type="search" autocomplete="off" placeholder="Rechercher dans STOA…"><div class="academy-search-results" hidden></div></form><nav class="academy-primary-nav">${primary.map(([href,label,iconName,key])=>`<a href="${href}" data-nav="${key}">${svg(iconName)}<span>${label}</span></a>`).join('')}</nav><section class="academy-tree"><div class="academy-tree-title"><span>PARCOURS</span><button type="button" data-tree-toggle aria-label="Replier les piliers">−</button></div><div data-pillar-tree><div class="academy-tree-loading"></div><div class="academy-tree-loading short"></div></div></section><section class="academy-resources" aria-label="Ressources"><div class="academy-resources-title">RESSOURCES</div><nav><a href="/glossaire"><span>Glossaire</span></a><a href="/carte?membre=1"><span>Carte</span></a><a href="/scanner?membre=1"><span>Scanner</span></a></nav></section><a class="academy-shop-link" href="/boutique">${svg('shop')}<span>Boutique</span>${svg('chevron')}</a><a class="academy-profile-compact" href="/profil"><span class="academy-profile-avatar" data-auth-avatar>S</span><span><strong data-shell-profile-name>Votre profil</strong><small data-shell-profile-meta>Profil & paramètres</small></span>${svg('chevron')}</a><button class="academy-collapse" type="button" aria-label="Réduire la barre latérale">${svg('collapse')}<span>Réduire</span></button></aside>`;
body.prepend(shell);
body.classList.add('academy-experience');

const themeButton=shell.querySelector('.academy-theme-toggle');
const setTheme=(dark)=>{document.documentElement.classList.toggle('stoa-dark',dark);themeButton.setAttribute('aria-pressed',String(dark));themeButton.setAttribute('aria-label',dark?'Activer le thème clair':'Activer le thème sombre');};
setTheme(localStorage.getItem('stoa-theme')==='dark');
themeButton.addEventListener('click',()=>{const dark=!document.documentElement.classList.contains('stoa-dark');localStorage.setItem('stoa-theme',dark?'dark':'light');setTheme(dark);});

const sidebar=shell.querySelector('.academy-sidebar'),backdrop=shell.querySelector('.academy-sidebar-backdrop'),menu=shell.querySelector('.academy-mobile-menu');
const setMobile=(open)=>{body.classList.toggle('academy-menu-open',open);menu.setAttribute('aria-expanded',String(open));};
menu.addEventListener('click',()=>setMobile(true));
backdrop.addEventListener('click',()=>setMobile(false));
shell.querySelector('.academy-sidebar-close').addEventListener('click',()=>setMobile(false));
sidebar.addEventListener('click',event=>{if(event.target.closest('a')&&matchMedia('(max-width: 1120px)').matches)setMobile(false);});
let touchStart=0;sidebar.addEventListener('touchstart',event=>{touchStart=event.touches[0].clientX},{passive:true});sidebar.addEventListener('touchend',event=>{if(touchStart-event.changedTouches[0].clientX>65)setMobile(false)},{passive:true});
document.addEventListener('keydown',event=>{if(event.key==='Escape')setMobile(false)});

const collapsed=localStorage.getItem('stoa-sidebar-collapsed')==='1';body.classList.toggle('academy-sidebar-collapsed',collapsed);
shell.querySelector('.academy-collapse').addEventListener('click',()=>{const value=!body.classList.contains('academy-sidebar-collapsed');body.classList.toggle('academy-sidebar-collapsed',value);localStorage.setItem('stoa-sidebar-collapsed',value?'1':'0');});
shell.querySelector('[data-tree-toggle]').addEventListener('click',event=>{const closed=shell.querySelector('.academy-tree').classList.toggle('tree-closed');event.currentTarget.textContent=closed?'+':'−';});

const activeKey=path==='/posts'||path==='/communaute'?'community':path==='/parcours'?'journey':path==='/accueil'?'home':path==='/academie'||path==='/module'?'academy':path==='/profil'?'profile':'';
shell.querySelector(`[data-nav="${activeKey}"]`)?.classList.add('active');
if(activeKey==='profile')shell.querySelector('.academy-profile-compact')?.classList.add('active');
if(path==='/boutique')shell.querySelector('.academy-shop-link')?.classList.add('active');
const updateCommunityBadge=(counts={})=>{const link=shell.querySelector('[data-nav="community"]'),total=Object.values(counts).reduce((sum,value)=>sum+Number(value||0),0);let badge=link.querySelector('.academy-unread-badge');if(total&&!badge){badge=document.createElement('b');badge.className='academy-unread-badge';link.append(badge);}if(badge){badge.textContent=total>99?'99+':String(total);badge.hidden=!total;}};
updateCommunityBadge(window.__STOA_COMMUNITY_NOTIFICATION_COUNTS__||{});window.addEventListener('stoa:community-notifications',event=>updateCommunityBadge(event.detail));

const breadcrumb=document.createElement('nav');breadcrumb.className='academy-breadcrumbs';breadcrumb.setAttribute('aria-label','Fil d’Ariane');
const main=document.querySelector('main');if(main)main.prepend(breadcrumb);

let sessionUser,profile,catalog=[],learningStates=[];
const roman=['I','II','III','IV','V'];
const renderBreadcrumb=()=>{
  const chapter=catalog[chapterParam-1],pillar=chapter?.pillar;
  const bits=path==='/accueil'?[['/accueil','Accueil']]:[['/academie','Académie']];
  if(path==='/module'&&chapter){bits.push([`/academie?chapitre=${chapterParam}`,sentenceCase(pillar?.title||'Pilier')],[`/academie?chapitre=${chapterParam}`,chapter.title],[location.href,chapter.modules?.[moduleParam-1]?.title||'Leçon']);}
  else if(path==='/academie'&&new URLSearchParams(location.search).has('chapitre')&&chapter){bits.push([`/academie?chapitre=${chapterParam}`,sentenceCase(pillar?.title||'Pilier')],[`/academie?chapitre=${chapterParam}`,chapter.title]);}
  else if(path==='/posts')bits.push(['/posts','Communauté'],['/posts','Posts']);
  else if(path==='/communaute')bits.push(['/posts','Communauté'],['/communaute','Discussion']);
  else if(path==='/profil')bits.push(['/profil','Profil & compte']);
  else if(path==='/boutique')bits.push(['/boutique','Boutique']);
  else if(path==='/parcours')bits.push(['/parcours','Mon parcours']);
  else if(path==='/glossaire')bits.push(['/glossaire','Ressources'],['/glossaire','Glossaire']);
  else if(path==='/carte')bits.push(['/carte','Ressources'],['/carte','Carte']);
  else if(path==='/scanner')bits.push(['/scanner?membre=1','Ressources'],['/scanner?membre=1','Scanner']);
  breadcrumb.innerHTML=bits.map(([href,label],index)=>`${index?'<span>›</span>':''}<a href="${href}" ${index===bits.length-1?'aria-current="page"':''}>${esc(label)}</a>`).join('');
  breadcrumb.hidden=bits.length===1;
};

const renderTree=()=>{
  const tree=shell.querySelector('[data-pillar-tree]');
  const groups=[...new Map(catalog.map(chapter=>[chapter.pillar?.id,chapter.pillar])).values()].filter(Boolean).sort((a,b)=>a.order_index-b.order_index);
  tree.innerHTML=groups.map((pillar,index)=>{
    const chapters=catalog.filter(chapter=>chapter.pillar_id===pillar.id),active=chapters.some(chapter=>chapter.order_index===chapterParam-1)&&(path==='/module'||path==='/academie');
    return `<details class="academy-tree-pillar" ${active?'open':''}><summary><span>${roman[index]||index+1}</span><strong>${esc(sentenceCase(pillar.title))}</strong>${svg('chevron')}</summary><div>${chapters.map(chapter=>`<a href="/academie?chapitre=${chapter.order_index+1}" class="${active&&chapter.order_index===chapterParam-1?'active':''}"><i></i><span>${esc(chapter.title)}</span></a>`).join('')}</div></details>`;
  }).join('');
};

const publishState=()=>{window.__STOA_LEARNING_STATES__=learningStates;window.dispatchEvent(new CustomEvent('stoa:learning-state',{detail:learningStates}));};

async function hydrate(){
  sessionUser=(await supabase.auth.getSession()).data.session?.user;
  if(!sessionUser){shell.querySelector('[data-pillar-tree]').innerHTML='<a class="academy-tree-guest" href="/#connexion">Connectez-vous pour ouvrir vos piliers →</a>';shell.querySelector('.academy-profile-compact').href='/#connexion';shell.querySelector('[data-shell-profile-name]').textContent='Espace membre';setupGlobalSearch();return;}
  const [{data:profileRow},snapshot]=await Promise.all([
    supabase.from('profiles').select('first_name,last_name,full_name,username,avatar_url,role').eq('id',sessionUser.id).maybeSingle(),
    loadMemberSnapshot(sessionUser.id)
  ]);
  profile=profileRow;catalog=snapshot.chapters.map(chapter=>({...chapter,modules:chapter.lessons}));learningStates=snapshot.states;
  renderTree();renderBreadcrumb();publishState();
  const name=profile?.username||profile?.first_name||profile?.full_name||sessionUser.email?.split('@')[0]||'Membre';shell.querySelector('[data-shell-profile-name]').textContent=name;
  shell.querySelector('[data-shell-profile-meta]').textContent='Profil & parcours';
  const avatar=shell.querySelector('.academy-profile-avatar'),url=profile?.avatar_url||sessionUser.user_metadata?.avatar_url||sessionUser.user_metadata?.picture||'';avatar.textContent=url?'':name[0].toUpperCase();avatar.style.backgroundImage=url?`url("${url.replaceAll('"','%22')}")`:'';avatar.classList.toggle('has-image',Boolean(url));
  if(path==='/module')setupReadingState();
  setupGlobalSearch();
}

function setupGlobalSearch(){
  const form=shell.querySelector('.academy-global-search'),input=form.querySelector('input'),results=form.querySelector('.academy-search-results');
  const lessons=catalog.flatMap(chapter=>(chapter.modules||[]).map(module=>({module,chapter})));
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const destinations=[
    {title:'Mon parcours',meta:'Progression, dernières lectures et cours terminés',href:'/parcours',keywords:'progression parcours avancement cours lecons terminees derniere lecture'},
    {title:'Carte du lait cru',meta:'Producteurs et points de vente autour de moi',href:'/carte?membre=1',keywords:'lait cru carte ferme producteur autour de moi geolocalisation'},
    {title:'Scanner un produit',meta:'Code-barres et lecture nutritionnelle',href:'/scanner?membre=1',keywords:'scanner produit code barre nutrition note ingredients'},
    {title:'Communauté',meta:'Publications, annonces, questions et ressources',href:'/posts',keywords:'communaute posts publications annonces questions reussites ressources'},
    {title:'Chat général',meta:'Discussion libre entre les membres',href:'/communaute',keywords:'chat general discussion message parler membres'},
    {title:'Boutique',meta:'Produits sélectionnés par STOA',href:'/boutique',keywords:'boutique produits huile viande commande'},
    {title:'Mon profil',meta:'Compte, pseudo, département et bio',href:'/profil',keywords:'profil compte pseudo departement bio discord email'},
    {title:'Glossaire',meta:'Définitions et notions STOA',href:'/glossaire',keywords:'glossaire definition notions mots vocabulaire'}
  ];
  const search=()=>{const raw=input.value.trim(),query=normalize(raw);if(query.length<2){results.hidden=true;results.replaceChildren();return;}const lessonMatches=lessons.filter(({module,chapter})=>normalize(`${module.title} ${module.description||''} ${chapter.title} ${chapter.description||''} ${chapter.pillar?.title||''}`).includes(query)).slice(0,5).map(({module,chapter})=>({title:module.title,meta:`${chapter.pillar?.title||'Académie'} · ${chapter.title}`,href:`/module?chapitre=${chapter.order_index+1}&module=${module.order_index+1}`}));const pageMatches=destinations.filter(item=>normalize(`${item.title} ${item.meta} ${item.keywords}`).includes(query));const found=[...lessonMatches,...pageMatches].slice(0,7);results.innerHTML=found.length?found.map(item=>`<a href="${item.href}"><strong>${esc(item.title)}</strong><span>${esc(item.meta)}</span></a>`).join(''):`<p class="academy-search-empty">Aucun résultat pour « ${esc(raw)} ».</p>`;results.hidden=false;};
  input.addEventListener('input',search);
  form.addEventListener('submit',event=>{event.preventDefault();const first=results.querySelector('a');if(first)location.href=first.href;else search();});
  document.addEventListener('click',event=>{if(!form.contains(event.target))results.hidden=true;});
}

function setupReadingState(){
  const chapter=catalog[chapterParam-1],module=chapter?.modules[moduleParam-1];if(!module)return;
  let restored=false,lastSave=0;
  const key=`stoa-reading-${module.id}`;
  const remote=learningStates.find(state=>state.module_id===module.id);let local;try{local=JSON.parse(localStorage.getItem(key)||'null')}catch{}
  const state=remote&&(!local||new Date(remote.last_read_at).getTime()>Number(local.savedAt||0))?remote:local;
  const restore=()=>{if(restored)return;const content=document.querySelector('#lesson-copy');if(!content||!content.children.length)return;restored=true;requestAnimationFrame(()=>{const anchor=state?.anchor_id&&document.getElementById(state.anchor_id);if(anchor)window.scrollTo({top:Math.max(0,anchor.offsetTop+Number(state.anchor_offset||0)),behavior:'instant'});else if(state?.scroll_y)window.scrollTo({top:Number(state.scroll_y),behavior:'instant'});});};
  window.addEventListener('stoa:lesson-ready',restore,{once:true});setTimeout(restore,900);
  const snapshot=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight),sections=[...document.querySelectorAll('.lesson-subchapter')];let anchor=sections[0];for(const section of sections){if(section.getBoundingClientRect().top<=150)anchor=section;else break;}return{user_id:sessionUser.id,module_id:module.id,url_path:location.pathname+location.search,scroll_y:Math.max(0,Math.round(scrollY)),progress_ratio:Math.min(1,Math.max(0,scrollY/max)),anchor_id:anchor?.id||null,anchor_offset:anchor?Math.round(scrollY-anchor.offsetTop):0,last_read_at:new Date().toISOString()};};
  const saveState=async(force=false)=>{const state=snapshot();localStorage.setItem(key,JSON.stringify({...state,savedAt:Date.now()}));localStorage.setItem('stoa-last-lesson',JSON.stringify({moduleId:module.id,url:state.url_path,title:module.title,chapter:chapter.title,savedAt:Date.now()}));if(!force&&Date.now()-lastSave<7000)return;lastSave=Date.now();await supabase.from('user_learning_state').upsert(state,{onConflict:'user_id,module_id'});};
  let timer;addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(()=>saveState(),450)},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)saveState(true)});addEventListener('pagehide',()=>saveState(true));setInterval(()=>saveState(),15000);
  saveState(true);
}

hydrate();
