-- Rebuild legacy three-block lessons as single editor-compatible HTML lessons.
-- Existing authored lessons are deliberately left untouched.

do $$
declare
  v_chapter_id uuid;
  v_module_id uuid;
begin
  update public.chapters
  set title = 'Sommeil', category = 'Sommeil'
  where is_visible and title = 'Récupération';

  select id into v_chapter_id
  from public.chapters
  where is_visible and title = 'Mouvement'
  order by order_index limit 1;

  if v_chapter_id is not null then
    if not exists (select 1 from public.modules where chapter_id = v_chapter_id and title = 'Prendre du muscle') then
      insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
      values(v_chapter_id,'Prendre du muscle','Construire de la masse musculaire avec une progression mesurable.',18,
        (select coalesce(max(order_index),-1)+1 from public.modules where chapter_id=v_chapter_id),true);
    end if;
    if not exists (select 1 from public.modules where chapter_id = v_chapter_id and title = 'Prendre du poids') then
      insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
      values(v_chapter_id,'Prendre du poids','Augmenter progressivement ses apports sans transformer la prise de poids en course au chiffre.',16,
        (select coalesce(max(order_index),-1)+1 from public.modules where chapter_id=v_chapter_id),true);
    end if;
  end if;

  select id into v_chapter_id
  from public.chapters
  where is_visible and title = 'Expositions'
  order by order_index limit 1;

  if v_chapter_id is not null then
    delete from public.modules where chapter_id=v_chapter_id and title='Réduire avec pragmatisme';

    update public.modules set order_index=order_index+10000 where chapter_id=v_chapter_id;
    with ordered as (
      select id,row_number() over(order by order_index,id)-1 as next_order
      from public.modules where chapter_id=v_chapter_id
    )
    update public.modules m set order_index=o.next_order from ordered o where m.id=o.id;

    update public.modules set title='Alimentation' where chapter_id=v_chapter_id and lower(title)='alimentation';
    update public.modules set title='Environnement' where chapter_id=v_chapter_id and lower(title)='environnement';
    update public.modules set title='Produits ménagers' where chapter_id=v_chapter_id and lower(title)='produits ménagers';
    update public.modules set title='Pollution' where chapter_id=v_chapter_id and lower(title)='pollution';
    update public.modules set title='Cosmétiques' where chapter_id=v_chapter_id and lower(title)='cosmétiques';
    update public.modules set title='Matériaux' where chapter_id=v_chapter_id and lower(title)='matériaux';

    if not exists (select 1 from public.modules where chapter_id=v_chapter_id and title='Champs électromagnétiques (EMF)') then
      insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
      values(v_chapter_id,'Champs électromagnétiques (EMF)','Comprendre les différentes familles de champs électromagnétiques et réduire les expositions évitables sans anxiété.',14,
        (select coalesce(max(order_index),-1)+1 from public.modules where chapter_id=v_chapter_id),true);
    end if;
  end if;
end;
$$;

create temporary table _stoa_lesson_content (
  chapter_title text not null,
  module_title text not null,
  description text not null,
  content text not null
) on commit drop;

