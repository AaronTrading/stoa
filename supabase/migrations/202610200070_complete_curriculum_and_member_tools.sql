-- Complète le cursus demandé et consolide les outils réservés aux membres.

-- Expositions : remplacer les deux repères laissés dans les cours.
update public.subchapters s
set content = replace(s.content, '<p>ICI INTEGRER LES METAUX</p>', $content$
<p><b>Métaux lourds et PFAS</b></p>
<p>Le plomb, le mercure, le cadmium et certains composés arsenicaux s’accumulent lorsque l’exposition se répète. Le plomb touche notamment le cerveau, les reins et le système cardiovasculaire. Le mercure se concentre dans les grands poissons prédateurs. Le cadmium se retrouve surtout dans la fumée de tabac, certains engrais, abats, coquillages et cacaos issus de sols riches en cadmium.</p>
<p>Réduis les sources les plus évidentes : ne ponce pas une vieille peinture sans protection, aère les travaux, varie les espèces de poissons, évite le tabac et choisis vaisselle, pigments et compléments dont la provenance est traçable. Les PFAS sont des molécules très persistantes utilisées dans certains revêtements antiadhésifs, textiles déperlants et emballages résistants aux graisses. Remplace une poêle abîmée, évite les traitements antitaches superflus et, lorsqu’une pollution locale de l’eau est documentée, utilise un filtre réellement certifié pour les PFAS concernés.</p>
<p>Une « détox » en poudre ne retire pas une exposition chronique. La priorité reste toujours la même : trouver la source, l’arrêter, puis laisser le corps faire son travail.</p>
<p><u>Sources:</u></p>
<ul>
  <li><a href="https://www.who.int/news-room/fact-sheets/detail/lead-poisoning-and-health" target="_blank" rel="noopener noreferrer">OMS — exposition au plomb</a></li>
  <li><a href="https://www.who.int/news-room/fact-sheets/detail/mercury-and-health" target="_blank" rel="noopener noreferrer">OMS — mercure et santé</a></li>
  <li><a href="https://www.who.int/news-room/fact-sheets/detail/chemical-safety-food" target="_blank" rel="noopener noreferrer">OMS — contaminants chimiques des aliments</a></li>
</ul>
$content$)
from public.modules m, public.chapters c
where s.module_id=m.id and m.chapter_id=c.id and c.title='Expositions' and m.title='Matériaux et métaux';

update public.subchapters s
set content = replace(s.content, '<p>ICI PARLER CREME SOLAIRE</p>', $content$
<p><b>Ce que les crèmes solaires ajoutent à la peau</b></p>
<p>Une crème solaire reste un mélange de filtres, solvants, conservateurs, parfums et agents de texture laissé plusieurs heures sur une grande surface de peau. Certaines formules piquent les yeux, déclenchent une irritation ou une allergie de contact, bouchent les pores et deviennent difficiles à retirer sans nettoyant agressif. Les aérosols ajoutent un problème simple : une partie du produit part dans l’air et peut être inhalée.</p>
<p>Plusieurs filtres organiques passent dans le sang après des applications répétées. Cette absorption ne prouve pas à elle seule une maladie, mais elle suffit à remettre en cause l’idée d’un produit parfaitement inerte. L’oxybenzone fait aussi partie des filtres les plus discutés pour les milieux aquatiques. Évite les parfums, les sprays, les listes interminables et les applications automatiques du matin au soir. Une crème ne doit jamais devenir une permission de rester immobile sous un soleil brûlant jusqu’à ne plus sentir les signaux de la peau.</p>
<p><u>Sources:</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/31058986/" target="_blank" rel="noopener noreferrer">Absorption systémique de plusieurs filtres solaires</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/31961417/" target="_blank" rel="noopener noreferrer">Absorption après usage maximal de produits solaires</a></li>
  <li><a href="https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun" target="_blank" rel="noopener noreferrer">FDA — données et réévaluation des filtres solaires</a></li>
</ul>
$content$)
from public.modules m, public.chapters c
where s.module_id=m.id and m.chapter_id=c.id and c.title='Expositions' and m.title='Environnement';

-- Le complément n'est plus présenté comme le raccourci du pratiquant.
update public.subchapters s
set content = replace(
  s.content,
  '<p>Répartissez vos sources protéiques sur la journée sans transformer chaque repas en calcul. Si votre poids et vos performances ne bougent plus pendant plusieurs semaines, augmentez légèrement les portions, surtout autour de l’entraînement. Un complément reste une commodité ; il ne remplace jamais une assiette.</p>',
  $content$<p>Répartis tes repas sur la journée sans transformer chaque assiette en calcul. Si ton poids et tes performances ne bougent plus pendant plusieurs semaines, augmente légèrement les portions autour de l’entraînement.</p>
<p><b>Les compléments sont rarement la pièce manquante.</b> Ils coûtent cher, contiennent souvent une dose trop faible pour reproduire l’effet annoncé et s’appuient sur un mécanisme ou un marqueur de laboratoire plutôt que sur un résultat visible dans la vie réelle. Chez une personne sans carence identifiée, les multivitamines n’ont pas démontré qu’elles réduisaient la mortalité ou les maladies cardiovasculaires. Une poudre ne remplace ni la viande, ni les œufs, ni le poisson, ni le sommeil.</p>
<p>Avant d’acheter une boîte, pose trois questions : quelle carence précise je cherche à corriger, quelle dose a produit un effet chez l’humain, et est-ce que le produit contient réellement cette dose ? Sans réponse claire, garde ton argent pour des aliments de meilleure qualité.</p>
<p><u>Sources:</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35727272/" target="_blank" rel="noopener noreferrer">Vitamines et minéraux en prévention cardiovasculaire et du cancer</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/29991644/" target="_blank" rel="noopener noreferrer">Multivitamines et événements cardiovasculaires</a></li>
</ul>$content$
)
from public.modules m, public.chapters c
where s.module_id=m.id and m.chapter_id=c.id and c.title='Mouvement' and m.title='Prendre du muscle';

