do $$
declare
  v_vivre uuid;
  v_construire uuid;
  v_chapter uuid;
  v_module uuid;
begin
  select id into v_vivre from public.pillars where title = 'VIVRE' limit 1;
  select id into v_construire from public.pillars where title = 'SE CONSTRUIRE' limit 1;

  if v_vivre is null or v_construire is null then
    raise exception 'Les piliers VIVRE et SE CONSTRUIRE sont introuvables.';
  end if;

  -- Libère les positions avant de réorganiser les deux derniers piliers.
  update public.chapters
  set order_index = order_index + 3000
  where is_visible and pillar_id in (v_vivre, v_construire);

  -- Les chapitres pratiques appartiennent désormais à SE CONSTRUIRE.
  update public.chapters set pillar_id = v_construire, order_index = 17
  where is_visible and title = 'Organisation';
  update public.chapters set pillar_id = v_construire, order_index = 18
  where is_visible and title = 'Ressources';
  update public.chapters set order_index = 16
  where is_visible and pillar_id = v_construire and title = 'Autonomie';
  update public.chapters set order_index = 19
  where is_visible and pillar_id = v_construire and title = 'Sens';
  update public.chapters set order_index = 20
  where is_visible and pillar_id = v_construire and title = 'Longévité';

  -- L'ancien chapitre Société, encore vide, est remplacé par un parcours philosophique cohérent.
  delete from public.chapters where is_visible and pillar_id = v_vivre;
  delete from public.modules
  where title = 'test'
    and chapter_id in (select id from public.chapters where is_visible and pillar_id = v_construire and title = 'Autonomie');

  insert into public.chapters (pillar_id,category,title,description,order_index,is_visible,visual_key)
  values (v_vivre,'Philosophie','Fondations philosophiques','Douter, observer et reconstruire sa propre manière de penser.',11,true,'spiritualite')
  returning id into v_chapter;

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'Douter pour reconstruire','Ne plus vivre avec des idées simplement héritées.',10,0,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>La plupart de tes opinions sont entrées en toi avant même que tu apprennes à les examiner. Ta famille, ton époque, ton milieu et les personnes que tu admires t’ont transmis une manière de voir le monde. Certaines idées sont solides. D’autres ne survivent que parce que personne n’a pris le temps de les remettre sur la table.</p>

<p><b>Douter ne signifie pas refuser de croire.</b> Cela signifie demander à chaque idée de montrer ce qu’elle vaut. D’où vient-elle ? Sur quoi repose-t-elle ? Est-ce une observation, une habitude, une peur ou une phrase répétée assez souvent pour ressembler à une vérité ?</p>

<p>Socrate revendiquait la conscience de son ignorance. Galilée rappelait qu’un homme très ignorant peut encore nous apprendre quelque chose. Cette position n’est pas une faiblesse. Celui qui croit déjà tout savoir ne voit plus rien. Celui qui sait que son savoir est incomplet reste capable de corriger sa route.</p>

<p>Descartes voulait se défaire des opinions reçues pour reconstruire ses connaissances depuis les fondations. Sa formule la plus célèbre fait de la pensée une preuve immédiate de notre existence. Ici, nous irons dans l’autre sens : <b>je pense parce que je suis.</b> L’existence vient d’abord. La pensée réfléchie apparaît parce qu’un être conscient peut observer, comparer et questionner. Tout ce qui vit ne pense pas de cette manière ; mais dès que la conscience s’éveille, la curiosité devient l’un de ses mouvements les plus humains.</p>

<p>Tu n’as donc pas à défendre une ancienne version de toi par orgueil. Une idée abandonnée après examen n’est pas une défaite. C’est une place libérée pour quelque chose de plus juste.</p>

<p><b>Prends une conviction importante.</b> Écris ce qui pourrait te faire changer d’avis. Si la réponse est « rien », tu ne tiens plus une conviction : tu protèges un dogme.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://fr.wikisource.org/wiki/Discours_de_la_m%C3%A9thode_(%C3%A9d._Cousin)" target="_blank" rel="noopener noreferrer">René Descartes — Discours de la méthode</a></li>
  <li><a href="https://fr.wikisource.org/wiki/Apologie_de_Socrate_(trad._Cousin)" target="_blank" rel="noopener noreferrer">Platon — Apologie de Socrate</a></li>
