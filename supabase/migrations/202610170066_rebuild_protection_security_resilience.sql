do $$
declare
  v_pillar uuid;
  v_security uuid;
  v_resilience uuid;
  v_module uuid;
begin
  select id into v_pillar from public.pillars where title = 'PROTÉGER' limit 1;
  select id into v_security from public.chapters where pillar_id = v_pillar and title = 'Sécurité personnelle' and is_visible limit 1;
  select id into v_resilience from public.chapters where pillar_id = v_pillar and title = 'Résilience' and is_visible limit 1;

  if v_pillar is null or v_security is null or v_resilience is null then
    raise exception 'La structure du pilier PROTÉGER est introuvable.';
  end if;

  -- Ces deux chapitres ne contenaient aucun cours : leur matière rejoint désormais Sécurité.
  delete from public.chapters
  where pillar_id = v_pillar and is_visible and title in ('Protéger ses proches', 'Foyer & biens');

  update public.chapters
  set title = 'Sécurité',
      category = 'Sécurité',
      description = 'Éviter le danger, protéger les siens et faire de son foyer un refuge.',
      visual_key = 'autonomie'
  where id = v_security;

  update public.chapters
  set order_index = 10,
      description = 'Redevenir capable dehors, avec son corps, ses mains et ce que le terrain offre.',
      visual_key = 'autonomie'
  where id = v_resilience;

  delete from public.modules where chapter_id in (v_security, v_resilience);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_security,'Sécurité personnelle','Construire un corps difficile à surprendre et un esprit qui ne panique pas.',12,0,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>La sécurité ne commence pas avec une arme. Elle commence bien avant : dans ta manière de regarder, de marcher, de parler et de sentir qu’une situation tourne mal.</p>

<p>Nos ancêtres n’avaient ni caméra, ni bouton d’alarme, ni voiture pour quitter les lieux. Ils devaient lire un visage, une posture, une trace, un silence inhabituel. Cette vigilance n’était pas de la paranoïa. C’était une présence totale au réel.</p>

<p><b>Ton premier outil reste l’évitement.</b> Repère les sorties. Ne marche pas absorbé par ton téléphone. Si une personne ou un lieu te semble mauvais, pars avant d’avoir réuni assez de preuves pour écrire un rapport. Une intuition n’est pas magique : ton cerveau peut remarquer une incohérence avant que tu arrives à la formuler.</p>

<p><b>Ton deuxième outil est ton attitude.</b> Tiens-toi stable, regarde autour de toi, parle clairement et garde une distance. La plupart des confrontations inutiles meurent lorsqu’on ne nourrit ni l’ego ni la panique. Tu n’as rien à gagner à rester pour avoir le dernier mot.</p>

<p><b>Ton troisième outil est un corps capable.</b> Apprends un sport de combat avec une opposition réelle : boxe, lutte, judo, grappling ou jiu-jitsu. Frapper un sac ne suffit pas. Il faut connaître la fatigue, la pression d’un autre corps et la nécessité de décider vite. Le but n’est pas de chercher la bagarre. Le but est de ne pas découvrir tes réactions le jour où tu n’as plus le choix.</p>

<p>En France, la légitime défense répond à une atteinte injustifiée, immédiate, avec une réponse nécessaire et proportionnée. Elle sert à interrompre le danger, pas à se venger une fois qu’il est terminé. Si tu peux fuir et mettre les autres à l’abri, fais-le.</p>

<p><b>Entraîne aussi les gestes pour lesquels ton corps est construit :</b></p>
<ul>
  <li>Lance une balle, une pierre d’entraînement ou un javelot sur une cible dégagée.</li>
  <li>Pratique le tir à l’arc dans un club ou sur un terrain prévu pour cela.</li>
  <li>Grimpe, suspends-toi, rampe, porte une charge irrégulière et cours sur quelques dizaines de mètres.</li>
  <li>Travaille la précision : nœuds, sculpture, couture épaisse, bricolage, réparation et manipulation d’outils.</li>
</ul>

<p>La main humaine possède une prise de force et une prise de précision remarquables. Notre épaule peut stocker puis restituer de l’énergie lors d’un lancer. Au centre du poignet, certaines personnes voient apparaître un tendon en collant le pouce au petit doigt puis en fléchissant la main : le long palmaire. Il est présent chez la majorité des humains, avec de fortes variations selon les populations. Son absence ne retire pas la force globale de préhension. Ce n’est pas un super-pouvoir ; c’est un rappel anatomique d’un avant-bras fait pour saisir, tirer et manipuler.</p>