do $$
declare
  v_chapter uuid;
  v_module uuid;
  v_order integer;
begin
  -- Vêtements : aucune leçon dédiée n'existait dans Peau & Apparence.
  select id into v_chapter from public.chapters where title='Peau & Apparence' and is_visible limit 1;
  if v_chapter is not null and not exists(select 1 from public.modules where chapter_id=v_chapter and title='Choisir ses vêtements') then
    select coalesce(max(order_index),-1)+1 into v_order from public.modules where chapter_id=v_chapter;
    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Choisir ses vêtements','Lire une étiquette textile et remettre des fibres naturelles contre la peau.',11,v_order,true)
    returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Un vêtement reste contre ta peau pendant huit, douze ou seize heures. Pourtant, beaucoup choisissent davantage la coupe que la matière. Commence par retourner l’étiquette : la première ligne doit parler de fibre, pas de marketing.</p>
<p><b>Le guide d’achat le plus simple :</b></p>
<ul>
  <li><b>100 % coton</b> pour les t-shirts, sous-vêtements, chemises et vêtements du quotidien. Le coton biologique certifié GOTS limite aussi plusieurs traitements utilisés lors de la culture et de la fabrication.</li>
  <li><b>Lin ou chanvre</b> pour la chaleur. Ces fibres respirent, sèchent vite et vieillissent bien.</li>
  <li><b>Laine ou mérinos</b> pour le froid. Vérifie qu’aucun polyester ou acrylique n’est caché dans le mélange.</li>
  <li><b>Soie</b> lorsque tu veux une matière fine et naturelle.</li>
</ul>
<p>Évite le polyester, le polyamide, l’acrylique et l’élasthanne quand ils n’apportent rien d’indispensable. Ils retiennent facilement les odeurs, relâchent des microfibres au lavage et transforment un vêtement simple en matière difficile à recycler. Méfie-toi aussi des mentions « anti-odeur », « infroissable », « antitache » et « déperlant » : elles décrivent un traitement, pas une fibre.</p>
<p>Uniqlo possède une grande sélection de pièces 100 % coton à prix accessible, mais lis chaque étiquette : deux coupes presque identiques peuvent avoir une composition différente et certaines chemises reçoivent un traitement infroissable. Pour aller plus loin, Cottonique propose du coton biologique non teint et non blanchi ; Rawganique travaille le coton biologique, le lin et le chanvre avec des options sans teinture. Chez n’importe quelle marque, cherche la composition complète, la certification GOTS et l’absence de finition chimique ajoutée.</p>
<p>Commence par ce qui touche les zones les plus sensibles : sous-vêtements, vêtements de nuit, draps et t-shirts. Tu n’as pas besoin de jeter toute ta garde-robe. Remplace au fil de l’usure et garde moins de pièces, mais des pièces que tu peux porter longtemps.</p>
<p><u>Références:</u></p>
<ul>
  <li><a href="https://www.uniqlo.com/fr/fr/" target="_blank" rel="noopener noreferrer">Uniqlo — vérifier la composition de chaque modèle</a></li>
  <li><a href="https://cottonique.com/en-fr" target="_blank" rel="noopener noreferrer">Cottonique — coton biologique non teint</a></li>
  <li><a href="https://rawganique.com/" target="_blank" rel="noopener noreferrer">Rawganique — coton, lin et chanvre naturels</a></li>
</ul>
$lesson$,0);
  end if;

  -- Santé sexuelle.
  select id into v_chapter from public.chapters where title='Santé & Hygiène' and is_visible limit 1;
  if v_chapter is not null and not exists(select 1 from public.modules where chapter_id=v_chapter and title='Santé sexuelle') then
    select coalesce(max(order_index),-1)+1 into v_order from public.modules where chapter_id=v_chapter;
    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Santé sexuelle','Retrouver une fonction sexuelle solide et choisir une contraception en connaissance de cause.',13,v_order,true)
    returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>La fonction sexuelle est un miroir assez honnête du reste du corps. Une érection dépend du débit sanguin, du système nerveux, des hormones, du sommeil, du désir et de la sécurité ressentie. Lorsqu’elle devient moins ferme ou moins régulière, commence par regarder le terrain plutôt que chercher immédiatement une pilule ou un « booster ».</p>
<p><b>Ce qui améliore souvent la situation :</b></p>
<ul>
  <li>Remettre de la marche, des efforts courts et de la musculation dans la semaine.</li>
  <li>Réduire la graisse abdominale lorsqu’elle est excessive sans tomber dans une restriction permanente.</li>
  <li>Dormir suffisamment et traiter les soirées qui détruisent le réveil.</li>
  <li>Retirer le tabac, limiter l’alcool et observer les médicaments qui coïncident avec le début du problème.</li>
  <li>Sortir de la surstimulation pornographique et remettre du désir, de la lenteur et de la présence dans la relation.</li>
  <li>Entraîner le plancher pelvien : contracte comme pour retenir un gaz, relâche complètement, puis répète sans serrer les fesses ni bloquer la respiration.</li>
