const chapters = [
{name:'Sommeil',icon:'☾',description:'Retrouver le sens du repos.',modules:['Comprendre son sommeil','Observer son rythme','La lumière et nos journées','Construire son rituel du soir','Faire du repos une priorité']},
{name:'Alimentation',icon:'◒',description:'Nourrir plutôt que restreindre.',modules:['Les bases de l’équilibre','Composer son assiette','Écouter sa faim','Organiser ses repas','Installer des habitudes durables']},
{name:'Force',icon:'⌁',description:'Un corps fait pour bouger.',modules:['Le mouvement au quotidien','Découvrir le renforcement','Progresser à son rythme','La place de la récupération','Construire sa routine']},
{name:'Mental',icon:'◉',description:'Cultiver un esprit plus clair.',modules:['Observer son attention','Comprendre ses sources de stress','Créer de l’espace mental','La constance au quotidien']},
{name:'Entourage',icon:'⋈',description:'Bien vivre, ensemble.',modules:['Faire le point sur ses liens','Poser ses limites','Cultiver les relations','Avancer avec les autres']}
];
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
const landingChapters=document.querySelector('#landing-chapters');
if(landingChapters) landingChapters.innerHTML=chapters.map((c,i)=>`<a class="chapter-card" href="academie.html?chapitre=${i+1}"><span class="chapter-num">CHAPITRE 0${i+1}</span><span class="chapter-icon" aria-hidden="true">${c.icon}</span><h3>${c.name}</h3><p>${c.description}</p><div class="card-bottom"><span>${c.modules.length} modules</span><span>↗</span></div></a>`).join('');
const dialog=document.querySelector('#plan-dialog');
document.querySelectorAll('[data-plan]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#plan-title').textContent=button.dataset.plan;dialog.showModal();}));
document.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
const moduleIds=chapters.flatMap((c,ci)=>c.modules.map((_,mi)=>`${ci+1}-${mi+1}`));
function readSaved(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
const storedProgress=readSaved('stoa-progress',[]);
let completed=new Set(Array.isArray(storedProgress)?storedProgress.filter(id=>moduleIds.includes(id)):[]);
const params=new URLSearchParams(location.search);
const courseList=document.querySelector('#course-list');
function renderCourses(filter='all'){
 if(!courseList)return;
 courseList.innerHTML=chapters.map((c,ci)=>{const number=ci+1;if(filter!=='all'&&String(number)!==filter)return '';return `<section class="course-chapter"><div class="course-chapter-title"><span class="chapter-icon" aria-hidden="true">${c.icon}</span><div><span class="eyebrow">CHAPITRE 0${number}</span><h3>${c.name}</h3><p>${c.description}</p></div><span class="chapter-completion">${c.modules.filter((_,mi)=>completed.has(`${number}-${mi+1}`)).length} / ${c.modules.length}</span></div><div class="module-list">${c.modules.map((title,mi)=>`<a href="module.html?chapitre=${number}&module=${mi+1}" class="module-row"><span class="module-number ${completed.has(`${number}-${mi+1}`)?'done':''}">${completed.has(`${number}-${mi+1}`)?'✓':String(mi+1).padStart(2,'0')}</span><span>${title}</span><span class="module-state">${completed.has(`${number}-${mi+1}`)?'Terminé':'À découvrir'}</span><span aria-hidden="true">↗</span></a>`).join('')}</div></section>`;}).join('');
 document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===filter;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
}
if(courseList){
 const requested=params.get('chapitre');renderCourses(['1','2','3','4','5'].includes(requested)?requested:'all');
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{renderCourses(b.dataset.filter);const url=new URL(location);if(b.dataset.filter==='all')url.searchParams.delete('chapitre');else url.searchParams.set('chapitre',b.dataset.filter);history.replaceState(null,'',url);}));
 document.querySelector('#progress-count').textContent=completed.size;
 document.querySelector('#total-progress').value=completed.size;
 document.querySelector('#total-progress').textContent=`${completed.size} sur 23`;
 if(completed.size)document.querySelector('#progress-caption').textContent=completed.size===23?'Vos fondations sont posées. Continuez à les cultiver.':'Chaque module compte. Continuez à votre rythme.';
 const nextId=moduleIds.find(id=>!completed.has(id));
 if(nextId){const[ci,mi]=nextId.split('-').map(Number);document.querySelector('#continue-title').textContent=chapters[ci-1].modules[mi-1];document.querySelector('#continue-chapter').textContent=`CHAPITRE 0${ci} — ${chapters[ci-1].name.toUpperCase()}`;document.querySelector('.continue-icon').textContent=chapters[ci-1].icon;document.querySelector('#continue-link').href=`module.html?chapitre=${ci}&module=${mi}`;if(completed.size){document.querySelector('#continue-link').innerHTML='Continuer <span>↗</span>';document.querySelector('#continue-description').textContent='La prochaine étape de votre parcours.';}}
 else{document.querySelector('#continue-title').textContent='Votre parcours est terminé';document.querySelector('#continue-description').textContent='Revenez sur les pratiques qui vous sont utiles.';document.querySelector('#continue-link').innerHTML='Revoir le parcours <span>↗</span>';}
}
const lessons=[
 [
 ['Observer avant de changer','Le sommeil est un point de départ pour réfléchir à son quotidien. Avant de vouloir modifier vos habitudes, prenez le temps de décrire ce qui se passe réellement : votre soirée, votre heure de coucher et la façon dont vous abordez le matin.','Un carnet sert à observer, pas à se juger. Une seule nuit ne résume pas votre expérience ; cherchez plutôt ce qui se répète.','Décrivez votre soirée d’hier en trois étapes, sans chercher à la corriger.'],
 ['Dessiner votre journée','Votre emploi du temps contient déjà des repères : les trajets, les repas, les moments de travail et les temps libres. Les rendre visibles permet de mieux comprendre la place que vous laissez au repos.','Distinguez ce qui est imposé de ce que vous pouvez ajuster. Une routine adaptée commence par votre vie réelle.','Notez deux repères stables dans votre journée et un moment où votre rythme varie.'],
 ['Regarder son environnement','La lumière accompagne nos activités du matin au soir. Ce module vous invite à regarder vos espaces de vie : les fenêtres, l’éclairage et la place des écrans dans votre soirée.','L’objectif de cette première observation est de connaître votre environnement avant de choisir un changement.','Décrivez la lumière dans votre espace de travail et dans la pièce où vous passez la soirée.'],
 ['Donner une fin à la journée','Un rituel est une suite de gestes qui marque une transition. Il peut être simple : ranger son espace, préparer le lendemain ou prendre quelques minutes de lecture.','Choisissez un geste que vous appréciez et que votre emploi du temps permet réellement. La simplicité aide à le répéter.','Écrivez le geste qui pourrait symboliser la fin de votre journée.'],
 ['Faire une place au repos','Un agenda reflète nos priorités, mais aussi nos contraintes. Regarder la place du repos dans le vôtre est une façon de questionner l’équilibre entre obligations et disponibilité.','Il ne s’agit pas d’optimiser chaque minute. Laissez également de la place aux imprévus et aux moments sans programme.','Identifiez une obligation et une activité facultative dans votre soirée.']
 ],
 [
 ['Faire le point sans jugement','Notre alimentation s’inscrit dans une histoire, une culture et un quotidien. Avant de chercher un modèle idéal, décrivez vos habitudes et les conditions dans lesquelles vous prenez vos repas.','Ce parcours propose des réflexions générales. Les besoins alimentaires individuels peuvent nécessiter un professionnel qualifié.','Qu’est-ce qui facilite vos repas aujourd’hui ? Qu’est-ce qui les complique ?'],
 ['Observer son assiette','Composer un repas commence souvent bien avant de s’asseoir : ce qui est disponible, ce que l’on sait cuisiner et le temps dont on dispose jouent un rôle.','Notez les aliments que vous utilisez régulièrement et ceux que vous aimez cuisiner. Cette base concrète sera plus utile qu’un menu abstrait.','Décrivez un repas que vous aimez préparer et ce qui le rend simple pour vous.'],
 ['Se rendre disponible à ses sensations','Les repas peuvent se dérouler dans le calme, dans l’urgence ou devant un écran. Observer leur contexte permet de mieux raconter votre expérience.','L’exercice consiste à décrire vos sensations avec vos propres mots, sans leur attribuer une note ni une règle à respecter.','Comment décririez-vous le contexte de votre dernier repas ?'],
 ['Réduire les décisions répétitives','Une organisation utile doit vous faire gagner de la disponibilité. Une liste de courses courte ou quelques idées de repas peuvent suffire à rendre la semaine plus lisible.','Partez du nombre de repas à préparer et de votre emploi du temps. Prévoyez une marge pour les changements.','Notez trois repas que vous savez préparer avec les moyens dont vous disposez.'],
 ['Choisir une habitude réaliste','Une habitude durable correspond à vos contraintes et à vos préférences. Elle doit être assez précise pour savoir si vous l’avez mise en pratique.','Définissez votre propre petit changement. Puis observez ce qui le facilite, plutôt que de rechercher une semaine parfaite.','Quel geste simple souhaitez-vous essayer autour de vos repas cette semaine ?']
 ],
 [
 ['Repérer le mouvement déjà présent','Marcher, porter, se déplacer : le mouvement ne se limite pas à une séance. Commencez par regarder les activités qui composent déjà votre journée.','Ce premier inventaire permet de partir de votre situation et de vos préférences, sans comparaison avec les autres.','À quels moments de votre journée êtes-vous en mouvement ?'],
 ['Comprendre avant de pratiquer','Le renforcement rassemble des pratiques différentes, avec ou sans matériel. Avant de commencer, il est utile de connaître son contexte, ses objectifs et les ressources disponibles.','Ce module de démonstration ne prescrit pas d’exercices. Un encadrement qualifié peut vous aider à choisir une pratique adaptée.','Quel type d’activité vous attire, et de quel accompagnement auriez-vous besoin ?'],
 ['Définir sa propre progression','Progresser ne se résume pas à un chiffre. Cela peut aussi signifier mieux comprendre une pratique, gagner en confiance ou trouver un rythme régulier.','Choisissez un repère qui a du sens pour vous et qui ne vous pousse pas à ignorer vos limites.','En dehors de la performance, qu’aimeriez-vous apprendre dans votre pratique ?'],
 ['Penser aussi aux intervalles','Une routine comprend les activités et ce qui les entoure. Le temps disponible, les déplacements et les moments de pause font partie de son organisation.','Un programme n’a de valeur que s’il peut s’intégrer à votre vie. Vous pouvez le réviser lorsque vos contraintes évoluent.','Qu’est-ce qui vous permet de faire une vraie pause dans votre semaine ?'],
 ['Construire un rendez-vous avec soi','Une routine réaliste commence par une place concrète dans votre agenda. Choisissez une activité qui vous intéresse et un cadre qui vous convient.','Préparez une solution plus simple pour les journées chargées. Adapter son organisation fait partie de la pratique.','Quel créneau et quel lieu pourraient accueillir votre activité ?']
 ],
 [
 ['Voir où va son attention','Messages, tâches et sollicitations se succèdent parfois sans transition. Les observer aide à identifier ce qui occupe votre attention au fil d’une journée.','L’objectif n’est pas une concentration permanente. Il s’agit de choisir plus consciemment ce qui mérite votre disponibilité.','Quelles sont les trois sollicitations les plus fréquentes dans votre journée ?'],
 ['Mettre des mots sur ses contraintes','Certaines situations paraissent légères un jour et difficiles le lendemain. Décrire le contexte peut aider à distinguer les faits, vos attentes et les ressources dont vous disposez.','Cette réflexion n’est pas un outil de diagnostic. Vous n’avez pas à résoudre seul une difficulté qui vous dépasse.','Décrivez une situation exigeante et une ressource sur laquelle vous pouvez compter.'],
 ['Ménager des espaces disponibles','Un moment sans nouvelle sollicitation peut être aussi simple qu’une pause entre deux activités. Il n’a pas besoin de devenir une performance supplémentaire.','Réfléchissez à ce que vous aimeriez laisser de côté quelques instants, et à la manière de rendre cette pause possible.','Où pourriez-vous placer une transition calme entre deux activités ?'],
 ['Revenir plutôt que réussir parfaitement','La constance se construit avec des reprises. Une interruption ne fait pas disparaître ce que vous avez appris ; elle peut vous renseigner sur les conditions nécessaires pour continuer.','Choisissez une action modeste et un repère clair. Si elle ne fonctionne pas, ajustez le cadre au lieu de vous juger.','Quel serait votre plus petit geste pour reprendre après une journée chargée ?']
 ],
 [
 ['Observer la place des liens','Nos relations prennent des formes différentes : proximité, amitié, travail ou activités partagées. Faire le point aide à voir les liens auxquels on souhaite consacrer du temps.','Vous pouvez garder cette réflexion privée. Il ne s’agit pas de noter les personnes, mais de reconnaître vos besoins et vos envies.','Quel type de moment partagé aimeriez-vous retrouver plus souvent ?'],
 ['Formuler ce qui vous convient','Exprimer une limite demande parfois de commencer par la clarifier pour soi. Identifiez la situation, votre disponibilité et ce que vous aimeriez proposer.','Une formulation simple peut décrire ce que vous pouvez faire aujourd’hui, sans prétendre expliquer ou contrôler la réaction de l’autre.','Écrivez une phrase qui exprime clairement une limite de temps ou de disponibilité.'],
 ['Accorder du temps aux liens','Les relations vivent aussi dans les petits rendez-vous : prendre des nouvelles, proposer une promenade, partager une activité. Choisissez un geste qui vous ressemble.','Respectez vos disponibilités et celles de l’autre. Une invitation ouvre une possibilité ; elle n’impose pas une réponse.','Quel moment simple aimeriez-vous proposer à une personne de votre entourage ?'],
 ['Faire une place au soutien','Avancer avec les autres ne signifie pas tout partager. Vous pouvez choisir ce que vous souhaitez dire, à qui, et quel type de soutien serait utile.','Le parcours s’achève ici, mais vos fondations restent vivantes. Revenez sur les réflexions qui vous ont été utiles et choisissez la suite.','Quelle pratique du parcours souhaitez-vous conserver, et avec quel soutien ?']
 ]
];
if(document.querySelector('#lesson-content')){
 const rawC=Number(params.get('chapitre')),ci=Number.isInteger(rawC)&&rawC>=1&&rawC<=5?rawC-1:0;
 const rawM=Number(params.get('module')),mi=Number.isInteger(rawM)&&rawM>=1&&rawM<=chapters[ci].modules.length?rawM-1:0;
 const c=chapters[ci],id=`${ci+1}-${mi+1}`,title=c.modules[mi],content=lessons[ci][mi];
 document.title=`${title} — STOA`;
 document.querySelector('#lesson-title').textContent=title;
 document.querySelector('#lesson-kicker').textContent=`CHAPITRE 0${ci+1} — ${c.name.toUpperCase()} / MODULE 0${mi+1}`;
 document.querySelector('#lesson-icon').textContent=c.icon;
 document.querySelector('#lesson-chapter').innerHTML=`<span class="eyebrow">CHAPITRE 0${ci+1}</span><h2>${c.name}</h2>`;
 function renderLessonNav(){document.querySelector('#lesson-nav').innerHTML=c.modules.map((t,i)=>`<a href="module.html?chapitre=${ci+1}&module=${i+1}" ${i===mi?'aria-current="page"':''}><span>${completed.has(`${ci+1}-${i+1}`)?'✓':String(i+1).padStart(2,'0')}</span>${t}</a>`).join('');}
 renderLessonNav();
 document.querySelector('#lesson-copy').innerHTML=`<h2>${content[0]}</h2><p>${content[1]}</p><p>${content[2]}</p>`;
 document.querySelector('#practice-prompt').textContent=content[3];
 const notes=document.querySelector('#lesson-notes'),noteKey=`stoa-note-${id}`,savedNote=readSaved(noteKey,'');notes.value=typeof savedNote==='string'?savedNote:'';
 notes.addEventListener('input',()=>{document.querySelector('#note-status').textContent=save(noteKey,notes.value)?'Notes enregistrées sur cet appareil.':'Le navigateur ne permet pas l’enregistrement. Copiez vos notes avant de quitter.';});
 const completeButton=document.querySelector('#complete-module');
 function updateCompletion(){const done=completed.has(id);completeButton.innerHTML=done?'Terminé — annuler <span>↶</span>':'Marquer comme terminé <span>✓</span>';completeButton.setAttribute('aria-pressed',String(done));}
 updateCompletion();
 completeButton.addEventListener('click',()=>{if(completed.has(id))completed.delete(id);else completed.add(id);const saved=save('stoa-progress',[...completed]);updateCompletion();renderLessonNav();document.querySelector('#completion-status').textContent=saved?(completed.has(id)?'Module terminé. Votre progression est enregistrée.':'Ce module est de nouveau à découvrir.'):'Progression modifiée pour cette session. Le stockage du navigateur est indisponible.';});
 const nextIndex=moduleIds.indexOf(id)+1,nextLink=document.querySelector('#next-module');
 if(nextIndex<moduleIds.length){const[nc,nm]=moduleIds[nextIndex].split('-');nextLink.href=`module.html?chapitre=${nc}&module=${nm}`;}else nextLink.innerHTML='Retour à mon académie <span>→</span>';
}