<p><b>Cette semaine :</b> fais une séance d’essai dans un club de combat, d’escalade ou de tir à l’arc. Choisis une pratique où l’on apprend réellement, pas une chorégraphie vendue comme de l’autodéfense.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006417218" target="_blank" rel="noopener noreferrer">Article 122-5 du Code pénal — légitime défense</a></li>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3785139/" target="_blank" rel="noopener noreferrer">Évolution de la capacité humaine à lancer avec vitesse</a></li>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC1571064/" target="_blank" rel="noopener noreferrer">Évolution de la main, prise de force et lancer</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/24426922/" target="_blank" rel="noopener noreferrer">Long palmaire, prévalence et force de préhension</a></li>
</ul>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_security,'Sécurité des proches','Protéger sans étouffer et préparer les siens avant que quelque chose arrive.',11,1,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Protéger quelqu’un ne signifie pas le rendre dépendant de toi. La meilleure protection consiste à transmettre des réflexes, des repères et une capacité à agir sans attendre ton arrivée.</p>

<p>Pendant l’immense majorité de notre histoire, un enfant apprenait très tôt qui appeler, où se cacher, comment retrouver le groupe et quels adultes étaient fiables. Aujourd’hui, beaucoup de familles possèdent quinze chargeurs mais aucun plan lorsque les téléphones ne répondent plus.</p>

<p><b>Construis un plan familial simple :</b></p>
<ul>
  <li>Un contact principal et un contact extérieur à la ville.</li>
  <li>Un point de rassemblement près du domicile et un second plus éloigné.</li>
  <li>Un mot secret connu uniquement de la famille pour confirmer qu’un adulte est autorisé à récupérer un enfant.</li>
  <li>Les allergies, traitements, numéros importants et adresses écrits sur papier.</li>
  <li>Une personne chargée des enfants, une autre des animaux et une autre du kit si vous devez partir.</li>
</ul>

<p>Montre à chacun comment appeler le 112, donner une adresse, décrire ce qui se passe et ne pas raccrocher trop tôt. Apprenez les gestes de premiers secours ensemble. Une formation pratique vaut plus que cinquante vidéos enregistrées dans un téléphone inaccessible.</p>

<p><b>Protège aussi leur identité.</b> Ne publie pas l’école d’un enfant, ses horaires, le nom de son club, la façade de ta maison, une plaque d’immatriculation ou la routine d’un proche. Une photo innocente peut montrer une rue, un uniforme, une fenêtre ou une géolocalisation. Tes proches n’ont pas à payer ton besoin de tout afficher.</p>

<p>Avec les enfants, travaille sans créer de peur : reconnaître son nom complet, connaître un numéro, refuser de suivre un inconnu, chercher une famille ou un professionnel identifiable dans un lieu public, crier clairement « je ne connais pas cette personne » et rejoindre un point convenu.</p>

<p>Avec une personne âgée ou dépendante, prépare les médicaments, lunettes, appareils, documents et moyens de déplacement. Vérifie qu’elle peut ouvrir une porte, utiliser son téléphone et demander de l’aide. La protection réelle se voit dans ces détails.</p>

<p><b>Cette semaine :</b> réunis les tiens pendant vingt minutes. Choisissez vos deux points de rassemblement, votre mot secret et la personne que tout le monde appellera.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.service-public.fr/particuliers/actualites/A15841" target="_blank" rel="noopener noreferrer">Numéros d’urgence et informations à transmettre</a></li>
  <li><a href="https://www.croix-rouge.fr/gestes-de-premiers-secours" target="_blank" rel="noopener noreferrer">Gestes de premiers secours — Croix-Rouge française</a></li>
  <li><a href="https://www.cybermalveillance.gouv.fr/tous-nos-contenus/bonnes-pratiques/reseaux-sociaux" target="_blank" rel="noopener noreferrer">Vie privée et informations publiées sur les réseaux sociaux</a></li>
</ul>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_security,'Sécurité du foyer et des biens','Transformer son logement en refuge discret, solide et prêt.',13,2,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Une maison doit d’abord être un refuge. Pas une vitrine. Si tout le monde peut connaître ton adresse, tes absences, tes objets de valeur et la disposition de ton intérieur grâce à tes réseaux, aucune serrure ne réparera cette erreur.</p>

<p><b>La première défense est la discrétion.</b> Ne filme pas tes clés, ton système d’alarme, tes fenêtres, ton coffre, tes vacances en temps réel ou les achats coûteux encore emballés. Attends ton retour pour publier. Retire la géolocalisation des photos et évite les plans complets de ton logement.</p>