</ul>
<p>L’exercice et la remise en mouvement améliorent modestement la fonction érectile dans plusieurs essais, surtout lorsque le problème accompagne un terrain cardiovasculaire ou métabolique. Une difficulté brutale, persistante ou accompagnée de douleur mérite d’être explorée : elle peut précéder d’autres signes vasculaires.</p>
<p><b>Contraception et infections</b></p>
<p>Un seul partenaire ne protège pas par magie. Une relation mutuellement exclusive réduit fortement le risque d’IST lorsque les deux partenaires ont été testés et ne sont pas infectés. La symptothermie associe température, glaire cervicale et règles du cycle ; elle demande une formation, une observation quotidienne et l’abstinence ou une barrière pendant la fenêtre fertile. Bien utilisée, elle peut être très efficace. Mal comprise ou suivie à moitié, elle perd vite cette efficacité.</p>
<p>Le coït interrompu repose sur un retrait parfait à chaque rapport et n’offre aucune protection contre les IST. Il expose à bien plus d’échecs dans la vie réelle qu’une méthode suivie correctement. Le préservatif reste la barrière utile lorsqu’un risque infectieux existe.</p>
<p><u>Sources:</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/27707739/" target="_blank" rel="noopener noreferrer">Activité physique et fonction érectile</a></li>
  <li><a href="https://www.cdc.gov/contraception/about/index.html" target="_blank" rel="noopener noreferrer">CDC — efficacité et choix contraceptifs</a></li>
  <li><a href="https://www.cdc.gov/sti/about/about-sti-risk-and-oral-sex.html" target="_blank" rel="noopener noreferrer">CDC — prévention des infections sexuellement transmissibles</a></li>
</ul>
$lesson$,0);
  end if;
end;
$$;

do $$
declare
  v_pillar uuid;
  v_chapter uuid;
  v_long uuid;
  v_module uuid;
  v_order integer;
begin
  select id into v_pillar from public.pillars where title='SE CONSTRUIRE' limit 1;
  if v_pillar is null then raise exception 'Pilier SE CONSTRUIRE introuvable'; end if;

  -- Autonomie : conserver les deux bases et ajouter l'IA.
  select id into v_chapter from public.chapters where pillar_id=v_pillar and title='Autonomie' and is_visible limit 1;
  if v_chapter is not null then
    update public.subchapters s set content=$lesson$
<p>Une bonne décision ne tombe pas du ciel. Elle commence par une question nette : qu’est-ce que je cherche, qu’est-ce que je refuse et quel prix suis-je prêt à payer ? Tant que ces trois réponses restent floues, chaque option paraît à la fois attirante et dangereuse.</p>
<p>Réduis le choix à ce qui change réellement le résultat. Écris les faits, puis sépare ce que tu sais de ce que tu imagines. Choisis une action réversible lorsque tu manques d’informations. Pour une décision irréversible, prends une nuit, demande l’avis de quelqu’un qui n’a rien à te vendre et imagine le pire scénario concret.</p>
<p>L’autonomie ne consiste pas à toujours choisir seul. Elle consiste à écouter sans remettre ton volant à la première personne sûre d’elle.</p>
$lesson$
    from public.modules m where s.module_id=m.id and m.chapter_id=v_chapter and m.title='Décider avec méthode';

    update public.subchapters s set content=$lesson$
<p>Apprendre seul ne signifie pas consommer des heures de contenu. Choisis une compétence, trouve un modèle correct, reproduis-le puis confronte-toi au réel. Le savoir qui ne passe jamais par tes mains disparaît vite.</p>
<p>Travaille en boucle : lis peu, essaie, échoue proprement, note ce qui bloque et retourne chercher la réponse précise. Enseigne ensuite le geste ou l’idée à quelqu’un. Ce que tu n’arrives pas à expliquer reste souvent mal compris.</p>
<p>Conserve un carnet de preuves : travaux terminés, erreurs, photos, mesures, textes et décisions. La confiance ne vient plus d’une affirmation. Elle vient de ce que tu sais déjà refaire.</p>
$lesson$
    from public.modules m where s.module_id=m.id and m.chapter_id=v_chapter and m.title='Apprendre par soi-même';

    if not exists(select 1 from public.modules where chapter_id=v_chapter and title='Intelligence artificielle') then
      select coalesce(max(order_index),-1)+1 into v_order from public.modules where chapter_id=v_chapter;
      insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
      values(v_chapter,'Intelligence artificielle','Transformer une machine qui répond en partenaire de travail exigeant.',12,v_order,true)
      returning id into v_module;
      insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>L’intelligence artificielle n’est ni un oracle ni une triche. C’est un multiplicateur. Elle rend un curieux plus rapide, mais elle rend aussi une pensée paresseuse capable de produire davantage de vide.</p>
<p><b>Apprends à lui donner un vrai travail :</b></p>
<ul>
  <li>Donne le contexte, le résultat attendu et les contraintes.</li>
  <li>Fournis un exemple du ton ou de la forme que tu veux obtenir.</li>
  <li>Demande-lui de signaler ce qu’elle ignore et de distinguer un fait d’une hypothèse.</li>
  <li>Fais-la critiquer ton idée, puis défendre l’idée opposée.</li>
  <li>Vérifie les dates, les chiffres, les citations et les liens avant de publier.</li>