</ul>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'L’homme de la nature avant celui de la société','Retrouver ce qui est humain sous les conventions modernes.',11,1,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Avant d’être citoyen, salarié, consommateur ou utilisateur, tu es un être vivant. Ton corps cherche la lumière, le mouvement, la nourriture, le repos, le lien et la sécurité. La société peut organiser ces besoins. Elle ne peut pas les abolir sans créer de tension.</p>

<p>L’être humain aurait dû continuer à écouter ses instincts, puis apprendre à les affiner. À la place, la vie moderne a parfois remplacé le réel par des règles sociales : rester assis quand le corps demande de bouger, sourire quand une situation inspire la méfiance, acheter pour signaler sa valeur, se comparer à des inconnus et demander une permission pour chaque initiative.</p>

<p><b>Un instinct n’est pas un ordre sacré.</b> La peur peut se tromper. La colère peut dépasser sa cible. Le désir peut nous rendre stupides. Mais étouffer systématiquement ces signaux est tout aussi absurde. L’instinct apporte une information ancienne ; la raison décide comment y répondre.</p>

<p>Diogène choquait parce qu’il dépouillait les conventions de leur prestige. Il observait les titres, les fortunes et les rangs comme des costumes. Sous le tissu, le puissant et l’esclave finissent avec les mêmes os. Cette égalité matérielle ne nie pas les différences de courage ou de compétence. Elle rappelle seulement qu’aucun statut ne transforme un homme en espèce supérieure.</p>

<p>Ne confonds donc jamais civilité et soumission. Tu peux respecter une règle utile sans adorer celui qui l’a écrite. Tu peux vivre parmi les autres sans leur abandonner ton jugement. Une société saine protège la coopération ; elle ne demande pas à chacun de mutiler ce qui le rend vivant.</p>

<p><b>Reviens régulièrement au concret :</b> marche, porte, fabrique, mange, dors, parle face à face. Plus ta vie retrouve le réel, moins les conventions creuses ont de prise sur toi.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://fr.wikisource.org/wiki/Vies,_doctrines_et_sentences_des_philosophes_illustres_(trad._Robert_Genaille)/Livre_VI/Diog%C3%A8ne" target="_blank" rel="noopener noreferrer">Diogène Laërce — Vie de Diogène de Sinope</a></li>
  <li><a href="https://fr.wikisource.org/wiki/De_la_libert%C3%A9_(trad._Dupont-White)/Chapitre_III" target="_blank" rel="noopener noreferrer">John Stuart Mill — De l’individualité comme élément du bien-être</a></li>
</ul>
$lesson$,0);

  insert into public.chapters (pillar_id,category,title,description,order_index,is_visible,visual_key)
  values (v_vivre,'Liberté','Liberté & responsabilité','Rester maître de ses choix sans devenir l’esclave de ses impulsions.',12,true,'autonomie')
  returning id into v_chapter;

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'Ne dépendre de personne','Construire une liberté matérielle, mentale et morale.',11,0,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Être libre, c’est pouvoir faire ce que l’on veut sans devoir demander à quelqu’un la permission d’exister. Cette liberté ne tombe pas du ciel. Elle se construit avec des compétences, des réserves, un jugement personnel et la capacité de quitter ce qui cherche à nous tenir.</p>

<p><b>Chaque dépendance excessive devient un levier contre toi.</b> Si une seule personne contrôle ton revenu, ton logement, tes relations et ton estime de toi, un simple désaccord peut tout emporter. Il ne s’agit pas de vivre seul. Il s’agit de choisir tes liens au lieu d’y rester par impossibilité de partir.</p>

<p>L’État, l’entreprise, le groupe et même la famille peuvent vouloir subordonner l’individu à une idée générale. La réponse n’est pas une opposition automatique à tout. C’est une vigilance : aucune structure ne doit penser à ta place, définir seule le bien que tu poursuis ou te convaincre que l’obéissance suffit à faire de toi quelqu’un de bon.</p>

