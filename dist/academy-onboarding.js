import {supabase} from './supabase.js';
import {attachDepartmentPicker,departmentCode,departmentLabel} from './departments.js';

const path=location.pathname.replace(/\.html$/,'')||'/';
const allowedPaths=new Set(['/accueil','/academie','/module','/communaute','/posts','/profil','/parcours']);
const stages=['welcome','username','identity','avatar','location','theme','intro','tour_nav','tour_academy','tour_progress','tour_profile','tour_community','community_action','lesson_launch','support','lesson_action','finish'];
const progressStage=stage=>Math.max(0,stages.indexOf(stage));
const esc=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const normalizeUsername=value=>String(value||'').replace(/^@+/,'').trim().toLocaleLowerCase('fr-FR');
const usernamePattern=/^[\p{L}\p{N}._;-]{3,30}$/u;
const reservedUsername=value=>/^membre/u.test(normalizeUsername(value));
const waitFor=(selector,timeout=7000)=>new Promise(resolve=>{const found=document.querySelector(selector);if(found)return resolve(found);const observer=new MutationObserver(()=>{const node=document.querySelector(selector);if(node){observer.disconnect();resolve(node);}});observer.observe(document.documentElement,{subtree:true,childList:true});setTimeout(()=>{observer.disconnect();resolve(document.querySelector(selector));},timeout);});
const session=(await supabase.auth.getSession()).data.session;
if(session&&allowedPaths.has(path))initialize(session.user);