</ul>
<p>Utilise-la pour apprendre plus vite, préparer un plan, automatiser une tâche répétitive, corriger un texte, comparer des solutions, simuler un entretien ou transformer tes notes en questions. Ne lui donne pas la décision finale lorsque tu refuses d’en assumer les conséquences.</p>
<p>Le numérique possède une empreinte réelle en électricité, eau et matériel. Elle ne se compare cependant pas, requête pour requête, aux flux d’une aciérie, du transport mondial ou de l’industrie lourde. Évite surtout le gaspillage : dix générations inutiles, des vidéos artificielles jetables et des calculs lancés sans objectif. Un outil bien utilisé peut éviter des déplacements, des prototypes et des heures de travail inutiles.</p>
<p>Le bon prompt n’est pas une formule magique. C’est une demande pensée par quelqu’un qui sait ce qu’il veut.</p>
$lesson$,0);
    end if;
  end if;

  -- Ressources devient une bibliothèque à trois entrées.
  select id into v_chapter from public.chapters where pillar_id=v_pillar and title='Ressources' and is_visible limit 1;
  if v_chapter is not null then
    delete from public.modules where chapter_id=v_chapter;

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Documentaires','Voir le réel, puis vérifier ce que le montage cherche à faire croire.',8,0,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Un documentaire donne des visages, des lieux et une histoire à un sujet. Il peut ouvrir une porte qu’un livre n’aurait jamais réussi à faire franchir. Mais il reste un récit monté : des centaines d’heures coupées pour défendre une ligne en quatre-vingt-dix minutes.</p>
<p>Regarde qui finance, qui parle, qui reste absent et quelle image sert de preuve à la place d’une donnée. Note les affirmations importantes, puis cherche l’étude ou le document d’origine. Un bon documentaire te donne envie d’enquêter. Un mauvais exige que tu applaudisses avant le générique.</p>
$lesson$,0);

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Produits','Acheter moins, vérifier davantage et choisir ce qui sert réellement.',8,1,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Les produits cités dans l’Académie répondent à un usage précis : cuisiner, dormir, s’habiller, filtrer, bouger ou remplacer une formule inutilement chargée. Ils ne sont pas une collection à acheter d’un coup.</p>
<p>Avant chaque achat, vérifie la matière, la composition, la durée de vie, la réparabilité et le prix ramené à l’usage. Cherche ensuite une version locale ou d’occasion lorsqu’elle remplit le même rôle. Le meilleur produit est souvent celui qui supprime trois achats plus fragiles.</p>
$lesson$,0);

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Livres','Construire une bibliothèque qui résiste aux tendances.',9,2,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Lis les livres qui ont survécu à leur époque et ceux qui décrivent un domaine depuis le terrain. Commence par les textes plutôt que par les résumés : Marc Aurèle, Épictète, Montaigne, Diogène à travers ses témoins, Descartes, Kant, Schopenhauer et les travaux d’anthropologie accessibles en édition sérieuse.</p>
<p>Un livre utile doit laisser une trace dans ta conduite. Souligne peu. Écris sur une fiche l’idée, l’argument, ce que tu contestes et l’action que cela change. Relis ces fiches six mois plus tard : tu verras quelles idées ont tenu.</p>
$lesson$,0);
  end if;

  -- Sens disparaît et devient Relations.
  select id into v_chapter from public.chapters where pillar_id=v_pillar and title='Sens' and is_visible limit 1;
  if v_chapter is null then select id into v_chapter from public.chapters where pillar_id=v_pillar and title='Relations' and is_visible limit 1; end if;
  if v_chapter is not null then
    update public.chapters set title='Relations',category='Relations',description='Choisir, nourrir et protéger les liens qui comptent.',visual_key='relations' where id=v_chapter;
    delete from public.modules where chapter_id=v_chapter;

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Famille','Rester loyal sans laisser les non-dits détruire le lien.',12,0,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>La famille est le premier groupe qui t’a porté avant que tu puisses rendre quoi que ce soit. Elle n’est pas toujours juste, douce ou facile. La loyauté ne consiste pas à nier ses fautes ; elle consiste à ne pas traiter le lien comme un abonnement que l’on résilie au premier désaccord.</p>
<p>Appelle sans attendre une raison. Aide avant qu’on te supplie. Apprends les histoires, les recettes, les lieux et les gestes qui disparaîtront avec les plus âgés. Si un conflit existe, parle du fait précis et de ce que tu veux réparer. Ne recrute pas toute la famille pour gagner un duel.</p>
<p>Une limite peut être nécessaire face à la violence, l’humiliation ou l’emprise. Pose-la clairement, sans spectacle et sans transformer chaque maladresse en motif d’exil. Tu regretteras parfois d’avoir trop donné. Il est souvent plus lourd de découvrir qu’il est trop tard pour refaire un geste simple.</p>
$lesson$,0);

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Amitié','Reconnaître un allié et devenir quelqu’un que l’on veut garder près de soi.',12,1,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Un ami n’est pas un public, un carnet d’adresses ou une présence que l’on active quand tout va mal. C’est quelqu’un dont la réussite ne diminue pas la tienne, qui peut te contredire sans t’humilier et que tu aides même lorsqu’aucune récompense n’est visible.</p>
<p>Chez STOA, nous ne construisons pas notre doctrine sur l’idée d’une amitié homme-femme parfaitement désintéressée. Le désir, l’argent, le statut, l’attention ou l’espoir d’une relation future finissent souvent par entrer dans l’équation, même lorsqu’ils ne sont pas avoués. Ne mens ni à l’autre, ni à ton partenaire, ni à toi-même sur ce que tu attends réellement.</p>
<p>Cette doctrine demande surtout de la clarté. N’entretiens pas une ambiguïté pour conserver une réserve d’attention. Ne joue pas au confident dans l’espoir qu’une fragilité ouvre une porte. Si l’attirance existe, nomme-la ou prends de la distance. Une relation honnête vaut mieux qu’un lien maintenu par une promesse cachée.</p>
<p>Pour entretenir une amitié, crée des rendez-vous, partage du travail et du mouvement, rends service, célèbre les victoires et parle vite après une blessure. La proximité ne survit pas seulement avec des souvenirs.</p>
$lesson$,0);

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Amour','Bâtir un couple sur le sentiment, la vérité et les gestes répétés.',13,2,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>L’amour n’est pas un tableau où deux candidats comparent leurs revenus, leurs performances et leur valeur sociale. L’admiration, la complémentarité et un projet commun peuvent fortifier le couple ; ils ne doivent pas remplacer le sentiment.</p>
<p>Choisis quelqu’un avec qui tu peux être vrai sans devenir négligent. Le couple demande de rester désirable, fiable et curieux de l’autre. Il demande aussi d’accepter que la personne aimée change sans conclure immédiatement qu’elle a rompu le contrat.</p>
<p>Entretiens le lien par des gestes simples : un repas sans écran, une marche, une attention précise, une intimité protégée, une conversation qui ne sert pas uniquement à gérer le ménage. Ne garde pas un dossier secret des fautes. Parle d’un problème assez tôt pour qu’il reste un problème et ne devienne pas l’identité de l’autre.</p>
<p>Ne choisis pas sous la peur d’être seul. Définis ce que tu veux offrir, ce que tu refuses de faire subir et la vie quotidienne que tu veux réellement vivre. Ensuite, agis de manière à mériter la relation que tu demandes.</p>
$lesson$,0);
  end if;

  -- Longévité : nouvelle structure.
  select id into v_long from public.chapters where pillar_id=v_pillar and title='Longévité' and is_visible limit 1;
  if v_long is not null then
    delete from public.modules where chapter_id=v_long;

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_long,'Nos ancêtres','Comprendre pourquoi une espérance de vie basse ne signifie pas mourir vieux à trente ans.',11,0,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>« Avant, tout le monde mourait à trente ans » confond une moyenne à la naissance avec l’âge réel des adultes. Beaucoup d’enfants mouraient avant cinq ans. Ces décès tiraient brutalement l’espérance de vie vers le bas. Celui qui traversait l’enfance ne recevait pas une condamnation automatique à trente ans.</p>
<p>Dans les populations de chasseurs-cueilleurs étudiées, la mort adulte se concentre souvent autour de la fin de la soixantaine ou de la septantaine. Des personnes âgées existaient, transmettaient des lieux, des plantes, des alliances et des techniques. Elles étaient moins nombreuses parce que les infections, les blessures, l’accouchement, la violence et l’absence de soins emportaient davantage de monde en chemin.</p>
<p>Le monde ancestral n’était pas un paradis. Il montre cependant quelque chose : marcher, porter, vivre dehors, appartenir à un groupe et manger des aliments peu transformés sont compatibles avec une longue vie humaine. La médecine moderne a retiré de nombreux risques aigus ; elle n’annule pas le besoin d’un corps utilisé.</p>
<p><u>Sources:</u></p>
<ul><li><a href="https://pubmed.ncbi.nlm.nih.gov/18322914/" target="_blank" rel="noopener noreferrer">Longévité chez les chasseurs-cueilleurs</a></li></ul>
$lesson$,0);

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_long,'Durer dans le temps','Faire de la longévité la conséquence d’une vie solide.',12,1,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>La longévité ne se commande pas avec une gélule. Elle apparaît lorsque suffisamment de systèmes restent capables : cœur, muscles, os, cerveau, immunité, sommeil et liens sociaux.</p>
<p>Les conseils de STOA travaillent dans cette direction : aliments bruts, protéines et énergie suffisantes, marche, force, lumière du jour, sommeil régulier, exposition réduite au tabac et à l’alcool, capacité à cuisiner, relations entretenues et raison de se lever. Aucun de ces gestes ne garantit un âge. Ensemble, ils évitent de sacrifier le présent au nom d’une vieillesse théorique.</p>
<p>Les habitants d’Ikaria, de Sardaigne, d’Okinawa ou de Nicoya ont été étudiés pour leur nombre de personnes très âgées. Les détails changent, mais on retrouve du mouvement intégré à la journée, des repas peu industriels, une place pour les anciens, des liens fréquents et un environnement qui ne demande pas de planifier chaque occasion de marcher. Les Tsimané, très actifs et peu exposés à l’alimentation industrielle, présentent aussi une santé artérielle remarquable malgré d’autres risques infectieux.</p>
<p>Ne copie pas un aliment exotique. Reproduis la structure : utilise ton corps, mange ce que tu reconnais, reste utile à un groupe, protège ton sommeil et garde des projets plus longs que la semaine.</p>
<p><u>Sources:</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35780634/" target="_blank" rel="noopener noreferrer">Régions de longévité et facteurs de mode de vie</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/28320601/" target="_blank" rel="noopener noreferrer">Santé artérielle chez les Tsimané</a></li>
</ul>
$lesson$,0);

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_long,'Routine','Votre routine de longévité, à construire dans l’éditeur.',8,2,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours','',0);
  end if;

  -- Insérer le parcours anti-addiction avant Longévité.
  if not exists(select 1 from public.chapters where pillar_id=v_pillar and title='Parcours Anti addiction' and is_visible) then
    if v_long is not null then update public.chapters set order_index=21 where id=v_long; end if;
    insert into public.chapters(pillar_id,category,title,description,order_index,is_visible,visual_key)
    values(v_pillar,'Autonomie','Parcours Anti addiction','Retirer l’accès, traverser le manque et reconstruire une vie qui n’appelle plus la fuite.',20,true,'autonomie')
    returning id into v_chapter;

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Comprendre la boucle','Voir le signal, le rituel et la récompense avant d’essayer de les briser.',10,0,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Une addiction n’est pas seulement un manque de volonté. C’est une boucle devenue plus rapide que la réflexion : une tension apparaît, un geste promet un soulagement, puis le cerveau apprend à réclamer ce raccourci plus tôt.</p>
<p>Pendant sept jours, note l’heure, le lieu, l’émotion, la personne présente et ce qui s’est passé juste avant. Ne cherche pas encore à devenir parfait. Cherche le mécanisme. Tu verras souvent quelques portes répétées : fatigue, solitude, argent disponible, téléphone au lit, trajet, dispute ou ennui.</p>
$lesson$,0);

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Couper les accès','Faire disparaître les décisions inutiles avant que l’envie arrive.',10,1,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Ne garde pas la tentation à dix centimètres pour prouver ta force. Jette le stock, bloque les applications, retire les moyens de paiement enregistrés, change le trajet, quitte les groupes et demande à une personne de tenir la barrière avec toi.</p>
<p>Remplis aussi le vide matériel : eau gazeuse à la place de l’alcool, téléphone hors de la chambre, promenade à l’heure du pari, repas prêt avant la faim, activité manuelle lorsque l’écran appelle. Une barrière sans remplacement laisse simplement un trou.</p>
$lesson$,0);

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Traverser le manque','Laisser une envie monter et redescendre sans lui obéir.',10,2,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Une envie ressemble à une vague : elle monte, donne l’impression de ne jamais finir, puis redescend. Mets dix minutes entre l’impulsion et le geste. Marche, respire, bois, appelle quelqu’un et observe où la tension vit dans le corps.</p>
<p>Certains sevrages, notamment d’alcool ou de benzodiazépines après une consommation régulière, peuvent être dangereux. Là, ne joue pas au héros solitaire. Organise le sevrage avec une personne qualifiée et un entourage prévenu.</p>
$lesson$,0);

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Reconstruire','Remplacer la fuite par une vie qui produit de vraies récompenses.',11,3,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Retirer une addiction libère du temps, mais le temps vide devient vite dangereux. Remets du mouvement, des repas, des rendez-vous, un travail manuel, un projet et du sommeil à des heures fixes. Cherche des récompenses lentes qui laissent quelque chose après elles.</p>
<p>Une rechute n’efface pas le travail. Elle montre une porte restée ouverte. Note le déclencheur, ferme l’accès et reprends immédiatement. Le véritable échec serait d’utiliser une faute comme permission de tout abandonner.</p>
$lesson$,0);
  end if;