<p>La liberté demande aussi de répondre de ses actes. Faire ce que tu veux ne signifie pas laisser les autres payer la facture. Si ta maxime devenait la règle de tous, pourrais-tu encore vivre dans le monde qu’elle créerait ? Kant donne ici un excellent test : une action qui réclame pour toi une exception impossible à accorder aux autres cache souvent une domination.</p>

<p>Construis donc une marge. Apprends à gagner, réparer, décider, dire non et partir. Garde de l’argent, des savoir-faire et des amitiés qui ne dépendent pas du même centre de pouvoir. Puis utilise cette indépendance pour choisir avec courage, pas seulement pour consommer davantage.</p>

<p><b>La liberté véritable ne se proclame pas.</b> Elle se reconnaît au nombre de choix que tu peux encore faire quand une porte se ferme.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://fr.wikisource.org/wiki/L%E2%80%99Unique_et_sa_propri%C3%A9t%C3%A9" target="_blank" rel="noopener noreferrer">Max Stirner — L’Unique et sa propriété</a></li>
  <li><a href="https://fr.wikisource.org/wiki/Fondements_de_la_m%C3%A9taphysique_des_m%C5%93urs_(trad._Delbos)/La_morale_de_Kant" target="_blank" rel="noopener noreferrer">Emmanuel Kant — Fondements de la métaphysique des mœurs</a></li>
</ul>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'Être bon sans devenir faible','Choisir sa conduite sans tenir un registre de ce que les autres rendent.',10,1,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Il vaut mieux subir une injustice que devenir volontairement injuste. Ce principe paraît naïf dans un monde où beaucoup confondent bonté et faiblesse. Il repose pourtant sur une idée solide : ce que les autres te font leur appartient ; ce que tu choisis de devenir t’appartient.</p>

<p>Un individu doit à sa famille et à sa communauté de la loyauté, du dévouement et une présence réelle. Pas parce qu’un contrat garantit un retour égal. Parce qu’une communauté disparaît dès que chacun attend d’être servi avant de servir.</p>

<p>Tu auras parfois l’impression d’avoir été trop gentil. Ce regret pèse souvent moins lourd que celui d’avoir abandonné un proche, humilié quelqu’un ou laissé l’orgueil couper une relation qui aurait pu être sauvée. La bonté n’est pas une transaction. Si tu n’agis bien que lorsque tu es certain d’être récompensé, tu fais du commerce.</p>

<p><b>Cela ne t’oblige pas à offrir ta destruction.</b> Aider n’impose pas de mentir, de financer chaque erreur ou de rester sous les coups. Tu peux prendre de la distance sans souhaiter le mal. Tu peux refuser un comportement et répondre présent lorsqu’un vrai besoin survient. Une limite protège parfois la relation de la rancœur.</p>

<p>Kant demande de traiter l’humanité comme une fin, jamais comme un simple moyen. Applique cette règle aux autres, puis à toi-même. Ne manipule pas. Ne promets pas ce que tu ne veux pas tenir. N’utilise pas une personne pour son réseau, son corps, son argent ou son attention. Et ne laisse pas non plus ton humanité devenir l’outil permanent de quelqu’un.</p>

<p>Marc Aurèle invitait à cesser de discuter de l’homme bon pour l’être enfin. La morale commence là : dans le prochain geste, surtout lorsque personne ne regarde.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://fr.wikisource.org/wiki/Fondements_de_la_m%C3%A9taphysique_des_m%C5%93urs_(trad._Lachelier_1904)/Morale_de_Kant" target="_blank" rel="noopener noreferrer">Emmanuel Kant — L’humanité comme fin</a></li>
  <li><a href="https://fr.wikisource.org/wiki/Pens%C3%A9es_de_Marc-Aur%C3%A8le_(trad._Couat)/Livre_X" target="_blank" rel="noopener noreferrer">Marc Aurèle — Pensées, livre X</a></li>
</ul>
$lesson$,0);

  insert into public.chapters (pillar_id,category,title,description,order_index,is_visible,visual_key)
  values (v_vivre,'Relations','Autrui, communauté & société','Aimer, coopérer et guider sans réduire les autres à leur utilité.',13,true,'relations')
  returning id into v_chapter;

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'Des alliés, pas des rivaux','Comprendre pourquoi l’égoïsme intelligent pousse à coopérer.',10,0,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>L’être humain est égoïste. Il cherche spontanément ce qui protège sa vie, son confort, ses proches et son avenir. Ce constat ne condamne personne. Il devient dangereux seulement lorsque l’on imagine que l’intérêt de l’autre doit forcément être notre perte.</p>