insert into _stoa_lesson_content values
('Mouvement','Prendre du muscle','Construire de la masse musculaire avec une progression mesurable.',$lesson$
<p>Prendre du muscle ne demande ni un programme secret ni de changer d’exercices chaque semaine. Le corps construit du tissu musculaire lorsqu’il reçoit régulièrement une tension suffisante, puis du temps et des ressources pour s’adapter.</p>
<h2>Les quatre leviers qui comptent</h2>
<ol>
  <li><b>Un entraînement de résistance régulier.</b> Travaillez chaque grand groupe musculaire plusieurs fois dans la semaine avec des mouvements que vous pouvez exécuter proprement.</li>
  <li><b>Une surcharge progressive.</b> Notez vos séries. Au fil des semaines, ajoutez une répétition, un peu de charge, une série ou une meilleure amplitude. Une progression minime mais répétée vaut mieux qu’une séance héroïque.</li>
  <li><b>Des séries réellement stimulantes.</b> La plupart des séries utiles se terminent avec encore quelques répétitions possibles. Aller à l’échec sur chaque série n’est pas obligatoire et peut compliquer la récupération.</li>
  <li><b>Une récupération suffisante.</b> Les muscles ne se construisent pas pendant la série, mais pendant l’adaptation qui suit : sommeil, alimentation et jours moins exigeants font partie du programme.</li>
</ol>
<h2>Une structure simple</h2>
<p>Commencez par deux ou trois séances complètes par semaine. Dans chaque séance, placez un mouvement de jambes, une poussée, un tirage, un travail de charnière de hanche et, si vous le souhaitez, quelques exercices ciblés. Choisissez des amplitudes contrôlées et une charge qui vous permet de conserver la technique.</p>
<p>Gardez le même socle pendant plusieurs semaines. Si vous atteignez le haut de votre fourchette de répétitions avec une exécution stable, augmentez légèrement la difficulté. Si les performances régressent plusieurs séances de suite, réduisez temporairement le volume et vérifiez votre sommeil et vos apports.</p>
<h2>Nutrition</h2>
<p>Répartissez des sources de protéines sur la journée et mangez assez pour soutenir l’entraînement. Les compléments ne remplacent pas les repas : ils servent seulement à compléter un apport difficile à atteindre autrement. La créatine monohydrate est l’un des rares compléments abondamment étudiés, mais elle reste facultative.</p>
<h2>Croyances à laisser de côté</h2>
<ul>
  <li><b>« Il faut changer constamment de programme. »</b> La répétition permet de mesurer la progression.</li>
  <li><b>« Il faut obligatoirement aller à l’échec. »</b> La proximité de l’échec peut stimuler ; l’échec permanent n’est pas indispensable.</li>
  <li><b>« Plus long signifie plus efficace. »</b> Une séance courte, suivie et progressive peut suffire.</li>
  <li><b>« Les courbatures prouvent la qualité. »</b> Elles indiquent surtout une contrainte inhabituelle, pas la quantité de muscle construite.</li>
</ul>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/19204579/" target="_blank" rel="noopener noreferrer">American College of Sports Medicine — Progression models in resistance training for healthy adults</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/27433992/" target="_blank" rel="noopener noreferrer">Relation dose-réponse entre volume d’entraînement et hypertrophie musculaire</a></li>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5867436/" target="_blank" rel="noopener noreferrer">Méta-analyse sur protéines, entraînement de résistance, masse et force</a></li>
</ul>
$lesson$),
('Mouvement','Prendre du poids','Augmenter progressivement ses apports sans transformer la prise de poids en course au chiffre.',$lesson$
<p>Prendre du poids utilement consiste à créer un surplus énergétique modéré tout en donnant au corps une raison d’utiliser ces ressources : entraînement, récupération et apports protéiques suffisants. Une hausse rapide de la balance n’est pas synonyme de muscle.</p>
<h2>Commencer par mesurer</h2>
<p>Pesez-vous dans des conditions comparables, plusieurs matins par semaine, puis regardez la moyenne. Le poids varie naturellement avec l’eau, le sel, les glucides et le contenu digestif. Une seule mesure ne permet pas de conclure.</p>
<p>Si la moyenne ne progresse pas pendant deux à trois semaines, ajoutez une portion quotidienne simple : un repas un peu plus grand ou une collation composée d’un produit laitier si toléré, d’œufs, de viande, de poisson, de fruit, de miel ou d’un féculent selon votre cadre alimentaire.</p>
<h2>Rendre les apports faciles</h2>
<ul>
  <li>Conservez trois vrais repas avant de multiplier les grignotages.</li>
  <li>Ajoutez de l’énergie à des repas déjà équilibrés : huile d’olive, beurre ou ghee si toléré, œufs, fromage ou yaourt, avocat, miel, tubercules ou riz selon vos choix.</li>
  <li>Utilisez ponctuellement des aliments faciles à consommer lorsque l’appétit est faible, sans remplacer systématiquement la mastication par des calories liquides.</li>
  <li>Continuez la musculation et suivez aussi les performances, les mensurations et la manière dont les vêtements tombent.</li>
</ul>
<h2>Ce qui échoue souvent</h2>
<p>Le « dirty bulk » — manger sans limite sous prétexte de construire du muscle — ajoute surtout une prise de graisse difficile à corriger ensuite. À l’inverse, vouloir une alimentation si parfaite qu’elle devient insuffisante empêche toute progression. Ajustez une variable à la fois et laissez-lui assez de temps.</p>
<p>Une perte de poids involontaire, une absence persistante d’appétit, des troubles digestifs importants ou une fatigue inexpliquée justifient un avis médical avant de chercher simplement à manger davantage.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5867436/" target="_blank" rel="noopener noreferrer">Apport protéique et adaptations à l’entraînement de résistance</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/19204579/" target="_blank" rel="noopener noreferrer">Principes de progression en entraînement de résistance</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/23679146/" target="_blank" rel="noopener noreferrer">Vitesse de prise de poids et composition corporelle chez des sportifs</a></li>
</ul>
$lesson$),
('Sommeil','Comprendre son sommeil','Comprendre les rythmes, les besoins et les signaux d’un sommeil insuffisant.',$lesson$
<p>Le sommeil n’est pas une interruption de la journée. C’est un état actif pendant lequel se succèdent plusieurs phases, avec des rôles complémentaires pour la mémoire, la régulation émotionnelle, l’immunité et la récupération physique.</p>
<h2>Deux systèmes travaillent ensemble</h2>
<p>La pression de sommeil augmente avec le temps passé éveillé. L’horloge circadienne, elle, organise sur environ vingt-quatre heures l’éveil, la température corporelle et la sécrétion de mélatonine. Une heure de lever régulière et une lumière naturelle le matin donnent à cette horloge des repères stables.</p>
<p>Chez l’adulte, dormir régulièrement moins de sept heures est associé à davantage de problèmes de santé. Cela ne signifie pas que chacun doit viser exactement le même chiffre : le besoin individuel se juge aussi à l’éveil spontané, à la vigilance, à l’humeur et à la somnolence dans la journée.</p>
<h2>Qualité et quantité</h2>
<p>Huit heures au lit ne garantissent pas huit heures de sommeil. Les réveils répétés, l’alcool, certaines douleurs, le stress ou des troubles respiratoires peuvent fragmenter la nuit. À l’inverse, se réveiller brièvement entre deux cycles est fréquent et ne constitue pas à lui seul un trouble.</p>
<h2>Trois croyances fréquentes</h2>
<ul>
  <li><b>« Je peux récupérer toute ma dette le week-end. »</b> Dormir davantage peut aider, mais ne remplace pas complètement une semaine de restriction répétée.</li>
  <li><b>« L’alcool m’aide à dormir. »</b> Il peut accélérer l’endormissement tout en fragmentant la seconde partie de nuit.</li>
  <li><b>« Je dois absolument dormir huit heures. »</b> La régularité, le fonctionnement diurne et les besoins individuels comptent autant qu’un nombre isolé.</li>
</ul>
<p>Des ronflements accompagnés de pauses respiratoires, une somnolence dangereuse, des insomnies persistantes ou des mouvements nocturnes marqués nécessitent une consultation. Les règles d’hygiène de sommeil ne remplacent pas l’évaluation d’un trouble.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4442216/" target="_blank" rel="noopener noreferrer">AASM et Sleep Research Society — durée de sommeil recommandée chez l’adulte</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/38761649/" target="_blank" rel="noopener noreferrer">Revue des composantes de l’hygiène du sommeil</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/27136449/" target="_blank" rel="noopener noreferrer">American College of Physicians — prise en charge de l’insomnie chronique</a></li>
</ul>
$lesson$),
('Sommeil','Construire son rituel du soir','Créer une transition réaliste entre la journée et le sommeil.',$lesson$
<p>Un rituel du soir n’a pas besoin d’être spectaculaire. Son intérêt est de répéter les mêmes signaux afin que le cerveau reconnaisse la transition entre activité et repos.</p>
<h2>Commencer par l’heure de lever</h2>
<p>Choisissez une heure de lever que vous pouvez conserver la plupart des jours. Exposez-vous à la lumière extérieure le matin et gardez une amplitude raisonnable le week-end. Le soir, diminuez progressivement la lumière et les activités stimulantes plutôt que d’exiger un endormissement instantané.</p>
<h2>Une séquence de 45 à 60 minutes</h2>
<ol>
  <li>Terminez le travail et notez ce qui devra être repris demain.</li>
  <li>Préparez l’environnement : chambre fraîche, sombre, silencieuse et téléphone éloigné si ses notifications vous sollicitent.</li>
  <li>Adoptez un geste répétable : douche tiède, lecture, respiration calme ou quelques mouvements légers.</li>
  <li>Allez au lit lorsque la somnolence apparaît, pas uniquement parce que l’horloge l’ordonne.</li>
</ol>
<h2>Les perturbateurs les plus courants</h2>
<ul>
  <li><b>Caféine :</b> sa durée d’action est longue. Si votre sommeil est fragile, avancez la dernière prise et observez l’effet pendant deux semaines.</li>
  <li><b>Alcool :</b> il peut rendre somnolent mais détériore souvent la continuité du sommeil.</li>
  <li><b>Écrans :</b> la lumière compte, mais le contenu, les notifications et le temps volé au sommeil comptent aussi.</li>
  <li><b>Repas :</b> un repas très lourd juste avant le coucher peut gêner certaines personnes. Évitez également d’aller au lit affamé si cela vous réveille.</li>
</ul>
<p>Si vous restez longtemps éveillé avec une tension croissante, quittez brièvement le lit, choisissez une activité calme sous une lumière faible, puis revenez lorsque la somnolence revient. En cas d’insomnie chronique, la thérapie cognitivo-comportementale de l’insomnie constitue le traitement de première intention.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/38761649/" target="_blank" rel="noopener noreferrer">Revue bibliographique de l’hygiène du sommeil</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/27136449/" target="_blank" rel="noopener noreferrer">Recommandation clinique sur l’insomnie chronique</a></li>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4442216/" target="_blank" rel="noopener noreferrer">Consensus AASM/SRS sur la durée du sommeil</a></li>
</ul>
$lesson$),
('Sommeil','Cartographier son énergie','Repérer les variations d’énergie avant de chercher à les corriger.',$lesson$
<p>La sensation d’énergie n’est pas constante. Elle varie avec l’heure, le sommeil, l’activité, les repas, la charge mentale, le cycle menstruel, la maladie et l’environnement. Avant d’ajouter des stimulants ou une nouvelle routine, observez votre propre rythme.</p>
<h2>Le relevé sur sept jours</h2>
<p>Trois fois par jour, notez rapidement :</p>
<ul>
  <li>votre énergie de 1 à 10 ;</li>
  <li>votre niveau de concentration ;</li>
  <li>la durée et la qualité perçue du sommeil ;</li>
  <li>les repas, la caféine et l’activité physique ;</li>
  <li>les événements inhabituels : stress, déplacement, douleur ou début d’infection.</li>
</ul>
<p>À la fin de la semaine, cherchez des tendances plutôt qu’une cause unique. À quelles heures êtes-vous naturellement le plus alerte ? Une baisse suit-elle systématiquement un coucher tardif, un repas très copieux ou plusieurs heures sans bouger ?</p>
<h2>Utiliser la carte</h2>
<p>Placez le travail complexe dans vos périodes les plus stables lorsque c’est possible. Réservez les tâches automatiques aux creux prévisibles. Une marche, de la lumière extérieure, de l’eau ou un repas adapté peuvent soutenir la vigilance, mais une fatigue chronique ne se corrige pas toujours par davantage de discipline.</p>
<p>Une fatigue persistante, brutale ou associée à un essoufflement, une perte de poids, une humeur très altérée ou d’autres symptômes doit être évaluée par un professionnel de santé.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4442216/" target="_blank" rel="noopener noreferrer">Sommeil suffisant et fonctionnement diurne</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/38761649/" target="_blank" rel="noopener noreferrer">Facteurs comportementaux et environnementaux du sommeil</a></li>
</ul>
$lesson$),
('Sommeil','Gérer ses ressources','Ajuster l’effort à la récupération disponible.',$lesson$
<p>Votre temps, votre attention et votre capacité physique ne sont pas interchangeables. Gérer ses ressources consiste à choisir où placer l’effort, puis à créer assez de marge pour absorber les imprévus.</p>
<h2>Charge et récupération</h2>
<p>La charge totale inclut le travail, les études, l’entraînement, les responsabilités familiales, les déplacements et les tensions émotionnelles. Le corps ne classe pas parfaitement ces demandes par catégorie. Lorsque plusieurs charges montent en même temps, conserver exactement le même niveau d’exigence partout finit souvent par dégrader le sommeil et les performances.</p>
<h2>Le budget minimal viable</h2>
<ul>
  <li>Protégez une fenêtre de sommeil réaliste.</li>
  <li>Conservez quelques repas simples que vous pouvez préparer même pendant une semaine dense.</li>
  <li>Prévoyez une version courte de votre entraînement plutôt que l’alternative « séance parfaite ou rien ».</li>
  <li>Laissez chaque semaine un espace non affecté pour les imprévus.</li>
</ul>
<p>Chaque dimanche, choisissez une priorité principale, deux éléments à maintenir et une chose que vous acceptez de reporter. Si votre énergie baisse, réduisez d’abord ce qui est facultatif avant de rogner automatiquement sur le sommeil.</p>
<h2>Repos ou évitement ?</h2>
<p>Le repos restaure et permet de reprendre. L’évitement soulage à court terme mais agrandit souvent la difficulté. Pour les distinguer, donnez au repos une durée et une intention : « je marche vingt minutes, je dîne, puis je décide si je fais la version courte ». Cette structure évite autant l’acharnement que l’abandon.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4442216/" target="_blank" rel="noopener noreferrer">Consensus sur sommeil et santé chez l’adulte</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/41523151/" target="_blank" rel="noopener noreferrer">Revue des comportements et modes de vie associés au sommeil</a></li>
</ul>
$lesson$);