end;
$$;

do $$
declare
  v_chapter uuid;
  v_module uuid;
begin
  select id into v_chapter from public.chapters where title='Approvisionnement et Cuisine' and is_visible limit 1;
  if v_chapter is null then return; end if;

  if not exists(select 1 from public.modules where chapter_id=v_chapter and title='Fermentation et levain') then
    update public.modules set order_index=order_index+100 where chapter_id=v_chapter;
    update public.modules set order_index=order_index-99 where chapter_id=v_chapter;
    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Fermentation et levain','Faire travailler le temps, les levures et les bactéries avant de cuisiner.',13,0,true)
    returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Fermenter, c’est laisser des micro-organismes transformer un aliment avant de le manger. Ils acidifient, développent des arômes, modifient la texture et freinent une partie des microbes indésirables. C’était une méthode de conservation bien avant de devenir une tendance.</p>
<p><u><b>Le levain</b></u></p>
<p>Mélange 50 g de farine de seigle ou de blé complète avec 50 g d’eau non chlorée. Couvre sans fermer hermétiquement. Chaque jour, garde 50 g du mélange et ajoute 50 g d’eau puis 50 g de farine. Lorsqu’il double en quatre à huit heures et sent légèrement le yaourt, le fruit ou le vinaigre doux, il est prêt.</p>
<p><u><b>Le pain au levain</b></u></p>
<ul>
  <li>500 g de farine</li>
  <li>350 g d’eau</li>
  <li>100 g de levain actif</li>
  <li>10 g de sel</li>