<p><b>Faire d’un autre humain ton rival permanent est un mauvais calcul.</b> Un voisin compétent peut te secourir. Un ami qui réussit peut ouvrir une route. Un collègue respecté peut te défendre lorsque tu n’es pas dans la pièce. Une communauté prospère agrandit les possibilités de chacun.</p>

<p>La comparaison moderne pousse pourtant à lire chaque réussite comme une humiliation personnelle. L’écran expose les corps, les maisons, les voyages et les chiffres sans montrer le prix payé. On finit par envier des vies que l’on ne voudrait même pas habiter.</p>

<p>Remplace la rivalité vague par l’émulation précise. Si quelqu’un fait mieux que toi, observe son geste. Demande ce qu’il sait. Galilée rappelait qu’aucun homme n’est si ignorant qu’il n’ait quelque chose à nous apprendre. Tu peux vouloir progresser sans souhaiter sa chute.</p>

<p>Une communauté a aussi besoin de hiérarchies naturelles. Le meilleur pisteur ouvre la marche. La personne la plus calme décide pendant l’urgence. Celui qui possède le savoir le transmet. Ce leadership reste légitime tant qu’il sert le groupe, accepte la critique et ne transforme pas la compétence en droit d’écraser.</p>

<p><b>Un chef digne de ce nom ne fabrique pas des sujets.</b> Il rend les autres plus capables. Il guide vers un idéal qu’il s’impose d’abord à lui-même.</p>

<p>Choisis autour de toi des personnes dont la force augmente la tienne. Puis deviens pour elles quelqu’un dont la présence augmente la leur.</p>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'Aimer sans tenir les comptes','Fonder ses liens sur les sentiments plutôt que sur leur rendement.',11,1,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>L’amour, l’amitié et le couple ne devraient pas ressembler à une fiche produit. Pourtant, la société de consommation nous apprend à comparer les personnes comme des offres : avantages, défauts, statut, projet, apparence et rendement émotionnel.</p>

<p><b>Une relation fondée uniquement sur l’admiration, la complémentarité ou un projet commun reste une relation d’intérêt.</b> L’admiration disparaît lorsque l’autre faiblit. La complémentarité change avec les années. Le projet peut échouer. S’il n’existe aucun sentiment sous cette architecture, la relation s’écroule dès qu’elle cesse d’être pratique.</p>

<p>Les vrais sentiments ne rendent pas aveugle. Ils donnent une raison de traverser ce qui n’est plus immédiatement rentable : la maladie, le doute, le vieillissement, l’échec, les périodes où l’autre apporte moins qu’il ne reçoit.</p>

<p>Aristote propose une règle simple : conduis-toi avec tes amis comme tu voudrais les voir se conduire avec toi. Cela ne demande pas une égalité mathématique à chaque journée. L’un porte davantage aujourd’hui, l’autre demain. Ce qui compte est la vérité du lien.</p>

<p>Ne collectionne pas les personnes. Sois présent. Appelle avant d’avoir besoin de quelque chose. Souviens-toi de ce qui compte pour elles. Défends leur nom lorsqu’elles sont absentes. Dis la vérité sans humilier. Demande pardon sans calculer qui a commis la première faute.</p>

<p>Et lorsque tu aimes, ne transforme pas l’autre en moyen de compléter ton image. Kant l’exprime avec force : une personne doit toujours rester une fin. Elle ne t’appartient pas. Elle marche librement à tes côtés.</p>

<p><b>Le lien le plus précieux n’est pas celui qui impressionne le monde.</b> C’est celui dans lequel chacun peut déposer l’armure sans craindre d’être utilisé.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://fr.wikisource.org/wiki/%C3%89thique_%C3%A0_Nicomaque_(trad._Voilquin)/Livre_VIII" target="_blank" rel="noopener noreferrer">Aristote — Éthique à Nicomaque, livre VIII</a></li>
  <li><a href="https://fr.wikisource.org/wiki/Fondements_de_la_m%C3%A9taphysique_des_m%C5%93urs_(trad._Lachelier_1904)/Morale_de_Kant" target="_blank" rel="noopener noreferrer">Emmanuel Kant — L’humanité comme fin</a></li>