insert into _stoa_lesson_content values
('Expositions','Comprendre l’exposition','Cartographier les expositions avant de choisir lesquelles réduire.',$lesson$
<p>Une exposition est le contact avec un agent physique, chimique ou biologique. Son existence ne suffit pas à définir un danger réel : la dose, la durée, la voie d’entrée, la fréquence, la vulnérabilité individuelle et le niveau de preuve changent l’interprétation.</p>
<h2>La carte complète</h2>
<ul>
  <li><b>Air :</b> particules fines, fumée, gaz de combustion, ozone, pollens, moisissures et composés organiques volatils.</li>
  <li><b>Eau :</b> contaminants microbiologiques ou chimiques, plomb issu de certaines canalisations, sous-produits de traitement selon le réseau.</li>
  <li><b>Alimentation :</b> agents microbiologiques, alcool, contaminants environnementaux, résidus, substances formées par certaines cuissons, emballages et additifs autorisés.</li>
  <li><b>Logement :</b> humidité, poussières, acariens, radon selon la zone, produits ménagers, matériaux, bruit, lumière nocturne et température.</li>
  <li><b>Travail et loisirs :</b> solvants, poussières, métaux, bruit, vibrations, UV, fumées, pesticides ou agents biologiques selon l’activité.</li>
  <li><b>Cosmétiques et textiles :</b> allergènes parfumants, conservateurs, colorants, colles, traitements et produits de lavage.</li>
  <li><b>Rayonnements :</b> rayonnements ionisants, ultraviolet solaire et champs électromagnétiques non ionisants.</li>
  <li><b>Biologique :</b> virus, bactéries, parasites, animaux, insectes et allergènes.</li>
  <li><b>Comportemental et social :</b> tabac, alcool, manque de sommeil, sédentarité, stress chronique, isolement et contraintes économiques.</li>
</ul>
<h2>Prioriser</h2>
<p>Commencez par les expositions dont le risque est bien établi, la fréquence élevée et l’action simple : tabac, mauvaise ventilation lors d’une combustion, soleil excessif, bruit intense, moisissure persistante ou produit irritant utilisé chaque jour. Une réduction partielle mais durable vaut mieux qu’une recherche anxieuse de « zéro toxine ».</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.who.int/health-topics/air-pollution" target="_blank" rel="noopener noreferrer">OMS — pollution de l’air et santé</a></li>
  <li><a href="https://www.who.int/news-room/questions-and-answers/item/radiation-electromagnetic-fields" target="_blank" rel="noopener noreferrer">OMS — champs électromagnétiques</a></li>
  <li><a href="https://iris.who.int/bitstream/handle/10665/164348/9789289041683-eng.pdf" target="_blank" rel="noopener noreferrer">OMS — humidité, moisissures et air intérieur</a></li>
</ul>
$lesson$),
('Expositions','Alimentation','Réduire les expositions alimentaires qui comptent réellement.',$lesson$
<p>L’alimentation expose naturellement à des micro-organismes, des contaminants environnementaux et des substances produites pendant la préparation. Le risque dépend de la dose et du contexte. Une alimentation sûre ne suppose pas de craindre chaque ingrédient.</p>
<h2>Les priorités</h2>
<ul>
  <li><b>Hygiène :</b> mains propres, séparation cru/cuit, respect de la chaîne du froid et cuisson adaptée aux personnes vulnérables.</li>
  <li><b>Variété :</b> alterner les espèces de poissons, les sources de protéines et les végétaux évite de concentrer toujours le même contaminant.</li>
  <li><b>Cuisson :</b> évitez de carboniser régulièrement les viandes et retirez les parties brûlées. Une cuisson dorée n’est pas une cuisson noire.</li>
  <li><b>Alcool :</b> il n’existe pas de niveau totalement sans risque pour la santé. Réduire fréquence et quantité est une action à fort rendement.</li>
  <li><b>Emballages :</b> ne chauffez pas un contenant qui n’est pas prévu pour cela et remplacez les récipients très abîmés.</li>
</ul>
<h2>Bio, lavage et pesticides</h2>
<p>Le bio modifie certaines pratiques agricoles mais ne rend pas un aliment stérile ni automatiquement supérieur sur tous les critères. Lavez les fruits et légumes à l’eau potable, retirez les parties abîmées et conservez-les correctement. Les savons et désinfectants ne sont pas destinés au lavage des aliments.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.who.int/news-room/fact-sheets/detail/food-safety" target="_blank" rel="noopener noreferrer">OMS — sécurité sanitaire des aliments</a></li>
  <li><a href="https://www.who.int/news-room/fact-sheets/detail/alcohol" target="_blank" rel="noopener noreferrer">OMS — alcool et santé</a></li>
  <li><a href="https://www.anses.fr/fr/content/les-recommandations-sur-lalimentation-lactivite-physique-et-la-sedentarite" target="_blank" rel="noopener noreferrer">Anses — repères alimentaires et activité</a></li>
</ul>
$lesson$),
('Expositions','Environnement','Agir sur l’air, l’eau, le bruit, la lumière et les agents biologiques.',$lesson$
<p>Notre environnement quotidien associe plusieurs expositions. La meilleure stratégie consiste à traiter les sources identifiables avant d’acheter des appareils ou des produits supposés « purifier ».</p>
<h2>À l’intérieur</h2>
<ul>
  <li>Ventilez après la cuisine, la douche, le ménage, le bricolage ou l’arrivée d’un meuble neuf.</li>
  <li>Réparez les infiltrations et séchez les zones humides. Une moisissure récurrente signale un problème d’eau ou de ventilation.</li>
  <li>Entretenez les appareils de chauffage et les détecteurs de fumée et de monoxyde de carbone.</li>
  <li>Évitez de parfumer l’air pour masquer une odeur : cherchez sa source.</li>
</ul>
<h2>À l’extérieur</h2>
<p>Consultez les alertes locales en période de forte pollution ou de pollen si vous êtes sensible. Éloignez l’activité intense des axes très circulés lorsque vous avez une alternative. Protégez peau et yeux lors d’une exposition solaire importante, sans éviter toute vie extérieure.</p>
<h2>Bruit et lumière</h2>
<p>Le bruit élevé peut léser l’audition ; la durée d’exposition compte autant que l’intensité. Utilisez une protection adaptée lors de travaux, concerts ou tirs. La nuit, limitez la lumière qui perturbe votre sommeil : rideaux, sources faibles et notifications réduites.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.who.int/health-topics/air-pollution" target="_blank" rel="noopener noreferrer">OMS — pollution de l’air</a></li>
  <li><a href="https://iris.who.int/bitstream/handle/10665/164348/9789289041683-eng.pdf" target="_blank" rel="noopener noreferrer">OMS — humidité et moisissures</a></li>
  <li><a href="https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss" target="_blank" rel="noopener noreferrer">OMS — bruit et perte auditive</a></li>
</ul>
$lesson$),
('Expositions','Produits ménagers','Nettoyer efficacement avec moins de produits et moins d’aérosols.',$lesson$
<p>Un produit ménager est utile lorsqu’il remplit une fonction précise. L’accumulation de sprays, parfums d’intérieur, désinfectants et mélanges maison augmente les irritants sans garantir un logement plus sain.</p>
<h2>La méthode minimale</h2>
<ul>
  <li>Retirez d’abord la poussière et les salissures par l’action mécanique.</li>
  <li>Utilisez un produit non parfumé adapté à la surface et respectez le dosage.</li>
  <li>Réservez la désinfection aux situations qui la justifient ; nettoyer et désinfecter ne sont pas synonymes.</li>
  <li>Préférez un liquide appliqué sur un chiffon à une pulvérisation dans l’air lorsque c’est possible.</li>
  <li>Aérez et portez les protections indiquées sur l’étiquette.</li>
</ul>
<h2>Ne jamais mélanger</h2>
<p>L’eau de Javel avec un acide comme le vinaigre peut libérer du chlore gazeux. Avec l’ammoniaque, elle peut former des chloramines irritantes. Gardez chaque produit dans son emballage d’origine et hors de portée des enfants.</p>
<h2>Le mythe du « naturel sans risque »</h2>
<p>Le vinaigre, les huiles essentielles et les produits végétaux restent des substances actives. Ils peuvent irriter, sensibiliser ou abîmer certaines surfaces. Une composition courte n’exonère pas du dosage et de la ventilation.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.anses.fr/fr/system/files?file=AIR2018SA0145Ra.pdf" target="_blank" rel="noopener noreferrer">Anses — sprays et diffuseurs à base d’huiles essentielles</a></li>
  <li><a href="https://vigilanses.anses.fr/sites/default/files/VigilAnsesN11_Juillet2020_2.pdf" target="_blank" rel="noopener noreferrer">Anses — composés volatils et produits domestiques</a></li>
  <li><a href="https://www.cdc.gov/chemical-emergencies/about/about-chlorine-gas.html" target="_blank" rel="noopener noreferrer">CDC — risques liés au chlore gazeux</a></li>
</ul>
$lesson$),
('Expositions','Pollution','Réduire sa dose de pollution sans s’isoler du monde extérieur.',$lesson$
<p>La pollution de l’air comprend notamment les particules fines, le dioxyde d’azote, l’ozone et les produits de combustion. Elle vient du trafic, du chauffage, de l’industrie, de l’agriculture, des incendies et aussi de certaines activités intérieures.</p>
<h2>Réduire l’exposition quotidienne</h2>
<ul>
  <li>Consultez l’indice local lors des épisodes inhabituels, surtout en cas d’asthme ou de maladie cardio-respiratoire.</li>
  <li>Choisissez une rue parallèle moins circulée pour marcher, courir ou faire du vélo lorsque c’est possible.</li>
  <li>Aérez aux moments les plus favorables selon la circulation et la qualité de l’air locale.</li>
  <li>Évitez le ralenti des moteurs près des fenêtres et entrées d’air.</li>
  <li>Supprimez la fumée de tabac à l’intérieur et limitez les sources de combustion inutiles.</li>
</ul>
<h2>Purificateurs et masques</h2>
<p>Un filtre HEPA correctement dimensionné peut réduire les particules dans une pièce, mais ne corrige ni une moisissure, ni une fuite, ni tous les gaz. Un masque filtrant bien ajusté peut réduire l’inhalation de particules pendant un épisode marqué ; son efficacité dépend fortement de l’ajustement.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.who.int/health-topics/air-pollution" target="_blank" rel="noopener noreferrer">OMS — pollution de l’air</a></li>
  <li><a href="https://www.who.int/publications/i/item/9789240034228" target="_blank" rel="noopener noreferrer">OMS — lignes directrices mondiales sur la qualité de l’air</a></li>
  <li><a href="https://www.who.int/publications/i/item/B09440" target="_blank" rel="noopener noreferrer">OMS — pollution de l’air domestique</a></li>
</ul>
$lesson$),
('Expositions','Cosmétiques','Choisir moins de produits, mieux tolérés et mieux compris.',$lesson$
<p>Les cosmétiques vendus légalement dans l’Union européenne sont encadrés, mais « autorisé » ne signifie pas qu’aucune personne ne peut réagir. Le problème le plus fréquent n’est pas une mystérieuse accumulation de toxines : ce sont les irritations, allergies de contact et mauvais usages.</p>
<h2>Lire l’étiquette</h2>
<ul>
  <li>La liste INCI classe généralement les ingrédients par quantité décroissante jusqu’au seuil réglementaire.</li>
  <li>« Parfum » ou « aroma » désigne un mélange ; certains allergènes doivent être indiqués séparément au-dessus de seuils définis.</li>
  <li>« Sans parabènes », « naturel » ou « clean » ne prouve pas qu’une formule est plus sûre pour votre peau.</li>
  <li>Un produit rincé et un produit laissé toute la journée n’entraînent pas la même exposition.</li>
</ul>
<h2>Une trousse sobre</h2>
<p>Commencez par un nettoyant doux, un hydratant et une protection solaire selon l’exposition. Ajoutez ensuite uniquement ce qui répond à un besoin identifié. Testez une petite zone, introduisez un produit à la fois et notez la date d’ouverture.</p>
<p>En cas d’eczéma répété, un dermatologue peut rechercher une allergie de contact par tests épicutanés. Éviter au hasard des dizaines d’ingrédients complique souvent la routine sans identifier le responsable.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-products-specific-topics/fragrance-allergens-labelling_en" target="_blank" rel="noopener noreferrer">Commission européenne — étiquetage des allergènes parfumants</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/38945918/" target="_blank" rel="noopener noreferrer">Revue systématique sur la sensibilisation aux parfums</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/31433384/" target="_blank" rel="noopener noreferrer">Parfums et allergie de contact</a></li>
</ul>
$lesson$),
('Expositions','Matériaux','Choisir les matériaux en fonction de l’usage et de l’exposition réelle.',$lesson$
<p>Les matériaux peuvent relarguer des substances par usure, chaleur, migration ou émission dans l’air. Le risque varie fortement selon le produit et son usage. Remplacer tout son logement d’un coup crée des dépenses et parfois de nouvelles expositions.</p>
<h2>Cuisine</h2>
<ul>
  <li>Ne chauffez pas un plastique qui n’est pas prévu pour la cuisson.</li>
  <li>Remplacez les revêtements très rayés ou qui se décollent.</li>
  <li>Pour le chaud, verre, inox et fonte sont des choix durables lorsqu’ils correspondent à l’usage.</li>
  <li>Ne réutilisez pas indéfiniment un emballage à usage unique pour stocker des aliments chauds ou gras.</li>
</ul>
<h2>Meubles, peinture et travaux</h2>
<p>Aérez davantage après une peinture, la pose d’un sol, l’utilisation d’une colle ou l’arrivée d’un meuble neuf. Suivez les temps de séchage. Pendant un ponçage ou une démolition, contrôlez la poussière et vérifiez les risques spécifiques aux bâtiments anciens avant d’intervenir.</p>
<h2>Textiles</h2>
<p>Lavez les vêtements et draps neufs avant un contact prolongé avec la peau si vous êtes sensible. Pour la literie, choisissez surtout des matériaux lavables, respirants et compatibles avec vos allergies connues plutôt qu’une étiquette marketing isolée.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.anses.fr/fr/content/les-compos%C3%A9s-organiques-volatils-cov" target="_blank" rel="noopener noreferrer">Anses — composés organiques volatils</a></li>
  <li><a href="https://echa.europa.eu/hot-topics/bisphenols" target="_blank" rel="noopener noreferrer">Agence européenne des produits chimiques — bisphénols</a></li>
  <li><a href="https://echa.europa.eu/hot-topics/phthalates" target="_blank" rel="noopener noreferrer">Agence européenne des produits chimiques — phtalates</a></li>
</ul>
$lesson$),
('Expositions','Champs électromagnétiques (EMF)','Comprendre les différentes familles de champs électromagnétiques et réduire les expositions évitables sans anxiété.',$lesson$
<p>« EMF » signifie champs électromagnétiques. Ce terme regroupe des réalités très différentes : champs de très basse fréquence autour des installations électriques, radiofréquences des téléphones et du Wi-Fi, lumière visible, ultraviolet et rayonnements ionisants. Leur énergie et leurs effets ne sont pas interchangeables.</p>
<h2>Ionisant et non ionisant</h2>
<p>Les rayons X et gamma sont ionisants : ils disposent d’assez d’énergie pour endommager directement la matière biologique et leur usage est contrôlé. Les radiofréquences des réseaux mobiles, du Wi-Fi et du Bluetooth sont non ionisantes. À des niveaux élevés, leur effet établi est l’échauffement ; les limites d’exposition sont conçues pour éviter ces effets.</p>
<p>Le Centre international de recherche sur le cancer a classé les radiofréquences « peut-être cancérogènes » en 2011, ce qui indique des preuves limitées et une incertitude à étudier, pas une causalité démontrée dans les usages courants. Les évaluations scientifiques continuent.</p>
<h2>Réduire simplement si vous le souhaitez</h2>
<ul>
  <li>La distance réduit fortement l’exposition : utilisez le haut-parleur ou un kit filaire pour les longs appels.</li>
  <li>Évitez de maintenir inutilement un téléphone en émission contre le corps, particulièrement lorsque le signal est mauvais.</li>
  <li>La nuit, éloignez le téléphone pour supprimer lumière, vibrations et sollicitations. Le mode avion peut être utilisé si vous n’avez pas besoin d’être joignable.</li>
  <li>Respectez les consignes du fabricant et les restrictions autour des dispositifs médicaux implantés.</li>
</ul>
<h2>Garder la bonne priorité</h2>
<p>Les preuves sont bien plus solides pour les effets du manque de sommeil, du tabac, de la sédentarité ou de la pollution de l’air. Les mesures EMF doivent rester proportionnées et ne pas créer une peur permanente de l’environnement.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.who.int/news-room/questions-and-answers/item/radiation-electromagnetic-fields" target="_blank" rel="noopener noreferrer">OMS — questions et réponses sur les champs électromagnétiques</a></li>
  <li><a href="https://www.who.int/health-topics/electromagnetic-fields/" target="_blank" rel="noopener noreferrer">OMS — projet international sur les champs électromagnétiques</a></li>
  <li><a href="https://www.iarc.who.int/wp-content/uploads/2018/07/pr208_E.pdf" target="_blank" rel="noopener noreferrer">CIRC — classification des radiofréquences en groupe 2B</a></li>
</ul>
$lesson$);