<p><b>La dissuasion passive ralentit et décourage :</b></p>
<ul>
  <li>Portes, gâches et cylindres solides ; fenêtres réellement fermées ; dépendances verrouillées.</li>
  <li>Éclairage extérieur cohérent, visibilité dégagée et courrier relevé pendant une absence.</li>
  <li>Détecteurs de fumée et de monoxyde de carbone, extincteur adapté et couverture anti-feu accessibles.</li>
  <li>Bonnes relations avec quelques voisins capables de reconnaître ce qui est inhabituel.</li>
</ul>

<p><b>La dissuasion active, c’est ta capacité à répondre.</b> Savoir où sont les sorties, fermer rapidement une zone, déclencher une alarme, appeler, rassembler les enfants et quitter le logement. Pas des pièges bricolés qui blessent n’importe qui. Un plan répété est plus utile qu’un objet spectaculaire jamais utilisé.</p>

<p>Les objets réellement importants ne doivent pas vivre ensemble. Utilise un coffre solidement fixé pour les documents et valeurs principales, puis plusieurs cachettes discrètes pour les doubles, une petite réserve d’espèces et des copies. Ne choisis pas les cachettes vues dans chaque film. Garde aussi une copie chiffrée de tes documents en dehors du domicile.</p>

<p><b>Prépare deux capacités différentes :</b></p>
<ul>
  <li><b>Se confiner :</b> eau, nourriture sans cuisson, radio, lampes, batteries, médicaments, hygiène et de quoi tenir au moins 72 heures.</li>
  <li><b>Évacuer :</b> sac accessible, papiers, eau, vêtements, trousse de secours, charge, argent, double des clés et besoins des enfants ou animaux.</li>
</ul>

<p>Apprends à couper l’eau, l’électricité et le gaz. Photographie les biens importants avec leurs numéros de série. Vérifie ce que ton assurance couvre réellement, les franchises et les justificatifs demandés. Un sinistre est déjà assez pénible sans découvrir à ce moment-là que tu ne peux rien prouver.</p>

<p><b>Cette semaine :</b> fais le tour du logement avec une feuille. Note une faiblesse d’accès, un risque de feu, un document à copier et ce qui manque pour tenir trois jours.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.securite-civile.interieur.gouv.fr/reagir/comment-se-preparer-face-aux-risques/kit-durgence" target="_blank" rel="noopener noreferrer">Kit d’urgence permettant de tenir 72 heures</a></li>
  <li><a href="https://www.service-public.fr/particuliers/vosdroits/F19950" target="_blank" rel="noopener noreferrer">Détecteur de fumée dans un logement</a></li>
  <li><a href="https://www.cybermalveillance.gouv.fr/tous-nos-contenus/bonnes-pratiques/sauvegardes" target="_blank" rel="noopener noreferrer">Sauvegarder ses données importantes</a></li>
</ul>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_resilience,'Retrouver les gestes humains','Réveiller la précision, l’adresse et la puissance que la vie moderne endort.',10,0,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Tu peux passer une journée entière à cliquer sur du verre sans rien saisir, lancer, tailler, nouer ou porter. Ce n’est pas neutre. Une main qui ne rencontre plus le réel devient maladroite.</p>

<p>Nos mains savent combiner deux qualités rares : serrer fort et manipuler avec précision. Notre épaule sait armer un lancer puissant. Nos yeux, nos hanches et nos pieds savent coordonner une trajectoire. Ces capacités ne reviennent pas en lisant leur description.</p>

<p><b>Remets du jeu et du défi dans ta semaine :</b></p>
<ul>
  <li>Tir à l’arc pour l’ancrage, le calme, la précision et la répétition.</li>
  <li>Lancer sur cible avec une balle, un disque ou un javelot d’entraînement.</li>
  <li>Escalade, suspension, corde et branches basses solides pour retrouver prise et confiance.</li>
  <li>Équilibre sur terrain irrégulier, franchissements, rampé et port de sacs ou de bûches.</li>
  <li>Nœuds, taille du bois, réparation, couture et travail fin pour la dextérité.</li>
</ul>

<p>Commence bas, léger et précis. Chercher immédiatement la hauteur ou la puissance est une manière moderne de transformer un apprentissage en blessure. Le plaisir vient de la maîtrise : une flèche qui se groupe, une branche atteinte proprement, un nœud réalisé dans le noir, un obstacle franchi sans bruit.</p>