</ul>
<p>Mélange, laisse reposer trente minutes, puis replie la pâte trois ou quatre fois sur deux heures. Laisse lever jusqu’à ce qu’elle devienne plus légère, façonne et garde une nuit au réfrigérateur. Cuisson en cocotte très chaude : vingt minutes couverte, puis vingt à trente minutes découverte.</p>
<p><u><b>Légumes lactofermentés</b></u></p>
<p>Pèse les légumes et l’eau, puis ajoute 2 % de sel. Garde les légumes entièrement sous la saumure avec un poids propre. Ferme le bocal et laisse fermenter quelques jours à température ambiante avant de placer au frais. Une odeur franchement putride, une moisissure colorée ou une texture anormale signifie que le lot part à la poubelle.</p>
<p><u><b>Kéfir de lait</b></u></p>
<p>Ajoute les grains à du lait, couvre et laisse vingt-quatre heures environ à température ambiante. Filtre, conserve les grains et place la boisson au frais. Utilise du matériel propre et repars d’une culture saine plutôt que d’improviser avec une fermentation douteuse.</p>
<p>Le temps fait le travail, pas la négligence. Un bocal propre, une température cohérente, assez de sel et l’absence d’air autour des légumes rendent la fermentation beaucoup plus prévisible.</p>
$lesson$,0);
  end if;

  select m.id into v_module from public.modules m where m.chapter_id=v_chapter and m.title='Idées de recettes' limit 1;
  if v_module is not null then
    delete from public.subchapters where module_id=v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$recipes$