async function initialize(user){
  const [{data:profile},{data:hasAccess}]=await Promise.all([
    supabase.from('profiles').select('role,username,first_name,last_name,full_name,avatar_url,department,location_label,theme_preference,onboarding_completed,onboarding_state').eq('id',user.id).maybeSingle(),
    supabase.rpc('has_active_academy_access',{p_user_id:user.id})
  ]);
  if(!hasAccess||!profile||profile.role==='admin'||profile.onboarding_completed)return;
  let state={stage:'welcome',...(profile.onboarding_state||{})};
  if(!stages.includes(state.stage))state.stage='welcome';
  let root,tourLayer,activeTarget,positionHandler;

  const save=async(patch={},stage)=>{
    state={...state,...patch,...(stage?{stage}:{}),updated_at:new Date().toISOString()};
    const {error}=await supabase.from('profiles').update({onboarding_state:state}).eq('id',user.id);
    if(error)throw error;
  };
  const close=()=>{root?.remove();root=null;clearTour();};
  const shellReady=async()=>{await waitFor('.academy-shell-ui',3500);};
  const route=(url)=>location.assign(url+(url.includes('?')?'&':'?')+'onboarding=1');
  const progress=()=>`<div class="onboarding-progress" aria-label="Progression de l’accueil"><i style="width:${Math.max(5,Math.round((progressStage(state.stage)+1)/stages.length*100))}%"></i></div>`;
  const actions=(primary='Continuer',optional=false)=>`<div class="onboarding-actions">${optional?'<button type="button" class="onboarding-skip" data-onboarding-skip>Passer</button>':''}<button type="submit" class="button dark">${primary} <span>→</span></button></div>`;
  const mount=(content,{form=false,wide=false}={})=>{
    close();root=document.createElement('section');root.className='stoa-onboarding-overlay';root.setAttribute('aria-modal','true');root.setAttribute('role','dialog');root.innerHTML=`<${form?'form':'div'} class="stoa-onboarding-card${wide?' wide':''}">${progress()}${content}</${form?'form':'div'}>`;document.body.append(root);
    requestAnimationFrame(()=>root.querySelector('input,button,select')?.focus());return root.firstElementChild;
  };
  const fail=(card,message)=>{const status=card.querySelector('[data-onboarding-status]');if(status){status.textContent=message;status.dataset.tone='error';}};
  const busy=(card,value)=>{card.querySelectorAll('button,input,select').forEach(node=>node.disabled=value);};

  async function renderFormStage(){
    if(path!=='/accueil')return route('/accueil');
    if(state.stage==='welcome'){
      const card=mount(`<span class="eyebrow">BIENVENUE DANS STOA</span><h1>Votre parcours commence ici.</h1><p>Avant de commencer, prenons quelques secondes pour personnaliser votre espace.</p>${actions('Commencer')}`,{form:true});
      card.addEventListener('submit',async event=>{event.preventDefault();await save({started:true},'username');render();});return;
    }
    if(state.stage==='username'){
      const initialUsername=reservedUsername(profile.username)?'':profile.username||'';
      const card=mount(`<span class="eyebrow">VOTRE IDENTITÉ STOA</span><h2>Comment voulez-vous être appelé ?</h2><p>Votre pseudo sera visible par les autres membres.</p><label class="onboarding-field"><span>Pseudo</span><span class="username-entry"><b>@</b><input name="username" value="${esc(initialUsername)}" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="30" required></span><small data-username-state>3 à 30 caractères, sans espace. « membre » est réservé.</small></label><p data-onboarding-status role="status"></p>${actions('Enregistrer')}`,{form:true});
      const input=card.elements.username,status=card.querySelector('[data-username-state]');let timer,available=false;
      const check=async()=>{input.value=normalizeUsername(input.value);const value=input.value;if(reservedUsername(value)){available=false;status.textContent='Choisissez un vrai pseudo : « membre » est réservé.';status.dataset.tone='error';return;}if(!usernamePattern.test(value)){available=false;status.textContent=value.length<3?'Au moins 3 caractères.':'Utilisez uniquement lettres, chiffres, . ; - ou _.';status.dataset.tone='error';return;}status.textContent='Vérification…';status.dataset.tone='';const {data,error}=await supabase.rpc('is_profile_username_available',{candidate:value});available=Boolean(data&&!error);status.textContent=error?'Vérification indisponible.':available?'Pseudo disponible.':'Ce pseudo est déjà utilisé ou réservé.';status.dataset.tone=available?'success':'error';};
      input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(check,260)});check();card.addEventListener('submit',async event=>{event.preventDefault();await check();if(!available)return input.focus();busy(card,true);const value=normalizeUsername(input.value),{error}=await supabase.from('profiles').update({username:value}).eq('id',user.id);busy(card,false);if(error)return fail(card,error.message);profile.username=value;await save({username_completed:true},'identity');render();});return;
    }
    if(state.stage==='identity'){
      const fallback=(profile.full_name||'').trim().split(/\s+/),first=profile.first_name||fallback.shift()||'',last=profile.last_name||fallback.join(' ');
      const card=mount(`<span class="eyebrow">FAISONS CONNAISSANCE</span><h2>Une expérience à votre nom.</h2><p>Ces informations servent à personnaliser votre parcours.</p><div class="onboarding-field-grid"><label class="onboarding-field"><span>Prénom</span><input name="first_name" value="${esc(first)}" maxlength="60" autocomplete="given-name" required></label><label class="onboarding-field"><span>Nom</span><input name="last_name" value="${esc(last)}" maxlength="80" autocomplete="family-name" required></label></div><p data-onboarding-status role="status"></p>${actions('Continuer')}`,{form:true});
      card.addEventListener('submit',async event=>{event.preventDefault();const firstName=card.elements.first_name.value.trim(),lastName=card.elements.last_name.value.trim();if(!firstName||!lastName)return fail(card,'Renseignez votre prénom et votre nom.');busy(card,true);const {error}=await supabase.from('profiles').update({first_name:firstName,last_name:lastName,full_name:`${firstName} ${lastName}`}).eq('id',user.id);busy(card,false);if(error)return fail(card,error.message);Object.assign(profile,{first_name:firstName,last_name:lastName});await save({name_completed:true},'avatar');render();});return;
    }
    if(state.stage==='avatar')return renderAvatar();
    if(state.stage==='location')return renderLocation();
    if(state.stage==='theme'){
      const selected=profile.theme_preference||localStorage.getItem('stoa-theme')||'light';
      const card=mount(`<span class="eyebrow">APPARENCE</span><h2>Quelle ambiance préférez-vous ?</h2><p>Le choix est appliqué immédiatement et peut être modifié dans votre profil.</p><div class="onboarding-theme-options"><label><input type="radio" name="theme" value="light" ${selected==='light'?'checked':''}><span class="theme-preview light"><i></i><i></i><b>Clair</b></span></label><label><input type="radio" name="theme" value="dark" ${selected==='dark'?'checked':''}><span class="theme-preview dark"><i></i><i></i><b>Sombre</b></span></label></div><p data-onboarding-status role="status"></p>${actions('Découvrir STOA')}`,{form:true});
      const apply=value=>{document.documentElement.classList.toggle('stoa-dark',value==='dark');localStorage.setItem('stoa-theme',value)};card.addEventListener('change',event=>{if(event.target.name==='theme')apply(event.target.value)});apply(selected);
      card.addEventListener('submit',async event=>{event.preventDefault();const value=new FormData(card).get('theme')||selected;busy(card,true);const {error}=await supabase.rpc('set_theme_preference',{p_theme:value});busy(card,false);if(error)return fail(card,error.message);profile.theme_preference=value;await save({theme_completed:true},'intro');render();});return;
    }
    if(state.stage==='intro'){
      const card=mount(`<span class="eyebrow">VOTRE ACADÉMIE</span><h1>Maintenant, découvrons STOA.</h1><p>Votre parcours, votre progression et la communauté sont réunis dans un seul espace.</p>${actions('Découvrir l’Académie')}`,{form:true});
      card.addEventListener('submit',async event=>{event.preventDefault();await save({profile_completed:true},'tour_nav');render();});return;
    }
  }

  function renderAvatar(){
    const card=mount(`<span class="eyebrow">PHOTO DE PROFIL</span><h2>Ajoutez un visage à votre espace.</h2><p>Vous pourrez remplacer cette photo à tout moment.</p><div class="onboarding-avatar-editor"><div class="onboarding-avatar-preview"><canvas width="520" height="520"></canvas><span>${esc((profile.username||profile.first_name||'S')[0].toUpperCase())}</span></div><label class="button" for="onboarding-avatar-file">Choisir une photo</label><input id="onboarding-avatar-file" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" hidden><label class="onboarding-zoom" hidden><span>Ajuster</span><input name="zoom" type="range" min="1" max="3" step=".01" value="1"></label></div><p data-onboarding-status role="status"></p>${actions('Utiliser cette photo',true)}`,{form:true});
    const canvas=card.querySelector('canvas'),ctx=canvas.getContext('2d'),fallback=card.querySelector('.onboarding-avatar-preview span'),file=card.elements.avatar,zoom=card.elements.zoom,zoomLabel=card.querySelector('.onboarding-zoom');let image,objectUrl;
    const draw=()=>{if(!image)return;const size=canvas.width,scale=Math.max(size/image.naturalWidth,size/image.naturalHeight)*Number(zoom.value),width=image.naturalWidth*scale,height=image.naturalHeight*scale;ctx.clearRect(0,0,size,size);ctx.drawImage(image,(size-width)/2,(size-height)/2,width,height)};
    file.addEventListener('change',()=>{const selected=file.files[0];if(!selected)return;if(!/^image\/(jpeg|png|webp)$/.test(selected.type)||selected.size>8*1024*1024){file.value='';return fail(card,'Choisissez une image JPG, PNG ou WebP de moins de 8 Mo.');}if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(selected);image=new Image();image.onload=()=>{fallback.hidden=true;canvas.hidden=false;zoomLabel.hidden=false;draw()};image.src=objectUrl;});zoom.addEventListener('input',draw);
    card.querySelector('[data-onboarding-skip]').addEventListener('click',async()=>{await save({avatar_completed:false},'location');render()});
    card.addEventListener('submit',async event=>{event.preventDefault();if(!image)return fail(card,'Choisissez une photo ou utilisez « Passer ».');busy(card,true);const output=document.createElement('canvas');output.width=output.height=768;const outputContext=output.getContext('2d'),scale=Math.max(768/image.naturalWidth,768/image.naturalHeight)*Number(zoom.value),width=image.naturalWidth*scale,height=image.naturalHeight*scale;outputContext.drawImage(image,(768-width)/2,(768-height)/2,width,height);const blob=await new Promise(resolve=>output.toBlob(resolve,'image/webp',.86));const key=`${user.id}/avatar`,{error:uploadError}=await supabase.storage.from('avatars').upload(key,blob,{contentType:'image/webp',upsert:true});if(uploadError){busy(card,false);return fail(card,uploadError.message);}const publicUrl=`${supabase.storage.from('avatars').getPublicUrl(key).data.publicUrl}?v=${Date.now()}`,{error}=await supabase.from('profiles').update({avatar_url:publicUrl}).eq('id',user.id);busy(card,false);if(error)return fail(card,error.message);profile.avatar_url=publicUrl;await save({avatar_completed:true},'location');if(objectUrl)URL.revokeObjectURL(objectUrl);render();});
  }

  function renderLocation(){
    const type=profile.department?'france':profile.location_label==='À l’étranger'?'abroad':profile.location_label==='Non renseigné'?'none':'';
    const card=mount(`<span class="eyebrow">LOCALISATION</span><h2>D’où venez-vous ?</h2><p>Cette indication reste modifiable depuis votre profil.</p><div class="onboarding-location-types"><label><input type="radio" name="location_type" value="france" ${type==='france'?'checked':''}><span>En France</span></label><label><input type="radio" name="location_type" value="abroad" ${type==='abroad'?'checked':''}><span>À l’étranger</span></label><label><input type="radio" name="location_type" value="none" ${type==='none'?'checked':''}><span>Je préfère ne pas renseigner</span></label></div><label class="onboarding-field" data-department-field><span>Département</span><input id="onboarding-department" name="department" value="${esc(departmentLabel(profile.department||''))}"></label><p data-onboarding-status role="status"></p>${actions('Continuer',true)}`,{form:true});
    const department=card.elements.department,field=card.querySelector('[data-department-field]');attachDepartmentPicker(department);const toggle=()=>{const locationType=new FormData(card).get('location_type');field.hidden=locationType!=='france';if(locationType&&locationType!=='france')department.value='';};card.addEventListener('change',toggle);toggle();
    const commit=async(skip=false)=>{const locationType=skip?'none':new FormData(card).get('location_type');if(!locationType)return fail(card,'Choisissez une option de localisation.');const code=locationType==='france'?departmentCode(department.value):null;if(locationType==='france'&&!code)return fail(card,'Choisissez un département dans la liste.');busy(card,true);const label=locationType==='abroad'?'À l’étranger':locationType==='none'?'Non renseigné':null,{error}=await supabase.from('profiles').update({department:code,location_label:label}).eq('id',user.id);busy(card,false);if(error)return fail(card,error.message);Object.assign(profile,{department:code,location_label:label});await save({location_completed:!skip},'theme');render();};
    card.querySelector('[data-onboarding-skip]').addEventListener('click',()=>commit(true));card.addEventListener('submit',event=>{event.preventDefault();commit(false)});
  }

  const clearTour=()=>{if(positionHandler){removeEventListener('resize',positionHandler);removeEventListener('scroll',positionHandler,true)}tourLayer?.remove();tourLayer=null;activeTarget?.classList.remove('onboarding-target');activeTarget=null;};
  async function spotlight(selector,{eyebrow='DÉCOUVERTE',title,copy,button='Suivant',interactive=false,onNext}={}){
    clearTour();await shellReady();if(matchMedia('(max-width:1120px)').matches&&selector.includes('data-nav')){document.body.classList.add('academy-menu-open');await new Promise(resolve=>setTimeout(resolve,250));}
    const target=await waitFor(selector);if(!target){await onNext?.();return render();}target.scrollIntoView?.({block:'center',behavior:'smooth'});await new Promise(resolve=>setTimeout(resolve,260));activeTarget=target;target.classList.add('onboarding-target');tourLayer=document.createElement('section');tourLayer.className=`stoa-tour-layer${interactive?' interactive':''}`;tourLayer.innerHTML=`<div class="tour-shade top"></div><div class="tour-shade left"></div><div class="tour-shade right"></div><div class="tour-shade bottom"></div><div class="stoa-tour-card" role="dialog" aria-modal="true"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2><p>${copy}</p>${interactive?'<small>Cette étape se valide automatiquement.</small>':`<div><button type="button" class="button dark" data-tour-next>${button} <span>→</span></button></div>`}</div>`;document.body.append(tourLayer);
    const position=()=>{if(!target.isConnected)return;const rect=target.getBoundingClientRect(),gap=10,left=Math.max(0,rect.left-gap),top=Math.max(0,rect.top-gap),right=Math.min(innerWidth,rect.right+gap),bottom=Math.min(innerHeight,rect.bottom+gap),shades=tourLayer.querySelectorAll('.tour-shade');Object.assign(shades[0].style,{left:'0',top:'0',width:'100%',height:`${top}px`});Object.assign(shades[1].style,{left:'0',top:`${top}px`,width:`${left}px`,height:`${bottom-top}px`});Object.assign(shades[2].style,{left:`${right}px`,top:`${top}px`,width:`${Math.max(0,innerWidth-right)}px`,height:`${bottom-top}px`});Object.assign(shades[3].style,{left:'0',top:`${bottom}px`,width:'100%',height:`${Math.max(0,innerHeight-bottom)}px`});const card=tourLayer.querySelector('.stoa-tour-card'),below=bottom+16,cardHeight=card.offsetHeight||190;card.style.left=`${Math.min(Math.max(12,left),Math.max(12,innerWidth-card.offsetWidth-12))}px`;card.style.top=`${below+cardHeight<innerHeight?below:Math.max(12,top-cardHeight-16)}px`;};positionHandler=position;addEventListener('resize',position);addEventListener('scroll',position,true);requestAnimationFrame(position);
    tourLayer.querySelector('[data-tour-next]')?.addEventListener('click',async()=>{clearTour();await onNext?.();render()});
  }

  async function renderTourStage(){
    if(state.stage==='tour_nav'){if(path!=='/accueil')return route('/accueil');return spotlight(matchMedia('(max-width:1120px)').matches?'.academy-mobile-menu':'.academy-sidebar',{title:'Tout STOA, à portée de main.',copy:'Votre Académie, la communauté, votre profil et les outils restent accessibles depuis cette navigation.',onNext:()=>save({},'tour_academy')});}
    if(state.stage==='tour_academy'){if(path!=='/accueil')return route('/accueil');return spotlight('[data-nav="academy"]',{title:'Votre parcours structuré.',copy:'Les cinq piliers, leurs chapitres et chaque leçon se trouvent ici.',onNext:()=>save({},'tour_progress')});}
    if(state.stage==='tour_progress'){if(path!=='/accueil')return route('/accueil');document.body.classList.remove('academy-menu-open');return spotlight('.home-summary',{title:'Une progression qui vous suit.',copy:'Chaque leçon terminée et votre dernière lecture sont enregistrées automatiquement.',onNext:()=>save({},'tour_profile')});}
    if(state.stage==='tour_profile'){if(path!=='/accueil')return route('/accueil');return spotlight(matchMedia('(max-width:1120px)').matches?'.academy-mobile-menu':'.academy-profile-compact',{title:'Un espace à votre image.',copy:'Votre profil rassemble vos préférences, votre abonnement et votre parcours.',onNext:()=>save({tour_completed:true},'tour_community')});}
    if(state.stage==='tour_community'){if(path!=='/accueil')return route('/accueil');return spotlight('[data-nav="community"]',{title:'Entrez dans la communauté.',copy:'Vous pouvez discuter librement avec les autres membres de STOA.',button:'Ouvrir la communauté',onNext:async()=>{await save({},'community_action');route('/communaute')}});}
    if(state.stage==='community_action'){
      if(path!=='/communaute')return route('/communaute');await spotlight('#message-form',{eyebrow:'PREMIER PAS',title:'Présentez-vous.',copy:'Écrivez puis envoyez un premier message. Cette étape se validera dès sa publication.',interactive:true});
      addEventListener('stoa:community-message-sent',async()=>{clearTour();await save({first_message_completed:true},'lesson_launch');route('/accueil')},{once:true});return;
    }
    if(state.stage==='lesson_launch'){
      if(path!=='/accueil')return route('/accueil');return spotlight('#home-next-link',{eyebrow:'VOTRE PREMIÈRE LEÇON',title:'Il est temps de commencer.',copy:'Votre première leçon vous attend ici. Vous allez l’ouvrir réellement.',button:'Commencer ma première leçon',onNext:async()=>{const link=document.querySelector('#home-next-link'),url=link?.getAttribute('href')||'/academie';await save({lesson_url:url},'support');route(url)}});
    }
    if(state.stage==='support'){
      if(path!=='/module')return route(state.lesson_url||'/academie');await spotlight('.support-trigger',{eyebrow:'L’ÉQUIPE STOA',title:'Une question ?',copy:'Ouvrez réellement le support pour découvrir où poser vos questions.',interactive:true});addEventListener('stoa:support-opened',async()=>{clearTour();await save({support_opened:true},'lesson_action');render()},{once:true});return;
    }
    if(state.stage==='lesson_action'){
      if(path!=='/module')return route(state.lesson_url||'/academie');await spotlight('#complete-module',{eyebrow:'1 / 1 — PREMIÈRE LEÇON',title:'Lisez à votre rythme.',copy:'Quand vous avez terminé, utilisez ce bouton. Votre progression sera alors enregistrée.',interactive:true});const button=await waitFor('#complete-module');if(button?.getAttribute('aria-pressed')==='true')return finishLesson();addEventListener('stoa:lesson-completed',finishLesson,{once:true});
    }
  }
  async function finishLesson(){clearTour();await save({first_lesson_completed:true},'finish');render();}
  async function finish(){
    if(path!=='/module'&&path!=='/accueil')return route('/accueil');const card=mount(`<span class="onboarding-success" aria-hidden="true">✓</span><span class="eyebrow">PREMIÈRE ÉTAPE ACCOMPLIE</span><h1>Bienvenue chez STOA.</h1><p>Votre espace est prêt. Vous venez de commencer votre parcours.</p><div class="onboarding-finish-profile">${profile.avatar_url?`<img src="${esc(profile.avatar_url)}" alt="">`:`<span>${esc((profile.username||'S')[0].toUpperCase())}</span>`}<div><strong>@${esc(profile.username||'membre')}</strong><small>Première leçon terminée</small></div></div><div class="onboarding-actions"><button type="submit" class="button dark">Continuer <span>→</span></button></div>`,{form:true});
    card.addEventListener('submit',async event=>{event.preventDefault();busy(card,true);const completedState={...state,completed:true,stage:'completed',completed_at:new Date().toISOString()},{error}=await supabase.from('profiles').update({onboarding_completed:true,onboarding_state:completedState}).eq('id',user.id);if(error){busy(card,false);return fail(card,error.message)}close();location.assign('/accueil')});
  }
  async function render(){close();if(['welcome','username','identity','avatar','location','theme','intro'].includes(state.stage))return renderFormStage();if(state.stage==='finish')return finish();return renderTourStage();}
  render();
}