<p><b>Ton défi :</b> choisis une discipline de précision et une discipline de déplacement. Pratique chacune au moins deux fois ce mois-ci.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC1571064/" target="_blank" rel="noopener noreferrer">Évolution de la main humaine, lancer et maniement des outils</a></li>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3785139/" target="_blank" rel="noopener noreferrer">Biomécanique et évolution du lancer chez Homo</a></li>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3557098/" target="_blank" rel="noopener noreferrer">Grimper aux arbres dans l’évolution et chez les populations humaines</a></li>
</ul>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_resilience,'Camper pour de vrai','Dormir dehors et apprendre ce dont on a réellement besoin.',9,1,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Le camping est une répétition générale sans catastrophe. Tu quittes volontairement le confort, tu découvres ce qui te manque et tu rentres avec une compétence de plus.</p>

<p>Commence par une nuit proche de chez toi, puis éloigne-toi. Monte ton camp avant la nuit. Observe le vent, la pente, les branches mortes au-dessus de toi, l’écoulement possible de l’eau et la distance avec les autres. Un bel emplacement peut devenir une cuvette froide ou un torrent après une pluie.</p>

<p><b>Un camp simple demande peu :</b></p>
<ul>
  <li>Un abri réellement adapté à la météo.</li>
  <li>Une isolation sous le corps ; le sol vole plus de chaleur que l’air.</li>
  <li>Une couche sèche réservée à la nuit.</li>
  <li>De l’eau, une lampe, un moyen de communication et une trousse minimale.</li>
  <li>Un repas que tu sais préparer sans improviser dans le noir.</li>
</ul>

<p>Apprends à rester propre avec peu d’eau, à ranger toujours chaque objet au même endroit et à démonter sans laisser de déchets. Le bivouac te montre rapidement si ton matériel sert vraiment ou s’il a seulement l’air technique sur une photo.</p>

<p><b>Ton défi :</b> passe une nuit dehors ce mois-ci. Pas besoin d’une expédition. L’objectif est de monter, manger, dormir, ranger et repartir avec calme.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/34646931/" target="_blank" rel="noopener noreferrer">Activités en nature et santé mentale : revue systématique</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35259287/" target="_blank" rel="noopener noreferrer">Activité physique en milieu naturel et bénéfices psychologiques</a></li>
</ul>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_resilience,'Marcher et s’orienter','Quitter l’itinéraire automatique et savoir retrouver sa route.',10,2,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Marcher plusieurs heures transforme ta perception d’un territoire. Les distances cessent d’être des chiffres. Tu comprends les pentes, les rivières, les lignes de crête, la lumière et la vitesse réelle d’un déplacement.</p>

<p>Choisis des randonnées qui demandent progressivement plus de terrain et moins d’assistance. Garde le téléphone pour l’urgence, mais apprends à préparer l’itinéraire sur une carte.</p>

<p><b>Tu dois savoir :</b></p>
<ul>
  <li>Orienter une carte avec le terrain et une boussole.</li>
  <li>Reconnaître une crête, un vallon, un col, une rivière et une courbe de niveau.</li>
  <li>Estimer ton allure, le temps restant et l’heure à laquelle tu dois faire demi-tour.</li>
  <li>Donner ton itinéraire et ton heure de retour à quelqu’un.</li>
  <li>T’arrêter dès que tu doutes, plutôt que marcher vite dans la mauvaise direction.</li>
</ul>

<p>Teste-toi dans un lieu connu : rejoins un point avec carte et boussole, puis vérifie seulement à la fin. Ajoute ensuite la pluie, le froid, un sac plus lourd ou une portion de nuit. La résilience se construit par petites couches de difficulté volontaire.</p>

<p><b>Ton défi :</b> prépare une boucle de trois heures et réalise-la sans navigation vocale.</p>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_resilience,'Feu, eau et abri','Maîtriser les trois problèmes qui rendent une nuit dehors facile ou brutale.',12,3,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Un feu, de l’eau sûre et un abri sec changent complètement une situation. Ce sont aussi trois compétences que beaucoup pensent posséder sans les avoir jamais testées sous la pluie.</p>

<p><b>Le feu :</b> prépare d’abord l’amadou, les petites brindilles puis le combustible plus gros. Ne cherche pas une grande flamme immédiatement. Apprends plusieurs méthodes d’allumage et respecte les interdictions locales. Un feu se prépare autant qu’il se surveille, et il doit être entièrement éteint avant ton départ.</p>

<p><b>L’eau :</b> transporte une réserve, repère les sources avant de partir et possède un moyen de traitement. Une eau claire peut contenir des agents invisibles. La filtration retire surtout des particules et, selon le filtre, des micro-organismes ; l’ébullition traite le risque biologique mais ne retire pas une pollution chimique.</p>