</ul>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'Choisir ses liens','Savoir qui laisser entrer dans sa vie et ce que l’on veut construire avec cette personne.',10,2,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Tu ne choisis pas toujours la rencontre, mais tu choisis la place qu’elle prendra dans ta vie. Beaucoup de relations deviennent douloureuses parce que personne n’a décidé ce qu’il voulait réellement construire.</p>

<p><b>Commence par regarder les actes.</b> Les mots peuvent séduire en quelques minutes. Le caractère apparaît avec le temps : une promesse tenue quand elle coûte, une vérité dite sans cruauté, la façon de parler des absents, le comportement face à quelqu’un qui ne peut rien offrir.</p>

<p>En amitié, cherche la présence, la franchise et le plaisir simple d’être ensemble. Dans la famille, distingue ce qui mérite d’être transmis de ce qui doit s’arrêter avec toi. Dans le couple, ne choisis pas seulement une image, un statut ou un projet. Demande-toi si le sentiment reste vivant lorsque personne n’applaudit et que la vie devient ordinaire.</p>

<p>Tu dois aussi savoir ce que tu veux. Une relation légère, un engagement durable, une famille, une amitié rare ou une communauté quotidienne ne demandent pas la même disponibilité. Dire clairement ton intention évite de faire payer à l’autre une indécision que tu refuses de regarder.</p>

<p><b>Ne cherche pas une personne sans défaut.</b> Cherche quelqu’un dont les défauts ne détruisent pas ce que tu considères essentiel. Puis accepte que l’autre réalise le même examen sur toi.</p>

<p>Choisir ses liens ne signifie pas écarter tous ceux qui traversent une mauvaise période. Cela signifie reconnaître les relations qui te demandent de mentir, de te rapetisser ou de trahir constamment tes principes. La loyauté mérite des efforts. Elle ne demande pas de fermer les yeux.</p>

<p>Fais l’inventaire de tes liens proches. Avec qui veux-tu bâtir ? À qui dois-tu une conversation honnête ? Quelle relation gardes-tu uniquement par habitude ? Le choix devient réel lorsqu’il produit un geste.</p>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'Entretenir une relation','Faire vivre un lien familial, amical ou amoureux après l’élan du début.',11,3,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Une relation ne meurt pas toujours après une grande trahison. Elle s’éteint souvent par petites absences : les messages auxquels on répond plus tard, les gestes que l’on considère comme acquis, les désaccords laissés sous le tapis et la conviction que l’autre saura forcément ce que l’on ressent.</p>

<p><b>La présence doit devenir visible.</b> Appelle. Propose une date. Regarde la personne lorsqu’elle parle. Souviens-toi d’un détail important. Aide avant que la demande devienne un appel au secours. Les sentiments qui ne produisent jamais d’actes finissent par sembler imaginaires.</p>

<p>Dans une famille, crée des rendez-vous qui survivent à la fatigue : un repas, une visite, une marche, une fête gardée avec soin. Dans une amitié, ne laisse pas toujours l’autre porter l’initiative. Dans un couple, protège un temps sans téléphone, continue à toucher, rire, parler et découvrir. La familiarité doit apporter la sécurité, pas l’indifférence.</p>

<p><b>Lorsque le conflit arrive :</b></p>
<ul>
  <li>Parle du fait précis au lieu de juger toute la personne.</li>
  <li>Dis ce que tu as compris avant de préparer ta réponse.</li>
  <li>Ne transforme pas une confidence ancienne en arme.</li>
  <li>Excuse-toi sur ce que tu as fait, sans ajouter immédiatement ce que l’autre a fait.</li>
  <li>Décide d’un changement observable, puis tiens-le.</li>
</ul>

<p>Une relation solide n’est pas une relation sans conflit. C’est une relation dans laquelle le conflit ne détruit pas la dignité. On peut être en colère sans humilier, déçu sans menacer de partir et en désaccord sans chercher un public.</p>

