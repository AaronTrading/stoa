import { supabase } from './supabase.js';

const body=document.body;

const icon=(name)=>({home:'<path d="M4 11 12 4l8 7v9h-6v-6h-4v6H4Z"/>',route:'<path d="M6 19c4-1 1-7 6-7s2-6 6-7"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/>',academy:'<path d="M4 5h6a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H4Zm16 0h-4a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h4Z"/>',community:'<path d="M16 18c2.5 0 4-1.2 4-3s-1.5-3-4-3-4 1.2-4 3 1.5 3 4 3ZM8 12c2.2 0 3.5-1.2 3.5-3S10.2 6 8 6 4.5 7.2 4.5 9 5.8 12 8 12Zm0 2c-3.3 0-6 1.7-6 4v1h9"/>',shop:'<path d="M5 8h14l-1 12H6Zm3 0V6a4 4 0 0 1 8 0v2"/>',map:'<path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2Zm5-2v13m8-10v13"/>',scanner:'<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4M8 12h8"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',moon:'<path d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z"/>',profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21c.5-5 3-7 8-7s7.5 2 8 7"/>',chevron:'<path d="m9 6 6 6-6 6"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',collapse:'<path d="m14 7-5 5 5 5"/>',back:'<path d="m15 18-6-6 6-6"/>'}[name]||'');
const svg=(name)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icon(name)}</svg>`;
const esc=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const path=location.pathname.replace(/\.html$/,'')||'/';
const chapterParam=Math.max(1,Number(new URLSearchParams(location.search).get('chapitre'))||1);
const moduleParam=Math.max(1,Number(new URLSearchParams(location.search).get('module'))||1);
const primary=[
  ['/academie','Accueil','home','home'],['/parcours','Mon parcours','route','journey'],['/academie#piliers','Académie','academy','academy'],
  ['/posts','Communauté','community','community'],['/boutique','Boutique','shop','shop'],['/carte','Carte','map','map'],['/scanner','Scanner','scanner','scanner'],['/','Site web','globe','website']
];

const shell=document.createElement('div');
shell.className='academy-shell-ui';
shell.innerHTML=`<button class="academy-mobile-menu" type="button" aria-label="Ouvrir le menu" aria-expanded="false">${svg('menu')}<img src="/assets/branding/fondtransparent.png" alt="STOA"></button><div class="academy-sidebar-backdrop"></div><aside class="academy-sidebar" aria-label="Navigation Académie"><div class="academy-sidebar-brand"><a href="/academie" aria-label="Accueil de l’Académie"><img src="/assets/branding/fondtransparent.png" alt="STOA"></a><div class="academy-sidebar-controls"><button class="academy-theme-toggle" type="button" aria-label="Activer le thème sombre" aria-pressed="false">${svg('moon')}</button><button class="academy-sidebar-close" type="button" aria-label="Fermer le menu">${svg('close')}</button></div></div><nav class="academy-primary-nav">${primary.map(([href,label,iconName,key])=>`<a href="${href}" data-nav="${key}">${svg(iconName)}<span>${label}</span></a>`).join('')}</nav><section class="academy-tree"><div class="academy-tree-title"><span>MES PILIERS</span><button type="button" data-tree-toggle aria-label="Replier les piliers">−</button></div><div data-pillar-tree><div class="academy-tree-loading"></div><div class="academy-tree-loading short"></div></div></section><a class="academy-return-reading" data-return-reading hidden>${svg('back')}<span><small>Revenir à</small><strong>votre lecture</strong></span></a><a class="academy-profile-compact" href="/profil"><span class="academy-profile-avatar" data-auth-avatar>S</span><span><strong data-shell-profile-name>Votre profil</strong><small data-shell-profile-meta>Progression · Paramètres</small></span>${svg('chevron')}</a><button class="academy-collapse" type="button" aria-label="Réduire la barre latérale">${svg('collapse')}<span>Réduire</span></button></aside>`;
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
sidebar.addEventListener('click',event=>{if(event.target.closest('a')&&matchMedia('(max-width: 900px)').matches)setMobile(false);});
let touchStart=0;sidebar.addEventListener('touchstart',event=>{touchStart=event.touches[0].clientX},{passive:true});sidebar.addEventListener('touchend',event=>{if(touchStart-event.changedTouches[0].clientX>65)setMobile(false)},{passive:true});
document.addEventListener('keydown',event=>{if(event.key==='Escape')setMobile(false)});

const collapsed=localStorage.getItem('stoa-sidebar-collapsed')==='1';body.classList.toggle('academy-sidebar-collapsed',collapsed);
shell.querySelector('.academy-collapse').addEventListener('click',()=>{const value=!body.classList.contains('academy-sidebar-collapsed');body.classList.toggle('academy-sidebar-collapsed',value);localStorage.setItem('stoa-sidebar-collapsed',value?'1':'0');});
shell.querySelector('[data-tree-toggle]').addEventListener('click',event=>{const closed=shell.querySelector('.academy-tree').classList.toggle('tree-closed');event.currentTarget.textContent=closed?'+':'−';});

const activeKey=path==='/posts'||path==='/communaute'?'community':path==='/boutique'?'shop':path==='/carte'?'map':path==='/scanner'?'scanner':path==='/parcours'?'journey':path==='/academie'?(location.hash==='#piliers'?'academy':'home'):path==='/module'?'academy':path==='/profil'?'profile':'';
shell.querySelector(`[data-nav="${activeKey}"]`)?.classList.add('active');
if(path==='/communaute'||path==='/posts'){
  const sub=document.createElement('div');sub.className='academy-community-subnav';sub.innerHTML=`<a href="/posts" class="${path==='/posts'?'active':''}">Posts</a><a href="/communaute" class="${path==='/communaute'?'active':''}">Chat</a>`;
  shell.querySelector('[data-nav="community"]').after(sub);
}

const returnLink=shell.querySelector('[data-return-reading]');
const readReturn=()=>{try{return JSON.parse(localStorage.getItem('stoa-return-reading')||'null')}catch{return null}};
const returnState=readReturn();
if(returnState&&Date.now()-returnState.savedAt<7*864e5&&path!=='/module'){returnLink.href=returnState.url;returnLink.hidden=false;returnLink.querySelector('strong').textContent=returnState.title||'votre lecture';}
document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(path!=='/module'||!link)return;const url=new URL(link.href,location.href);if(!['/communaute','/posts'].includes(url.pathname))return;localStorage.setItem('stoa-return-reading',JSON.stringify({url:location.pathname+location.search,title:document.querySelector('#lesson-title')?.textContent||'votre lecture',savedAt:Date.now()}));},true);

const breadcrumb=document.createElement('nav');breadcrumb.className='academy-breadcrumbs';breadcrumb.setAttribute('aria-label','Fil d’Ariane');
const main=document.querySelector('main');if(main)main.prepend(breadcrumb);

let sessionUser,profile,catalog=[],learningStates=[];
const roman=['I','II','III','IV','V'];
const renderBreadcrumb=()=>{
  const chapter=catalog[chapterParam-1],pillar=chapter?.pillar;
  const bits=[['/academie','Académie']];
  if(path==='/module'&&chapter){bits.push([`/academie?chapitre=${chapterParam}`,pillar?.title||'Pilier'],[`/academie?chapitre=${chapterParam}`,chapter.title],[location.href,chapter.modules?.[moduleParam-1]?.title||'Module']);}
  else if(path==='/academie'&&new URLSearchParams(location.search).has('chapitre')&&chapter){bits.push([`/academie?chapitre=${chapterParam}`,pillar?.title||'Pilier'],[`/academie?chapitre=${chapterParam}`,chapter.title]);}
  else if(path==='/posts')bits.push(['/posts','Communauté'],['/posts','Posts']);
  else if(path==='/communaute')bits.push(['/posts','Communauté'],['/communaute','Chat']);
  else if(path==='/profil')bits.push(['/profil','Profil']);
  else if(path==='/boutique')bits.push(['/boutique','Boutique']);
  else if(path==='/parcours')bits.push(['/parcours','Mon parcours']);
  breadcrumb.innerHTML=bits.map(([href,label],index)=>`${index?'<span>›</span>':''}<a href="${href}" ${index===bits.length-1?'aria-current="page"':''}>${esc(label)}</a>`).join('');
  breadcrumb.hidden=bits.length===1;
};

const renderTree=()=>{
  const tree=shell.querySelector('[data-pillar-tree]');
  const groups=[...new Map(catalog.map(chapter=>[chapter.pillar?.id,chapter.pillar])).values()].filter(Boolean).sort((a,b)=>a.order_index-b.order_index);
  tree.innerHTML=groups.map((pillar,index)=>{
    const chapters=catalog.filter(chapter=>chapter.pillar_id===pillar.id),active=chapters.some(chapter=>chapter.order_index===chapterParam-1)&&(path==='/module'||path==='/academie');
    return `<details class="academy-tree-pillar" ${active?'open':''}><summary><span>${roman[index]||index+1}</span><strong>${esc(pillar.title)}</strong>${svg('chevron')}</summary><div>${chapters.map(chapter=>`<a href="/academie?chapitre=${chapter.order_index+1}" class="${active&&chapter.order_index===chapterParam-1?'active':''}"><i></i><span>${esc(chapter.title)}</span></a>`).join('')}</div></details>`;
  }).join('');
};

const publishState=()=>{window.__STOA_LEARNING_STATES__=learningStates;window.dispatchEvent(new CustomEvent('stoa:learning-state',{detail:learningStates}));};

async function hydrate(){
  sessionUser=(await supabase.auth.getSession()).data.session?.user;
  if(!sessionUser){shell.querySelector('[data-pillar-tree]').innerHTML='<a class="academy-tree-guest" href="/#connexion">Connectez-vous pour ouvrir vos piliers →</a>';shell.querySelector('.academy-profile-compact').href='/#connexion';shell.querySelector('[data-shell-profile-name]').textContent='Espace membre';return;}
  const [{data:profileRow},{data:chapters},{data:states},{data:progressRows}]=await Promise.all([
    supabase.from('profiles').select('first_name,last_name,full_name,username,avatar_url,role').eq('id',sessionUser.id).maybeSingle(),
    supabase.from('chapters').select('id,title,order_index,pillar_id,pillar:pillars(id,title,order_index),modules(id,title,order_index,is_visible)').eq('is_visible',true).order('order_index'),
    supabase.from('user_learning_state').select('*').eq('user_id',sessionUser.id).order('last_read_at',{ascending:false}),
    supabase.from('user_progress').select('module_id,status').eq('user_id',sessionUser.id).eq('status','completed')
  ]);
  profile=profileRow;catalog=(chapters||[]).map(chapter=>({...chapter,modules:(chapter.modules||[]).filter(module=>module.is_visible!==false).sort((a,b)=>a.order_index-b.order_index)}));learningStates=states||[];
  renderTree();renderBreadcrumb();publishState();
  const name=profile?.username||profile?.first_name||profile?.full_name||sessionUser.email?.split('@')[0]||'Membre';shell.querySelector('[data-shell-profile-name]').textContent=name;
  const total=catalog.reduce((sum,chapter)=>sum+chapter.modules.length,0),done=(progressRows||[]).length;shell.querySelector('[data-shell-profile-meta]').textContent=`${done}/${total} modules · Paramètres`;
  const avatar=shell.querySelector('.academy-profile-avatar'),url=profile?.avatar_url||sessionUser.user_metadata?.avatar_url||sessionUser.user_metadata?.picture||'';avatar.textContent=url?'':name[0].toUpperCase();avatar.style.backgroundImage=url?`url("${url.replaceAll('"','%22')}")`:'';avatar.classList.toggle('has-image',Boolean(url));
  if(path==='/module')setupReadingState();
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
  let timer;addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(()=>saveState(),450)},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)saveState(true)});setInterval(()=>saveState(),15000);
  saveState(true);
}

hydrate();