insert into _stoa_lesson_content values
('Santé & Hygiène','Cultiver sa littératie en santé','Savoir chercher, comprendre et utiliser une information de santé.',$lesson$
<p>La littératie en santé est la capacité à trouver, comprendre, évaluer et utiliser une information pour prendre une décision. Elle ne consiste pas à devenir son propre médecin. Elle permet de mieux préparer une consultation, de reconnaître les limites d’une source et de participer aux décisions qui vous concernent.</p>
<h2>Évaluer une affirmation</h2>
<ol>
  <li><b>Quelle est la promesse exacte ?</b> Méfiez-vous des phrases vagues comme « détoxifie », « rééquilibre » ou « booste l’immunité » lorsqu’aucun résultat mesurable n’est défini.</li>
  <li><b>Quelle est la source ?</b> Une vidéo, un témoignage ou une étude isolée ne valent pas une synthèse de plusieurs travaux convergents.</li>
  <li><b>Sur qui porte la preuve ?</b> Une expérience sur des cellules, des animaux ou une population malade ne s’applique pas automatiquement à un adulte en bonne santé.</li>
  <li><b>Quels sont les bénéfices, risques et alternatives ?</b> L’absence de risque mentionné est elle-même une information.</li>
  <li><b>Qui finance ou vend ?</b> Un conflit d’intérêts n’invalide pas un résultat, mais doit être connu.</li>
</ol>
<h2>Préparer une consultation</h2>
<p>Notez vos symptômes, leur date de début, les facteurs aggravants, vos traitements et compléments. Apportez vos questions principales. Avant de partir, reformulez avec vos mots ce que vous avez compris : ce qu’il faut faire, ce qu’il faut surveiller et quand recontacter le professionnel.</p>
<h2>Les pièges fréquents</h2>
<ul>
  <li>Confondre corrélation et causalité.</li>
  <li>Transformer un risque relatif impressionnant en certitude individuelle.</li>
  <li>Choisir uniquement les études qui confirment une croyance.</li>
  <li>Opposer artificiellement « naturel » et « chimique » : une origine ne suffit pas à déterminer la dose, l’efficacité ou le risque.</li>
</ul>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.who.int/news-room/fact-sheets/detail/health-literacy" target="_blank" rel="noopener noreferrer">Organisation mondiale de la Santé — littératie en santé</a></li>
  <li><a href="https://www.has-sante.fr/jcms/c_1671523/" target="_blank" rel="noopener noreferrer">Haute Autorité de Santé — décider avec le patient</a></li>
  <li><a href="https://www.has-sante.fr/jcms/c_2838959/" target="_blank" rel="noopener noreferrer">HAS — éléments pour une décision partagée</a></li>
</ul>
$lesson$),
('Santé & Hygiène','Maladies chroniques','Comprendre le suivi au long cours sans réduire une personne à un diagnostic.',$lesson$
<p>Une maladie chronique s’inscrit dans le temps. Sa prise en charge ne repose généralement pas sur un geste unique, mais sur un ensemble coordonné : suivi médical, traitements lorsqu’ils sont indiqués, activité adaptée, alimentation, sommeil, prévention et contexte social.</p>
<h2>Ce que vous pouvez organiser</h2>
<ul>
  <li>Un dossier simple avec diagnostics, comptes rendus, traitements, allergies et coordonnées des professionnels.</li>
  <li>Une liste actualisée des médicaments et compléments, avec doses et horaires.</li>
  <li>Des mesures utiles définies avec le soignant, plutôt qu’une collecte permanente de données sans objectif.</li>
  <li>Un plan indiquant les signes habituels, les signes d’alerte et la personne à contacter.</li>
</ul>
<h2>Décider avec les professionnels</h2>
<p>Demandez quel est l’objectif du traitement, dans quel délai un bénéfice est attendu, quels effets indésirables surveiller et quelles alternatives existent. N’interrompez pas un traitement prescrit sur la base d’un contenu en ligne. Une modification se prépare avec le professionnel qui connaît votre situation.</p>
<h2>Débunker deux idées</h2>
<p><b>« Une bonne hygiène de vie remplace toujours le traitement. »</b> Elle peut améliorer de nombreux facteurs de risque et la qualité de vie, mais ne remplace pas automatiquement une prise en charge indiquée.</p>
<p><b>« Le diagnostic définit toute ma trajectoire. »</b> Le risque individuel dépend de nombreux facteurs. Des objectifs graduels et réévalués permettent souvent d’agir sans transformer la santé en surveillance anxieuse.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://www.has-sante.fr/jcms/p_3306659/fr/indicateurs-de-qualite-des-parcours-de-soins" target="_blank" rel="noopener noreferrer">HAS — qualité et coordination des parcours de soins</a></li>
  <li><a href="https://www.has-sante.fr/jcms/c_1671523/" target="_blank" rel="noopener noreferrer">HAS — décision médicale partagée</a></li>
  <li><a href="https://eurohealthobservatory.who.int/publications/i/where-are-the-patients-in-decision-making-about-their-own-care" target="_blank" rel="noopener noreferrer">OMS Europe — participation du patient à ses soins</a></li>
</ul>
$lesson$),
('Santé & Hygiène','Les gestes essentiels','Construire une routine d’hygiène courte, tolérable et régulière.',$lesson$
<p>Une routine efficace protège la peau, les dents et le cuir chevelu sans multiplier les produits. « Sans allergène » au sens absolu n’existe pas : toute substance peut poser problème chez une personne sensibilisée. L’objectif réaliste est une formule courte, sans parfum si votre peau est réactive, testée progressivement.</p>
<h2>Routine du matin</h2>
<ul>
  <li>Brossage des dents pendant deux minutes avec un dentifrice fluoré, puis nettoyage interdentaire une fois par jour.</li>
  <li>Visage rincé à l’eau ou nettoyé avec un syndet doux si nécessaire.</li>
  <li>Hydratant simple sur les zones sèches ; protection solaire adaptée lors d’une exposition significative.</li>
  <li>Vêtements propres et respirants, particulièrement au contact des aisselles, des pieds et des plis.</li>
</ul>
<h2>Douche et peau</h2>
<p>Une eau tiède et une douche courte limitent le dessèchement. Nettoyez surtout les mains, aisselles, pieds, plis et zone intime externe. Un pain dermatologique sans savon ou un nettoyant syndet est généralement moins agressif qu’un savon alcalin. Séchez en tamponnant, puis appliquez rapidement un corps gras ou un émollient si la peau tire.</p>
<p>Une crème au suif de bœuf sans parfum peut convenir à certaines peaux, mais sa supériorité clinique n’est pas établie. Testez une petite zone pendant plusieurs jours et cessez en cas de rougeur, démangeaison ou boutons.</p>
<h2>Cheveux</h2>
<p>Lavez selon l’état réel du cuir chevelu. Le rhassoul peut absorber le sébum, mais il peut aussi assécher ou irriter : mélangez-le à l’eau, évitez de le laisser sécher complètement et espacez son utilisation. En cas de pellicules persistantes, plaques, chute marquée ou démangeaisons, demandez un diagnostic plutôt que d’empiler les huiles essentielles.</p>
<h2>Références simples</h2>
<ul>
  <li><a href="https://laboratoiresvendome.fr/products/pain-dermatologique-sans-parfum-100g" target="_blank" rel="noopener noreferrer">Pain dermatologique sans savon et sans parfum — Laboratoires Vendôme</a></li>
  <li><a href="https://www.bodyrestore.fr/products/beef-tallow-creme-geurloos" target="_blank" rel="noopener noreferrer">Crème au suif de bœuf sans parfum — à tester localement avant usage régulier</a></li>
  <li><a href="https://lulubaladine.fr/products/shampoing-rhassoul" target="_blank" rel="noopener noreferrer">Shampoing au rhassoul sans parfum — exemple de formule courte</a></li>
</ul>
<p>Ces exemples ne sont ni des obligations ni des partenariats. Vérifiez toujours la composition actuelle et choisissez selon votre tolérance.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35335373/" target="_blank" rel="noopener noreferrer">Savons, syndets et intégrité de la barrière cutanée</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/38982600/" target="_blank" rel="noopener noreferrer">pH des nettoyants et peau atopique</a></li>
  <li><a href="https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-products-specific-topics/fragrance-allergens-labelling_en" target="_blank" rel="noopener noreferrer">Commission européenne — allergènes parfumants dans les cosmétiques</a></li>
</ul>
$lesson$),
('Santé & Hygiène','Un environnement sain','Réduire les irritants du logement avec des mesures simples.',$lesson$
<p>Un logement sain n’est pas un logement stérile. Les priorités sont l’air, l’humidité, la combustion, les moisissures, la poussière et les produits que l’on diffuse volontairement.</p>
<h2>Chaque jour</h2>
<ul>
  <li>Aérez lorsque la qualité de l’air extérieur le permet, particulièrement après la douche, la cuisine ou le ménage.</li>
  <li>Utilisez la hotte pendant la cuisson et entretenez les appareils à combustion.</li>
  <li>Évitez la fumée de tabac, les bougies parfumées, l’encens et les diffuseurs qui ajoutent des particules ou des composés volatils.</li>
  <li>Traitez rapidement une fuite ou une condensation persistante : masquer la moisissure sans corriger l’humidité ne résout pas la cause.</li>
</ul>
<h2>Chambre et literie</h2>
<p>Choisissez des draps et une housse de couette lavables, idéalement en fibres que vous tolérez bien comme le coton. Lavez régulièrement la literie et laissez-la sécher complètement. En cas d’allergie aux acariens confirmée, une housse intégrale certifiée pour le matelas et l’oreiller peut réduire l’exposition, mais ce n’est pas une garantie de disparition des symptômes et l’approche doit rester globale.</p>
<p>Exemple : <a href="https://www.protecsom.com/produit/housse-matelas-anti-acariens-texaal-coton/" target="_blank" rel="noopener noreferrer">housse intégrale Texaal Coton</a>. Vérifiez les dimensions, les conditions de lavage et l’indication médicale.</p>
<h2>Ménage sobre</h2>
<p>Pour la majorité des surfaces, eau, action mécanique et produit non parfumé correctement dosé suffisent. Ne mélangez jamais eau de Javel, acides, vinaigre ou ammoniaque. Aérez pendant l’utilisation et conservez les produits dans leur emballage d’origine, hors de portée des enfants.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://iris.who.int/bitstream/handle/10665/164348/9789289041683-eng.pdf" target="_blank" rel="noopener noreferrer">OMS — humidité, moisissures et qualité de l’air intérieur</a></li>
  <li><a href="https://www.anses.fr/fr/system/files?file=AIR2018SA0145Ra.pdf" target="_blank" rel="noopener noreferrer">Anses — sprays, diffuseurs et pollution de l’air intérieur</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/24484971/" target="_blank" rel="noopener noreferrer">Méta-analyse sur les housses anti-acariens</a></li>
</ul>
$lesson$),
('Peau & Apparence','Sentir bon','Agir sur les causes des odeurs sans masquer systématiquement la peau.',$lesson$
<p>L’odeur corporelle vient surtout de la transformation de la sueur par les bactéries présentes sur la peau. Transpirer est normal et utile. L’objectif n’est pas de supprimer toute odeur humaine, mais d’éviter son accumulation.</p>
<h2>La base</h2>
<ul>
  <li>Lavez les aisselles, les pieds et les plis avec un nettoyant doux, puis séchez complètement.</li>
  <li>Changez les vêtements humides et laissez les chaussures sécher entre deux ports.</li>
  <li>Privilégiez des textiles respirants et lavez rapidement ceux qui retiennent les odeurs.</li>
  <li>Un déodorant agit sur l’odeur ; un antitranspirant réduit temporairement la transpiration. Choisissez selon votre besoin et votre tolérance.</li>
</ul>
<h2>Le parfum ne nettoie pas</h2>
<p>Superposer parfum, brume textile et déodorant parfumé peut masquer l’odeur tout en augmentant le nombre de substances en contact avec la peau et l’air intérieur. Si vous avez une peau sensible, commencez par une formule sans parfum. Une odeur nouvelle, très forte ou associée à d’autres symptômes mérite une évaluation plutôt qu’un produit plus puissant.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/38945918/" target="_blank" rel="noopener noreferrer">Revue systématique sur la sensibilisation aux mélanges parfumants</a></li>
  <li><a href="https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-products-specific-topics/fragrance-allergens-labelling_en" target="_blank" rel="noopener noreferrer">Commission européenne — étiquetage des allergènes parfumants</a></li>
</ul>
$lesson$),
('Peau & Apparence','Se maquiller','Construire une trousse courte et réduire les irritations évitables.',$lesson$
<p>Le maquillage peut être un choix esthétique sans devenir une routine compliquée. Une trousse courte, propre et réellement utilisée réduit les dépenses, le gaspillage et les occasions d’irriter la peau.</p>
<h2>Avant l’achat</h2>
<ul>
  <li>Choisissez un produit pour une fonction précise plutôt qu’une promesse générale.</li>
  <li>Si votre peau ou vos yeux sont réactifs, préférez les formules sans parfum et testez une petite zone.</li>
  <li>« Naturel », « clean » et « hypoallergénique » ne garantissent pas l’absence de réaction.</li>
  <li>Vérifiez la durée d’utilisation après ouverture et n’accumulez pas plusieurs produits identiques.</li>
</ul>
<h2>Hygiène de la trousse</h2>
<p>Lavez les mains avant l’application, nettoyez régulièrement pinceaux et éponges, ne partagez pas les produits pour les yeux ou les lèvres et jetez un produit dont l’odeur, la texture ou la couleur change. Évitez d’ajouter de l’eau ou de la salive dans un produit.</p>
<h2>Démaquillage</h2>
<p>Retirez le maquillage sans frotter longuement. Un nettoyant doux suffit souvent ; un second nettoyage n’est utile que si le produit résistant persiste. Terminez par un hydratant simple si la peau tire. Une irritation répétée demande d’abord l’arrêt des nouveautés, puis une réintroduction une par une.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-products-specific-topics/fragrance-allergens-labelling_en" target="_blank" rel="noopener noreferrer">Commission européenne — allergènes parfumants</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35335373/" target="_blank" rel="noopener noreferrer">Nettoyants et respect de la barrière cutanée</a></li>
</ul>
$lesson$),
('Peau & Apparence','Corriger ses problèmes de peau','Revenir à une routine minimale avant d’ajouter des actifs.',$lesson$
<p>Acné, rougeurs, plaques et démangeaisons n’ont pas une cause unique. Ajouter plusieurs acides, huiles essentielles ou compléments en même temps empêche d’identifier ce qui aide ou irrite.</p>
<h2>La remise à zéro</h2>
<ol>
  <li>Conservez un nettoyant doux, un hydratant toléré et une protection solaire adaptée à votre exposition.</li>
  <li>Arrêtez temporairement les nouveautés non essentielles.</li>
  <li>Photographiez la zone dans la même lumière une fois par semaine plutôt que de l’examiner plusieurs fois par jour.</li>
  <li>Réintroduisez un seul produit à la fois et laissez assez de temps pour juger la tolérance.</li>
</ol>
<h2>Ce qu’il faut éviter</h2>
<ul>
  <li>Percer ou gratter les lésions.</li>
  <li>Décaper la peau pour obtenir une sensation de propreté.</li>
  <li>Appliquer une huile essentielle pure.</li>
  <li>Changer d’alimentation, de compléments et de routine simultanément.</li>
</ul>
<p>Une atteinte douloureuse, étendue, cicatricielle, infectée, proche des yeux ou qui altère fortement votre quotidien justifie un avis médical. Les maladies de peau visibles peuvent aussi peser sur la santé mentale ; ce retentissement est une raison suffisante pour demander de l’aide.</p>
<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35335373/" target="_blank" rel="noopener noreferrer">Savons, syndets et barrière cutanée</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/38982600/" target="_blank" rel="noopener noreferrer">pH des nettoyants et peau atopique</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/31433384/" target="_blank" rel="noopener noreferrer">Parfums, allergie de contact et autres effets indésirables</a></li>
</ul>
$lesson$);