<p>Choisis aujourd’hui une relation importante. Fais un geste qui l’entretient sans attendre une occasion spéciale.</p>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'Devenir quelqu’un de meilleur','Construire le caractère que l’on aimerait rencontrer chez les autres.',11,4,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Nous avons tous une liste de ce que les autres devraient devenir : plus loyaux, plus calmes, plus généreux, plus courageux. La question la plus utile reste plus proche : est-ce que tu incarnes déjà ce que tu réclames ?</p>

<p>Devenir meilleur ne signifie pas devenir lisse. Cela signifie choisir ses qualités au lieu de laisser l’humeur décider. Tu peux choisir d’être fiable, juste, curieux, courageux, patient ou généreux. Le caractère se forme lorsque ce choix survit au moment où il devient inconfortable.</p>

<p><b>Observe tes réactions ordinaires.</b> Comment parles-tu lorsque tu es fatigué ? Que fais-tu d’une information confidentielle ? Est-ce que tu tiens l’heure annoncée ? Est-ce que tu reconnais une erreur avant d’être découvert ? Est-ce que les personnes plus faibles se sentent en sécurité près de toi ?</p>

<p>Ne choisis pas vingt vertus. Prends-en trois. Donne à chacune une forme concrète. « Être loyal » peut signifier ne pas salir un ami absent. « Être fiable » peut signifier prévenir dès que tu sais que tu seras en retard. « Être courageux » peut signifier avoir cette semaine la conversation que tu repousses.</p>

<p>Tu deviendras aussi meilleur en restant enseignable. Celui qui pense que son âge, son titre ou son expérience le dispensent d’apprendre commence déjà à se durcir. Un enfant, un artisan, un adversaire et une personne que tu n’aimes pas peuvent chacun révéler une faille dans ton jugement.</p>

<p><b>Ne cherche pas à paraître bon.</b> Cherche à rendre ta présence bonne pour ceux qui t’entourent. La différence se voit dans ce que tu fais lorsque le geste restera inconnu.</p>

<p>Chaque soir, pose-toi trois questions : qu’ai-je bien fait ? Où ai-je manqué à la personne que je veux être ? Quel geste précis corrigera cela demain ?</p>
$lesson$,0);

  insert into public.chapters (pillar_id,category,title,description,order_index,is_visible,visual_key)
  values (v_vivre,'Bonheur','Désir, bonheur & souffrance','Chercher une vie meilleure sans devenir l’esclave du manque.',14,true,'spiritualite')
  returning id into v_chapter;

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'La mécanique du désir','Comprendre le manque avant qu’il ne commande toute la vie.',11,0,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Le désir naît d’un manque. Tant que tu n’as pas ce que tu veux, l’absence occupe ton esprit. Lorsque tu l’obtiens, la satisfaction arrive, puis s’affaiblit. Très vite, un nouveau manque réclame sa place. Schopenhauer voyait ainsi l’existence osciller entre la souffrance du désir et l’ennui qui suit sa satisfaction.</p>

<p>Regarde un achat attendu pendant des semaines. Avant de l’avoir, tu imaginais qu’il changerait quelque chose de profond. Quelques jours plus tard, il rejoint le décor. Le désir n’a pas menti sur l’objet ; il a menti sur la durée de son pouvoir.</p>

<p><b>Il ne faut pas tuer tous les désirs.</b> Sans désir, aucun apprentissage, aucun amour, aucune construction. Il faut apprendre à distinguer ceux qui agrandissent ta vie de ceux qui ne font que calmer brièvement une agitation créée par la comparaison.</p>

<p>Épicure ne proposait pas une course aux plaisirs. Il cherchait surtout l’absence de douleur du corps et de trouble de l’âme. Tout plaisir peut sembler bon sur le moment, mais tous ne méritent pas d’être poursuivis. Certains demandent demain dix fois ce qu’ils donnent aujourd’hui.</p>