<p><b>L’abri :</b> coupe le vent, éloigne l’eau et isole du sol. Entraîne-toi avec une bâche et quelques cordes avant d’avoir froid. Apprends le nœud de chaise, le tendeur et deux attaches simples. Trois nœuds maîtrisés valent mieux qu’une application entière de tutoriels.</p>

<p><b>Ton défi :</b> monte un abri avec une bâche, fais chauffer de l’eau puis démonte le tout sans laisser de trace.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.cdc.gov/drinking-water/about/emergency-disinfection-of-drinking-water.html" target="_blank" rel="noopener noreferrer">Désinfection de l’eau en situation d’urgence</a></li>
  <li><a href="https://www.securite-civile.interieur.gouv.fr/reagir/comment-se-preparer-face-aux-risques/kit-durgence" target="_blank" rel="noopener noreferrer">Eau, outils et équipements d’un kit de 72 heures</a></li>
</ul>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_resilience,'Chasser, pêcher et cueillir','Comprendre d’où vient la nourriture et apprendre à la prélever avec respect.',11,4,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>La viande n’apparaît pas dans une barquette. Le poisson ne naît pas en filet. Une baie n’est pas comestible parce qu’elle ressemble à celle d’une vidéo.</p>

<p>Chasser, pêcher et cueillir remettent du poids derrière le mot nourriture. Il faut lire une saison, un terrain, un animal, une météo et une réglementation. Il faut aussi accepter de rentrer sans rien.</p>

<p><b>Commence accompagné :</b></p>
<ul>
  <li>Passe le permis et rejoins une personne expérimentée si la chasse t’attire.</li>
  <li>Apprends à pêcher, tuer proprement, vider et conserver ce que tu prélèves.</li>
  <li>Identifie quelques plantes locales avec un spécialiste, sur plusieurs saisons.</li>
  <li>Ne consomme jamais un champignon ou une plante sur la seule base d’une application.</li>
  <li>Prélève peu, respecte les périodes, les lieux et laisse assez pour le milieu.</li>
</ul>

<p>Le but n’est pas de jouer au survivant. Le but est de devenir moins séparé du vivant. Une sortie où tu apprends trois traces, deux arbres et un nœud vaut déjà quelque chose.</p>

<p><b>Ton défi :</b> réserve une sortie avec un pêcheur, un chasseur, un guide naturaliste ou une association locale.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6347593/" target="_blank" rel="noopener noreferrer">Projectiles de chasse et évolution humaine</a></li>
  <li><a href="https://www.service-public.fr/particuliers/vosdroits/F2088" target="_blank" rel="noopener noreferrer">Permis et règles essentielles de la chasse en France</a></li>
</ul>
$lesson$,0);

  insert into public.modules (chapter_id,title,description,duration_minutes,order_index,is_visible)
  values (v_resilience,'Construire de ses mains','Passer du consommateur fragile à la personne qui sait fabriquer et réparer.',11,5,true)
  returning id into v_module;
  insert into public.subchapters (module_id,title,content,order_index) values (v_module,'Cours',$lesson$
<p>Chaque objet acheté tout fait te fait gagner du temps. Si tout est acheté tout fait, tu finis par ne plus savoir produire grand-chose.</p>

<p>Construire une cabane, réparer une chaise, affûter un outil, recoudre une toile ou fabriquer une étagère remet immédiatement face au réel. Le bois fend. Une mesure peut être fausse. Un nœud glisse. Tes mains reçoivent une réponse honnête.</p>

<p><b>Commence par les fondamentaux :</b></p>
<ul>
  <li>Mesurer, tracer, couper droit et percer proprement.</li>
  <li>Utiliser un couteau, une scie, un marteau et une hache avec précision.</li>
  <li>Affûter et entretenir au lieu de jeter.</li>
  <li>Faire quelques nœuds solides et choisir le bon cordage.</li>
  <li>Réparer un vêtement, une sangle, un meuble ou un équipement de camp.</li>
</ul>

<p>Puis construis quelque chose dehors : un banc, un coffre, un support de cuisson ou une petite cabane sur un terrain où tu en as le droit. Ne cherche pas le résultat parfait. Cherche une structure stable, réparable et comprise de bout en bout.</p>

<p>Invite quelqu’un qui sait faire. Pendant des milliers d’années, la compétence se transmettait en regardant une main plus expérimentée, puis en recommençant jusqu’à ce que le geste devienne naturel.</p>

<p><b>Ton défi :</b> choisis un objet cassé chez toi. Répare-le avant d’en acheter un autre.</p>
$lesson$,0);
end;
$$;