-- Replace target lessons by one HTML block compatible with the current editor.
delete from public.subchapters s
using public.modules m, public.chapters c, _stoa_lesson_content content
where s.module_id=m.id
  and m.chapter_id=c.id
  and c.is_visible
  and c.title=content.chapter_title
  and m.title=content.module_title;

insert into public.subchapters(module_id,title,content,order_index)
select m.id,'Cours',content.content,0
from _stoa_lesson_content content
join public.chapters c on c.is_visible and c.title=content.chapter_title
join public.modules m on m.chapter_id=c.id and m.title=content.module_title;

update public.modules m
set description=content.description
from public.chapters c, _stoa_lesson_content content
where m.chapter_id=c.id
  and c.is_visible
  and c.title=content.chapter_title
  and m.title=content.module_title;

-- Remaining legacy templates keep no authored claims, but become editable single blocks.
create temporary table _stoa_legacy_modules(id uuid primary key) on commit drop;
insert into _stoa_legacy_modules(id)
select distinct m.id
from public.modules m
join public.chapters c on c.id=m.chapter_id and c.is_visible
join public.subchapters s on s.module_id=m.id
where s.content like '%Les notions essentielles de ce module, expliquées dans un langage clair.%'
   or s.content like '%Un temps pour regarder votre situation actuelle avec précision et sans jugement.%'
   or s.content like '%Une action simple à adapter à votre quotidien et à vos contraintes.%';

delete from public.subchapters s using _stoa_legacy_modules legacy where s.module_id=legacy.id;
insert into public.subchapters(module_id,title,content,order_index)
select id,'Cours','',0 from _stoa_legacy_modules;