<p>Avant de céder à un désir, demande-toi :</p>
<ul>
  <li>Est-ce que je le voudrais encore si personne ne le voyait ?</li>
  <li>Est-ce qu’il construit une capacité, un lien ou une expérience réelle ?</li>
  <li>Quel prix demandera-t-il à mon temps, ma liberté et ma tranquillité ?</li>
  <li>Est-ce un désir personnel ou une comparaison déguisée ?</li>
</ul>

<p>La modération n’est pas la privation. C’est reprendre la main. Tu peux apprécier un plaisir pleinement parce que tu sais aussi t’en passer.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://fr.wikisource.org/wiki/Page:Schopenhauer_-_Le_Monde_comme_volont%C3%A9_et_comme_repr%C3%A9sentation,_Burdeau,_tome_1,_1912.djvu/350" target="_blank" rel="noopener noreferrer">Arthur Schopenhauer — Le monde comme volonté et comme représentation</a></li>
  <li><a href="https://fr.wikisource.org/wiki/Lettre_%C3%A0_M%C3%A9n%C3%A9c%C3%A9e_(traduction_Chauffepi%C3%A9)" target="_blank" rel="noopener noreferrer">Épicure — Lettre à Ménécée</a></li>
</ul>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'Construire une vie stable et libre','Définir sa réussite sans laisser le monde le faire à sa place.',10,1,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Personne ne peut définir à ta place une vie réussie. Pour certains, elle contient une famille nombreuse. Pour d’autres, un métier, une œuvre, un territoire, des voyages ou une existence discrète. Mais presque toutes les réponses sérieuses réclament une part de stabilité et une part de liberté.</p>

<p>La stabilité donne un sol : un corps qui tient, un logement sûr, quelques relations fiables, des dépenses maîtrisées et des habitudes qui ne changent pas au premier choc. La liberté donne de l’air : pouvoir choisir, refuser, partir, créer et modifier sa trajectoire.</p>

<p><b>Trop de stabilité devient une cage.</b> Tu ne prends plus aucun risque et tu appelles cela la prudence. <b>Trop de liberté sans fondation devient une fuite.</b> Tu changes sans cesse de lieu, de projet ou de partenaire parce que rien ne doit jamais te retenir.</p>

<p>Le bonheur n’est pas une excitation permanente. Il ressemble davantage à l’absence de mal inutile, à une conscience tranquille et à des plaisirs dont le lendemain ne demande pas réparation. Démocrite liait la tranquillité de l’âme à la mesure ; Épicure rappelait que tous les plaisirs ne sont pas à choisir.</p>

<p>La souffrance n’est pas un professeur qu’il faudrait inviter. L’être humain cherche naturellement à l’éviter parce qu’il désire le mieux pour lui. Lorsqu’une épreuve arrive malgré toi, extrais-en ce qui peut t’être utile, puis sors-en. Ne bâtis pas ton identité autour de la douleur et ne méprise jamais une vie douce simplement parce qu’elle paraît moins héroïque.</p>

<p><b>Écris ta définition.</b> De quoi as-tu besoin pour te sentir stable ? De quelles libertés refuses-tu de te séparer ? Quelles souffrances continues-tu d’entretenir alors qu’elles ne produisent plus rien ?</p>

<p>Ta réussite commence lorsque tes journées ressemblent enfin aux valeurs que tu annonces.</p>
$lesson$,0);

  insert into public.chapters (pillar_id,category,title,description,order_index,is_visible,visual_key)
  values (v_vivre,'Mort','Temps, mort & transmission','Retarder la mort sans passer sa vie à l’attendre.',15,true,'longevite')
  returning id into v_chapter;

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'Ne pas attendre la mort','Protéger la vie sans laisser sa fin voler chaque journée.',10,0,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>La mort est triste. Elle arrache une présence, ferme une voix et laisse aux vivants tout ce qu’ils n’ont pas eu le temps de dire. Il n’y a aucune sagesse à faire semblant qu’elle ne compte pas.</p>

<p>Il faut la retarder autant que possible : prendre soin de son corps, éviter les risques absurdes, apprendre à se protéger, consulter le réel plutôt que l’orgueil et construire une vie que l’on n’a pas envie de quitter. Préserver sa vie n’est pas de la lâcheté. C’est reconnaître sa valeur.</p>