<p>Des recettes courtes, denses et reproductibles. Les quantités servent de point de départ : adapte ensuite à ta faim.</p>

<p><u><b>Chocolat chaud optimal</b></u></p>
<ul><li>250 ml de lait entier</li><li>20 g de chocolat noir</li><li>1 jaune d’œuf</li><li>Une pincée de sel</li></ul>
<p>Chauffe doucement le lait et le chocolat. Coupe le feu, ajoute le jaune en fouettant puis le sel. Ne fais plus bouillir.</p>

<p><u><b>Bouillon de poulet riche en collagène</b></u></p>
<ul><li>Une carcasse de poulet avec les articulations</li><li>Deux litres d’eau</li><li>Sel, ail et herbes</li></ul>
<p>Couvre d’eau, porte à frémissement et laisse cuire trois à six heures. Filtre. Le bouillon doit gélifier au froid ; garde-le trois jours au réfrigérateur ou congèle-le en portions.</p>

<p><u><b>Suif de bœuf</b></u></p>
<p>Coupe le gras de rognon en petits morceaux. Fais fondre à feu très doux jusqu’à ce que les morceaux deviennent dorés. Filtre dans un bocal sec et garde à l’abri de la chaleur. Utilise-le pour saisir une viande, rôtir des pommes de terre ou graisser une poêle.</p>

<p><u><b>Beurre clarifié — ghee</b></u></p>
<p>Fais fondre le beurre à feu doux sans remuer. Écume la mousse, laisse les protéines tomber au fond puis filtre la partie jaune et limpide. Arrête avant que les dépôts brunissent si tu veux un goût neutre.</p>

<p><u><b>Œufs cocotte au foie</b></u></p>
<ul><li>Deux œufs</li><li>40 g de foie de volaille</li><li>Une cuillère de crème crue</li><li>Sel et poivre</li></ul>
<p>Saisis le foie une minute au beurre. Dépose-le dans un ramequin avec la crème, casse les œufs dessus et cuis au bain-marie jusqu’à ce que le blanc prenne en gardant le jaune coulant.</p>

<p><u><b>Sardines croustillantes au beurre</b></u></p>
<ul><li>Sardines entières vidées</li><li>Beurre clarifié</li><li>Citron et sel</li></ul>
<p>Sèche très bien les sardines. Pose-les dans une poêle chaude avec le beurre clarifié, trois minutes par face. Sale après cuisson et termine avec quelques gouttes de citron.</p>

<p><u><b>Galettes de bœuf au cœur</b></u></p>
<ul><li>400 g de bœuf haché</li><li>100 g de cœur haché finement</li><li>Un jaune d’œuf</li><li>Sel</li></ul>
<p>Mélange sans écraser longtemps, forme quatre galettes et cuis sur une poêle très chaude. Le cœur disparaît dans la texture tout en ajoutant une saveur plus profonde.</p>

<p><u><b>Riz au bouillon et jaunes d’œufs</b></u></p>
<ul><li>Un volume de riz</li><li>Deux volumes de bouillon</li><li>Deux jaunes d’œufs</li><li>Beurre et sel</li></ul>
<p>Cuis le riz dans le bouillon jusqu’à absorption. Hors du feu, ajoute le beurre puis les jaunes en remuant rapidement. Mange immédiatement.</p>

<p><u><b>Pommes rôties au beurre salé</b></u></p>
<ul><li>Deux pommes</li><li>30 g de beurre salé</li><li>Cannelle facultative</li></ul>
<p>Coupe les pommes en quartiers, enrobe-les de beurre et enfourne à 190 °C jusqu’à ce que les bords caramélisent. Sers avec du yaourt entier ou de la crème crue.</p>

<p><u><b>Glace minute banane–crème crue</b></u></p>
<ul><li>Deux bananes mûres congelées en rondelles</li><li>Deux cuillères de crème crue</li><li>Une pincée de sel</li></ul>
<p>Mixe par impulsions jusqu’à obtenir une texture lisse. Mange aussitôt ou replace vingt minutes au congélateur pour une texture plus ferme.</p>
$recipes$,0);
  end if;
end;
$$;

-- La leçon des pieds cite déjà la balle, mais n'expliquait ni l'automassage ni la respiration.
update public.subchapters s
set content = s.content || $lesson$
<p><b>Respire par le nez</b></p>
<p>Le nez filtre, réchauffe et humidifie l’air avant son arrivée dans les poumons. La respiration buccale habituelle assèche la bouche, favorise les ronflements, fragmente le sommeil et augmente les problèmes dentaires. Pendant la marche et les efforts faciles, garde les lèvres fermées et laisse le nez imposer le rythme. Si tu dois ouvrir la bouche dès les premières minutes, ralentis.</p>
<p>La nuit, commence par libérer ce qui empêche réellement le passage de l’air : congestion, allergènes, chambre trop sèche ou position. Ne colle pas ta bouche si ton nez est obstrué et ne transforme pas un ruban adhésif en solution à une obstruction.</p>
<p><u>Sources:</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/24287192/" target="_blank" rel="noopener noreferrer">Respiration buccale et santé orale</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/32108915/" target="_blank" rel="noopener noreferrer">Respiration buccale, sommeil et voies aériennes</a></li>
</ul>
$lesson$
from public.modules m, public.chapters c
where s.module_id=m.id and m.chapter_id=c.id and m.title='Posture et position'
  and s.content not like '%Respire par le nez%';

