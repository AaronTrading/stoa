import {supabase} from './supabase.js';

const protectedRoutes=new Set(['/accueil','/academie','/module','/parcours']);
const path=location.pathname.replace(/\.html$/,'')||'/';
const session=(await supabase.auth.getSession()).data.session;
if(session&&protectedRoutes.has(path))initialize(session.user);

async function initialize(user){
  const {data:profile}=await supabase.from('profiles').select('role,username').eq('id',user.id).maybeSingle();
  if(profile?.role==='admin')return;
  const main=document.querySelector('main');if(!main)return;
  document.documentElement.classList.add('academy-content-protected');
  main.classList.add('academy-paid-content');
  main.dataset.protectionMark=`${profile?.username?`@${profile.username}`:user.email||'Membre'} · STOA`;
  let toast;
  const editable=target=>target instanceof Element&&Boolean(target.closest('input,textarea,select,[contenteditable="true"]'));
  const inPaidContent=target=>target instanceof Element&&Boolean(target.closest('.academy-paid-content'));
  const notify=message=>{toast?.remove();toast=document.createElement('div');toast.className='content-protection-toast';toast.setAttribute('role','status');toast.textContent=message;document.body.append(toast);setTimeout(()=>toast?.remove(),2200)};
  const prevent=event=>{event.preventDefault();notify('Ce contenu est réservé aux membres STOA.')};
  document.addEventListener('contextmenu',event=>{if(inPaidContent(event.target)&&!editable(event.target))prevent(event)});
  document.addEventListener('selectstart',event=>{if(inPaidContent(event.target)&&!editable(event.target))event.preventDefault()});
  document.addEventListener('dragstart',event=>{if(inPaidContent(event.target)&&!editable(event.target))event.preventDefault()});
  document.addEventListener('copy',event=>{const anchor=getSelection()?.anchorNode?.parentElement;if(inPaidContent(anchor)&&!editable(anchor))prevent(event)});
  document.addEventListener('cut',event=>{if(inPaidContent(event.target)&&!editable(event.target))prevent(event)});
  document.addEventListener('keydown',event=>{
    const key=event.key.toLowerCase(),modifier=event.ctrlKey||event.metaKey;
    const browserAction=modifier&&['s','p','u'].includes(key);
    const developerAction=event.key==='F12'||modifier&&event.shiftKey&&['i','j','c','k'].includes(key);
    const contentAction=modifier&&['a','c','x'].includes(key)&&inPaidContent(event.target)&&!editable(event.target);
    if(browserAction||developerAction||contentAction)prevent(event);
    if(event.key==='PrintScreen'){
      main.classList.add('capture-obscured');notify('Les captures du contenu de l’Académie ne sont pas autorisées.');setTimeout(()=>main.classList.remove('capture-obscured'),1200);
    }
  });
  document.querySelectorAll('.academy-paid-content img').forEach(image=>image.draggable=false);
  let robots=document.querySelector('meta[name="robots"]');if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.append(robots)}robots.content='noindex,nofollow,noarchive';
}