<p><b>Mais ne transforme pas cette protection en attente.</b> Celui qui pense constamment à ne pas mourir peut finir par ne plus vivre. Il refuse le voyage, l’amour, l’effort, la baignade, la montagne, le projet et toute situation qui ne garantit pas le contrôle. Il gagne peut-être quelques précautions et perd des années entières.</p>

<p>Montaigne écrivait qu’il ne craignait pas tant la mort que le fait de mourir. La nuance est humaine : l’idée abstraite de ne plus être n’a rien à voir avec la douleur, la séparation et l’inachevé. Nous ne réglerons pas tout par une formule. Nous pouvons cependant réduire l’inachevé.</p>

<p>Appelle aujourd’hui. Transmets ce que tu sais. Écris les volontés que les autres ne peuvent pas deviner. Range tes affaires. Répare la relation qui mérite encore de l’être. Plante quelque chose qui poussera sans toi.</p>

<p>La mort met une limite au temps, et cette limite donne du poids aux choix. Tu n’as pas à la provoquer, ni à l’idéaliser, ni à vivre couché devant elle. Marche dans l’autre direction aussi longtemps que tes jambes te portent.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://fr.wikisource.org/wiki/Essais/%C3%A9dition_de_1595/Livre_I/Chapitre_20" target="_blank" rel="noopener noreferrer">Michel de Montaigne — Que philosopher, c’est apprendre à mourir</a></li>
  <li><a href="https://fr.wikisource.org/wiki/La_Pens%C3%A9e_de_Schopenhauer/De_la_vie_et_de_la_mort" target="_blank" rel="noopener noreferrer">Arthur Schopenhauer — De la vie et de la mort</a></li>
</ul>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_chapter,'Vivre de manière à ne pas regretter','Choisir les traces que l’on laisse dans la mémoire des autres.',11,1,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Le regret ne vient pas seulement de ce que l’on a raté. Il vient souvent de la personne que l’on a choisi d’être quand une autre conduite restait possible.</p>

<p>Tu regretteras peut-être d’avoir trop donné. Mais il est plus lourd de se souvenir que tu as tourné le dos par fierté, refusé un geste facile ou laissé une querelle médiocre devenir le dernier chapitre d’une relation.</p>

<p><b>Agis de manière à pouvoir souhaiter que les autres agissent ainsi.</b> Cette règle de Kant ne résout pas tous les dilemmes, mais elle expose rapidement les excuses. Si chacun mentait quand la vérité devient coûteuse, promettait sans tenir et abandonnait dès que le lien exige un effort, aucun monde commun ne resterait debout.</p>

<p>La bonté n’exige pas d’être parfait. Elle exige de corriger. Reconnais vite une faute. Répare ce qui peut l’être. Ne transforme pas une mauvaise action en caractère permanent seulement parce que ton ego refuse une excuse.</p>

<p>La transmission dépasse aussi les paroles. Les plus jeunes observent la manière dont tu traites les faibles, les absents, les employés, les animaux et ceux dont tu n’as rien à obtenir. Ton véritable cours de morale est déjà en train d’être donné.</p>

<p>Avicenne conseillait de marcher avec des sandales jusqu’à ce que la sagesse procure des souliers. Reste assez humble pour apprendre de ceux qui possèdent moins de titres et davantage de savoir. La sagesse ne se reconnaît pas à une posture grave. Elle se reconnaît à une vie devenue plus juste.</p>

<p><b>Ne cherche pas une grande phrase pour résumer ton passage.</b> Sème quelques fleurs sur le chemin. Rends les personnes autour de toi un peu plus libres, un peu plus capables et un peu moins seules. Puis recommence demain.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://fr.wikisource.org/wiki/Fondements_de_la_m%C3%A9taphysique_des_m%C5%93urs_(trad._Delbos)/La_morale_de_Kant" target="_blank" rel="noopener noreferrer">Emmanuel Kant — Fondements de la métaphysique des mœurs</a></li>
  <li><a href="https://fr.wikisource.org/wiki/Essais/%C3%A9dition_de_1595/Livre_III/Chapitre_13" target="_blank" rel="noopener noreferrer">Michel de Montaigne — De l’expérience</a></li>
</ul>
$lesson$,0);
end;
$$;