do $$
declare
  v_chapter uuid;
  v_module uuid;
  v_order integer;
begin
  -- Le protocole des pieds ne donne aucune méthode d'automassage : cette leçon complète donc le geste.
  select id into v_chapter from public.chapters where title='Mouvement' and is_visible limit 1;
  if v_chapter is not null and not exists(select 1 from public.modules where chapter_id=v_chapter and title='Relâchement myofascial') then
    select coalesce(max(order_index),-1)+1 into v_order from public.modules where chapter_id=v_chapter;
    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Relâchement myofascial','Utiliser une balle et le poids du corps pour rendre du mouvement aux zones raides.',10,v_order,true)
    returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Une balle d’automassage ne « casse » pas un nœud et ne décolle pas magiquement un fascia. Elle applique une pression, change momentanément la sensation, augmente souvent l’amplitude et te permet de bouger plus librement juste après. Utilise cette fenêtre pour refaire le geste qui était limité.</p>
<p><b>Le protocole :</b></p>
<ul>
  <li>Place une balle de tennis contre un mur pour les zones sensibles, au sol pour les zones épaisses.</li>
  <li>Cherche une pression supportable, autour de 5 ou 6 sur 10. Une grimace permanente signifie que tu vas trop fort.</li>
  <li>Reste trente à soixante secondes, respire lentement, puis fais de petits mouvements autour de la zone.</li>
  <li>Teste immédiatement le mouvement : flexion de cheville, rotation d’épaule, squat ou inclinaison.</li>
</ul>
<p>Travaille la voûte plantaire sans écraser le talon, les mollets contre un mur, les fessiers au sol, les pectoraux contre le mur et le haut du dos de chaque côté de la colonne. Ne roule pas directement sur les vertèbres, l’avant du cou, une articulation enflammée, une plaie ou une douleur électrique.</p>
<p>Cinq minutes bien ciblées suffisent. Si tu passes quarante minutes à te rouler dessus sans renforcer ni utiliser l’amplitude gagnée, tu entretiens une sensation, pas une capacité.</p>
<p><u>Sources:</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/26618062/" target="_blank" rel="noopener noreferrer">Automassage, amplitude et récupération</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35991349/" target="_blank" rel="noopener noreferrer">Effets du foam rolling sur la performance et la récupération</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/31256353/" target="_blank" rel="noopener noreferrer">Ce que signifie réellement « relâchement myofascial »</a></li>
</ul>
$lesson$,0);
  end if;

  select id into v_chapter from public.chapters where title='Résilience' and is_visible limit 1;
  if v_chapter is not null and not exists(select 1 from public.modules where chapter_id=v_chapter and title='Protection anti-insectes') then
    select coalesce(max(order_index),-1)+1 into v_order from public.modules where chapter_id=v_chapter;
    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Protection anti-insectes','Empêcher moustiques, fourmis, termites et acariens de s’installer sans parfumer la maison de pesticides.',10,v_order,true)
    returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>La meilleure lutte contre les insectes commence avant le produit. Coupe l’accès, retire l’eau et la nourriture, puis traite seulement ce qui reste.</p>
<p><b>Moustiques</b></p>
<ul>
  <li>Vide chaque semaine les soucoupes, seaux, bâches et petits réservoirs d’eau stagnante.</li>
  <li>Pose des moustiquaires intactes aux fenêtres et une moustiquaire bordée sous le matelas lorsque tu dors dans une zone exposée.</li>
  <li>Utilise un ventilateur près du lit ou de la table : le déplacement d’air gêne leur vol et disperse le dioxyde de carbone qui les guide.</li>
  <li>Les huiles essentielles sentent fort mais protègent moins longtemps et peuvent irriter. Ne leur confie pas une zone où une maladie transmise par les moustiques circule.</li>
</ul>
<p><b>Fourmis et cafards</b></p>
<p>Pas de miettes, de fruits ouverts, de gamelle laissée toute la nuit ou de poubelle qui déborde. Range les aliments secs dans des bocaux, nettoie la graisse derrière les appareils, colmate les passages et coupe les branches qui touchent la façade. Une cuisine propre leur retire la raison de rester.</p>
<p><b>Termites</b></p>
<p>Garde le bois, le carton et le paillage loin des murs. Répare les fuites, ventile les espaces humides et évite le contact direct entre bois et sol. Une galerie, du bois creux ou des ailes abandonnées demandent un diagnostic rapide : une colonie installée dans la structure ne se règle pas avec du vinaigre.</p>
<p><b>Acariens</b></p>
<p>Aère, garde l’humidité basse, lave régulièrement les draps et laisse-les sécher complètement. Une housse intégrale à tissage serré crée une vraie barrière sans insecticide. La gamme Texaal Coton de ProtecSom permet de rester sur une enveloppe en coton non enduite plutôt que sur un traitement parfumé.</p>
<p><u>Références:</u></p>
<ul>
  <li><a href="https://www.who.int/initiatives/global-vector-control-response-2017-2030" target="_blank" rel="noopener noreferrer">OMS — prévention des maladies vectorielles</a></li>
  <li><a href="https://www.protecsom.com/produit/housse-matelas-anti-acariens-texaal-coton/" target="_blank" rel="noopener noreferrer">Housse Texaal Coton</a></li>
</ul>
$lesson$,0);
  end if;
end;
$$;
