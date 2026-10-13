-- Rewrite the affected Mouvement and Sommeil lessons in the STOA voice.
-- Content stays free of internal heading tags and ordered lists.

do $$
declare
  v_sleep_chapter_id uuid;
begin
  select id into v_sleep_chapter_id
  from public.chapters
  where is_visible and title = 'Sommeil'
  order by order_index
  limit 1;

  if v_sleep_chapter_id is null then
    return;
  end if;

  delete from public.modules
  where chapter_id = v_sleep_chapter_id
    and title = 'Gérer ses ressources';

  update public.modules
  set order_index = order_index + 10000
  where chapter_id = v_sleep_chapter_id;

  with ordered as (
    select
      id,
      row_number() over (
        order by
          case title
            when 'Comprendre son sommeil' then 0
            when 'Construire son rituel du soir' then 1
            when 'Réveil et matin' then 2
            else 100
          end,
          order_index,
          id
      ) - 1 as next_order
    from public.modules
    where chapter_id = v_sleep_chapter_id
  )
  update public.modules m
  set order_index = ordered.next_order
  from ordered
  where m.id = ordered.id;
end;
$$;

create temporary table _stoa_rewritten_lessons (
  chapter_title text not null,
  module_title text not null,
  description text not null,
  content text not null,
  primary key (chapter_title, module_title)
) on commit drop;

insert into _stoa_rewritten_lessons values
('Mouvement','Perdre du poids','Perdre de la graisse sans sacrifier le muscle, l’énergie ni les hormones.',$lesson$
<p>Perdre du poids et perdre de la graisse ne racontent pas la même histoire. La balance additionne le muscle, la graisse, l’eau, le glycogène et ce que vous avez mangé. L’objectif n’est donc pas de faire descendre un chiffre à tout prix, mais de retirer ce qui vous encombre en gardant ce qui vous rend fort.</p>

<p>Avant de réduire les portions, regardez l’ensemble : le tour de taille, les photos prises dans les mêmes conditions, la force à l’entraînement, le sommeil, l’énergie et le rapport à la nourriture. Une variation de deux kilos en quelques jours vient très souvent de l’eau et du glycogène. Elle ne mérite ni panique ni régime improvisé.</p>

<p><b>Le pourcentage de masse grasse</b></p>
<p>Les balances à impédance, les plis cutanés et le DXA ne donnent pas exactement le même résultat. Utilisez toujours la même méthode et observez la tendance. Les fourchettes ci-dessous servent de repères, jamais de verdict :</p>
<ul>
  <li><b>20 à 39 ans :</b> environ 8 à 20 % chez l’homme et 21 à 33 % chez la femme.</li>
  <li><b>40 à 59 ans :</b> environ 11 à 22 % chez l’homme et 23 à 34 % chez la femme.</li>
  <li><b>60 à 79 ans :</b> environ 13 à 25 % chez l’homme et 24 à 36 % chez la femme.</li>
</ul>

<p><b>Votre lignée mitochondriale</b></p>
<p>Les mitochondries sont les centrales énergétiques de vos cellules. Leur ADN est transmis par la mère et ses grandes lignées sont appelées haplogroupes. Certaines variantes semblent modifier légèrement la manière dont l’énergie est dépensée, transformée en chaleur ou stockée. Elles ne décident pas seules de votre physique, mais elles peuvent rendre le terrain plus ou moins favorable.</p>
<ul>
  <li><b>Haplogroupe X :</b> une cohorte a observé un IMC et une masse grasse plus bas chez ses porteurs. Une autre étude retrouve également un signal protecteur, mais moins solide après les corrections statistiques.</li>
  <li><b>Haplogroupe R :</b> dans une cohorte du Qatar et du Koweït, le risque d’obésité était environ 30 % plus bas. La majorité des porteurs appartenaient à la branche R0a.</li>
  <li><b>Haplogroupe T :</b> dans une étude menée en Italie du Sud, il était associé à un risque presque deux fois plus élevé d’obésité morbide.</li>
  <li><b>Haplogroupes J et K :</b> certaines études relient ces lignées à une réponse différente à l’endurance et au métabolisme de certains acides aminés. Pour J, les résultats sur l’obésité changent selon les populations : risque plus élevé dans une cohorte qatarie, signal protecteur chez des femmes d’Italie du Sud.</li>
  <li><b>Macro-haplogroupes L0, L2 et L3 :</b> chez des adultes plus âgés, ils ont été associés à un métabolisme de repos légèrement plus bas que les lignées européennes H, JT et UK.</li>
</ul>
<p>Votre haplogroupe représente une petite pièce du puzzle. La génétique nucléaire, l’épigénétique, la quantité de muscle, le sommeil, l’alimentation et l’activité quotidienne pèsent bien davantage dans le résultat final. Il peut expliquer une tendance ; il ne condamne jamais une progression.</p>

<p><b>Le corps féminin</b></p>
<p>Une femme porte naturellement plus de masse grasse qu’un homme. Les hormones sexuelles orientent davantage le stockage vers les hanches et les cuisses, et cette réserve participe au bon fonctionnement hormonal. Chercher en permanence à devenir plus légère peut finir par dérégler le cycle, faire chuter la libido, fragiliser les os et rendre le corps froid, fatigué et irritable.</p>
<p>Si les règles deviennent irrégulières, si la force chute ou si la nourriture occupe toutes vos pensées, le déficit est allé trop loin. Ce n’est pas un manque de volonté : c’est le corps qui protège ses fonctions essentielles.</p>

<p><b>La cellulite des femmes</b></p>
<p>La cellulite concerne la grande majorité des femmes après la puberté, y compris les femmes minces et sportives. Elle vient notamment de la structure du tissu sous-cutané et des cloisons fibreuses, différente de celle des hommes. Elle n’est pas une preuve de surpoids. Une perte de graisse peut en modifier l’apparence, mais elle ne garantit pas sa disparition.</p>

<p><b>Perdre la graisse, garder le reste</b></p>
<ul>
  <li><b>Créez un déficit léger.</b> Retirez d’abord les calories qui rassasient peu et gardez de vrais repas. Un déficit violent enlève vite du muscle, de l’énergie et de la patience.</li>
  <li><b>Conservez les glucides et lipides.</b> Répartissez des sources protéiques suffisantes dans la journée et maintenez un entraînement de résistance progressif.</li>
  <li><b>Marchez beaucoup.</b> La marche augmente la dépense sans ajouter la fatigue d’une séance punitive.</li>
  <li><b>Ne payez jamais votre déficit avec votre sommeil.</b> Si vous dormez moins, avez faim toute la journée et pensez sans arrêt à manger, le plan est trop agressif.</li>
  <li><b>Regardez plusieurs semaines, pas la pesée du matin.</b> Le tour de taille, les photos, la force et la moyenne du poids donnent une image bien plus honnête.</li>
</ul>
<p>La bonne cible est celle que vous pouvez conserver en mangeant correctement, en voyant vos proches et en restant performant. Le poids le plus bas que vous pouvez supporter pendant quinze jours ne constitue pas un objectif.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/10966886/" target="_blank" rel="noopener noreferrer">Fourchettes de masse grasse selon l’âge et le sexe</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/21747914/" target="_blank" rel="noopener noreferrer">Haplogroupes mitochondriaux, IMC et masse grasse</a></li>
  <li><a href="https://www.nature.com/articles/s41598-020-80040-7" target="_blank" rel="noopener noreferrer">Haplogroupes mitochondriaux et obésité dans une cohorte qatarie</a></li>
  <li><a href="https://www.frontiersin.org/journals/endocrinology/articles/10.3389/fendo.2024.1449374/full" target="_blank" rel="noopener noreferrer">Haplogroupe R, sous-lignée R0a et risque d’obésité</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/23936828/" target="_blank" rel="noopener noreferrer">Haplogroupes T et J dans une cohorte d’Italie du Sud</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35619160/" target="_blank" rel="noopener noreferrer">Haplogroupes J et K, endurance et métabolisme</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/21586348/" target="_blank" rel="noopener noreferrer">Variation mitochondriale et métabolisme de repos</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/38194640/" target="_blank" rel="noopener noreferrer">Disponibilité énergétique et cycle menstruel</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/32976174/" target="_blank" rel="noopener noreferrer">Physiologie de la cellulite</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/40909191/" target="_blank" rel="noopener noreferrer">Musculation pendant une perte de poids</a></li>
</ul>
$lesson$),

('Mouvement','Prendre du muscle','Construire du muscle avec de vrais aliments, une progression claire et assez de récupération.',$lesson$
<p>Le muscle se construit lorsque trois choses se rencontrent : un entraînement assez stimulant, une alimentation assez riche et un corps qui dispose du temps nécessaire pour récupérer. Si l’un des trois manque, les efforts finissent par tourner à vide.</p>

<p>Gardez un socle d’exercices pendant plusieurs semaines. Choisissez des mouvements que vous sentez bien, apprenez leur technique et notez vos séries. Ajoutez ensuite une répétition, un peu de charge, une meilleure amplitude ou un meilleur contrôle. Cette progression discrète, répétée mois après mois, construit davantage qu’un programme entièrement nouveau chaque lundi.</p>

<p>Deux à quatre séances de musculation par semaine suffisent à transformer un physique. Travaillez tout le corps : jambes, poussées, tirages, hanches, portés et gainage. Les dernières répétitions doivent demander un vrai effort sans dégrader le mouvement. Vous n’avez pas besoin d’aller à l’échec sur chaque série ni de sortir détruit de la salle.</p>

<p><b>Le muscle ne se nourrit pas de poudre</b></p>
<p>Les protéines donnent les matériaux de construction, mais elles ne travaillent jamais seules. Les glucides remplissent les réserves de glycogène et permettent de pousser avec intensité. Les lipides apportent de l’énergie et participent au fonctionnement hormonal. Les vitamines et minéraux soutiennent tout ce qui se passe entre la séance et la suivante.</p>
<p>Construisez vos repas autour d’aliments reconnaissables : œufs, viande, poisson, abats si vous les appréciez, produits laitiers bien tolérés, pommes de terre, riz, fruits, miel, légumes choisis selon votre digestion, beurre, ghee ou huile d’olive. La qualité compte. Une prise de muscle nourrie de produits ultra-transformés apporte facilement beaucoup de graisse, une digestion médiocre et une énergie instable.</p>
<p>Répartissez vos sources protéiques sur la journée sans transformer chaque repas en calcul. Si votre poids et vos performances ne bougent plus pendant plusieurs semaines, augmentez légèrement les portions, surtout autour de l’entraînement. Un complément reste une commodité ; il ne remplace jamais une assiette.</p>

<p><b>Le stress peut bloquer une progression parfaitement programmée</b></p>
<p>Un corps déjà pressé par le manque de sommeil, le travail, les stimulants et des séances trop nombreuses récupère mal. Les charges stagnent, l’appétit se dérègle et les douleurs s’installent. Dans cette situation, ajouter encore du volume ne prouve rien. Retirez une séance, marchez, mangez suffisamment et retrouvez des nuits complètes.</p>

<ul>
  <li>Gardez les mêmes mouvements assez longtemps pour mesurer un progrès réel.</li>
  <li>Laissez au moins une journée plus calme entre deux gros efforts sur le même groupe musculaire.</li>
  <li>Si les performances baissent plusieurs séances de suite, allégez une semaine avant de repartir.</li>
  <li>Mesurez aussi la force, les mensurations et les photos. La balance seule ne sait pas distinguer le muscle de l’eau.</li>
</ul>

<p>Vous n’avez pas besoin d’optimiser chaque détail. Il faut surtout enchaîner des mois de repas solides, de mouvements bien exécutés et de nuits qui permettent au corps de faire son travail.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/29564973/" target="_blank" rel="noopener noreferrer">Protéines et adaptations à l’entraînement de résistance</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/27433992/" target="_blank" rel="noopener noreferrer">Volume d’entraînement et hypertrophie musculaire</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/33497853/" target="_blank" rel="noopener noreferrer">Proximité de l’échec et croissance musculaire</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/29422383/" target="_blank" rel="noopener noreferrer">Manque de sommeil et performance en musculation</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/28919335/" target="_blank" rel="noopener noreferrer">Musculation et qualité du sommeil</a></li>
</ul>
$lesson$),

('Sommeil','Comprendre son sommeil','Comprendre ses rythmes, la sieste et le prix réel d’un sommeil insuffisant.',$lesson$
<p>Le sommeil n’est pas du temps perdu. Pendant que vous dormez, le cerveau trie les souvenirs, le système nerveux redescend, les tissus récupèrent et l’organisme prépare la journée suivante. Rogner sur la nuit finit toujours par présenter l’addition.</p>

<p>Deux mécanismes donnent le rythme. La pression de sommeil monte à mesure que les heures éveillées passent, comme une faim de dormir. L’horloge circadienne règle les moments où le corps attend la lumière, l’activité, le repas puis l’obscurité. Elle se recale surtout grâce à la lumière reçue par les yeux et à la régularité de vos horaires.</p>

<p><b>La nuit blanche</b></p>
<p>Une nuit blanche suffit à dégrader l’attention, le temps de réaction, la mémoire, l’humeur et la sensibilité à l’insuline. Répétées, les nuits trop courtes sont associées à davantage d’obésité, de diabète, de maladies cardiovasculaires et de mortalité. L’être humain peut rester éveillé longtemps ; cela ne veut pas dire que son corps travaille correctement pendant seize, dix-huit ou vingt heures.</p>
<p>Après une nuit presque vide, ne conduisez pas si vos yeux se ferment. Revenez à votre heure habituelle le soir suivant et récupérez avec une vraie nuit, sans décaler toute la semaine.</p>

<p><b>La sieste</b></p>
<p>Une sieste de dix à trente minutes peut rendre de la vigilance, améliorer la mémoire et couper proprement une journée longue. Placez-la au début de l’après-midi pour éviter d’arriver sans sommeil le soir. Après une grosse dette, une sieste plus longue peut aider, mais le réveil sera souvent plus lourd.</p>
<p>Dans les sociétés préindustrielles étudiées, la sieste apparaissait davantage pendant les longues journées d’été et beaucoup moins en hiver. Utilisez-la lorsque le corps la réclame et qu’elle ne vole pas votre nuit.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/27743803/" target="_blank" rel="noopener noreferrer">Sommeil court et santé : revue systématique et méta-analyse</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/26361380/" target="_blank" rel="noopener noreferrer">Une nuit de sommeil partiel et sensibilité à l’insuline</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/34639511/" target="_blank" rel="noopener noreferrer">Effets cognitifs d’une sieste courte</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/26480842/" target="_blank" rel="noopener noreferrer">Sommeil naturel dans trois sociétés préindustrielles</a></li>
</ul>
$lesson$),

('Sommeil','Construire son rituel du soir','Faire descendre la lumière, le rythme et la température avant la nuit.',$lesson$
<p>Votre soirée prépare votre nuit. Le corps comprend qu’il doit ralentir lorsque la lumière baisse, que les tâches s’arrêtent et que les mêmes gestes reviennent. Le coucher commence donc bien avant le moment où vous fermez les yeux.</p>

<p>Choisissez d’abord une heure de lever stable, puis donnez-vous une fenêtre de sommeil assez longue. Dans les sociétés préindustrielles étudiées, l’endormissement arrivait en moyenne environ trois heures après le coucher du soleil. La disparition du soleil marquait déjà l’arrêt des activités intenses, le retour au calme et la préparation de la nuit.</p>

<p>Deux à trois heures avant d’aller vous coucher, réduisez l’intensité des lumières et favorisez plusieurs petites lampes basses, tamisées et chaudes. Une lampe circadienne est optimale lorsqu’elle fait descendre progressivement la lumière avec la soirée.</p>
<p>Dès 18 h, commencez à limiter les lumières. Choisissez des ampoules <i>flicker-free</i>. Beaucoup de LED pilotées par une électronique médiocre pulsent des dizaines, des centaines ou parfois des milliers de fois par seconde. Vos yeux ne voient pas forcément ces scintillements, mais ils peuvent fatiguer et gêner les personnes sensibles.</p>
<p>Une lumière orange ou rouge faible rappelle naturellement la fin du jour. Le feu, le soleil bas et les soirées vécues sous une lumière chaude ont longtemps accompagné le repos humain. Recréer cette ambiance le soir donne au cerveau un signal simple : la journée est terminée.</p>

<p><b>La mode des panneaux rouges</b></p>
<p>La <i>red light therapy</i> est vendue comme une réponse à presque tout. Pour le sommeil, le marketing va beaucoup plus vite que les preuves : quelques petits essais ne suffisent pas à transformer un panneau coûteux en rituel indispensable. Fixer une dalle de LED n’imite ni un coucher de soleil ni un feu. Gardez votre argent et baissez simplement l’intensité de vos lampes.</p>

<p><b>Les lunettes du soir</b></p>
<p>Des verres rouges qui filtrent réellement le bleu et le vert réduisent fortement le signal d’éveil envoyé au cerveau. Portez-les dès que le soleil se couche, et systématiquement devant un écran le soir. Nous conseillons les lunettes Sexton pour leur équilibre entre esthétique, filtration annoncée de 98 à 100 % entre 380 et 500 nm, et prix.</p>
<p><a href="https://www.decathlon.fr/p/mp/lunettes-sexton-filtre-rouge-contre-la-lumiere-bleue-pour-un-sommeil-profond/4317bb69-e6ba-447d-a853-f2bedb371dec/c1c14" target="_blank" rel="noopener noreferrer"><b>Voir les lunettes Sexton →</b></a></p>

<p><b>Les écrans</b></p>
<ul>
  <li>Activez Night Shift ou le filtre orange dès le soir.</li>
  <li>Installez <a href="https://justgetflux.com/" target="_blank" rel="noopener noreferrer">f.lux</a> sur votre ordinateur.</li>
  <li>Utilisez le mode sombre sur les sites et les applications.</li>
  <li>Réduisez la luminosité au minimum confortable.</li>
  <li>Coupez tout écran deux heures avant de dormir, idéalement.</li>
</ul>

<p><b>La chambre</b></p>
<p>Éteignez chaque voyant visible et débranchez les appareils inutiles. La chambre doit être noire, calme et fraîche. Une température proche de 17 à 20 °C convient à beaucoup de personnes. Le chauffage ou la climatisation peuvent aider s’ils restent discrets et ne soufflent pas directement sur le lit.</p>
<p>Le masque et les bouchons dépannent, mais ils cachent le problème au lieu de corriger la pièce. Réduisez d’abord la lumière et le bruit à la source. Si votre environnement le permet, dormir les volets ou les rideaux légèrement ouverts laisse l’aube entrer naturellement dans la chambre.</p>

<p>Dans la dernière heure, terminez le travail, préparez ce dont vous aurez besoin demain, baissez encore les lampes et choisissez un geste calme que vous aimez vraiment : lire, prendre une douche tiède, respirer, vous étirer ou parler avec quelqu’un. Un rituel simple que vous répétez vaut mieux qu’une routine parfaite que vous abandonnez.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/21193540/" target="_blank" rel="noopener noreferrer">Lumière avant le coucher et suppression de la mélatonine</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/37192881/" target="_blank" rel="noopener noreferrer">Réduction de la lumière de courte longueur d’onde et sommeil</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/42322437/" target="_blank" rel="noopener noreferrer">Photobiomodulation et sommeil : état actuel des essais</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/31105512/" target="_blank" rel="noopener noreferrer">Température et sommeil</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/26480842/" target="_blank" rel="noopener noreferrer">Cycle solaire et sommeil préindustriel</a></li>
  <li><a href="https://www.youtube.com/shorts/NG2ezlwoVu8" target="_blank" rel="noopener noreferrer">Comparaison au ralenti : LED avec scintillement et LED flicker-free</a></li>
</ul>
$lesson$),

('Sommeil','Réveil et matin','Donner au corps les bons signaux dès les premières minutes de la journée.',$lesson$
<p>Le matin prépare votre énergie et votre prochaine nuit. Une heure de lever régulière, de la lumière extérieure et quelques minutes de mouvement donnent au corps un point de départ clair.</p>

<p>La lumière traverse l’œil et atteint la rétine, la fine membrane située au fond de l’œil. Les cônes et les bâtonnets participent à la vision. D’autres cellules contiennent de la mélanopsine, un capteur particulièrement sensible à la lumière du jour. Elles envoient ensuite l’information au noyau suprachiasmatique, la petite horloge centrale du cerveau qui règle le sommeil, l’éveil et une partie de vos hormones.</p>
<p>Regarder le soleil droit dans les yeux est inutile. Sortez simplement sans lunettes de soleil et laissez la lumière naturelle atteindre vos yeux.</p>

<p>Le cortisol augmente naturellement pendant les 30 à 45 minutes après le réveil. Cela sert à la mobilisation de l’énergie pour le restant de la journée. La lumière du matin coupe aussi la mélatonine encore présente et aide le corps à programmer son retour le soir.</p>

<p><b>Votre réveil minimal</b></p>
<ul>
  <li>Lève-toi à une heure proche chaque jour.</li>
  <li>Sors dans la première heure, marche quelques minutes et regarde l’horizon.</li>
  <li>Bois selon ta soif et commence la journée en mouvement plutôt que dans une pièce sombre.</li>
  <li>Si tu te lèves avant l’aube, allume progressivement la pièce puis sors dès que le jour apparaît.</li>
</ul>

<p>Les sociétés préindustrielles étudiées s’endormaient en moyenne environ trois heures après le coucher du soleil et se réveillaient près de l’aube. Le coucher du soleil signifiait déjà l’arrêt du travail intense et le passage vers le repos. Plus vos horaires restent proches d’un jour à l’autre, plus le réveil devient naturel.</p>

<p>Si votre réveil vous fait stresser, retirez-le. Choisissez une sonnerie proche de la nature, comme le chant du coq ou le bruit des oiseaux. Le mieux reste de dormir la fenêtre ouverte et de laisser les sons du matin et la lumière vous réveiller naturellement.</p>

<p><b>Marcher pieds nus</b></p>
<p>Le <i>grounding</i> réunit trois choses simples : la lumière du matin, le mouvement et le contact direct avec le sol. Les premiers travaux observent des effets intéressants sur l’inflammation, la récupération et certains rythmes physiologiques. La recherche reste jeune, mais la direction est encourageante. Gardez la pratique gratuite et concrète : quelques minutes pieds nus dans l’herbe, la terre ou le sable.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/31394505/" target="_blank" rel="noopener noreferrer">Rétine, mélanopsine et horloge biologique</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/39177247/" target="_blank" rel="noopener noreferrer">Réponse de cortisol au réveil</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/33054339/" target="_blank" rel="noopener noreferrer">Régularité du sommeil et santé</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/26480842/" target="_blank" rel="noopener noreferrer">Sommeil et lumière dans trois sociétés préindustrielles</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/25848315/" target="_blank" rel="noopener noreferrer">Grounding et inflammation</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/28987038/" target="_blank" rel="noopener noreferrer">Grounding et réponses physiologiques observées</a></li>
</ul>
$lesson$);

delete from public.subchapters s
using public.modules m, public.chapters c, _stoa_rewritten_lessons content
where s.module_id = m.id
  and m.chapter_id = c.id
  and c.is_visible
  and c.title = content.chapter_title
  and m.title = content.module_title;

insert into public.subchapters (module_id, title, content, order_index)
select m.id, 'Cours', content.content, 0
from _stoa_rewritten_lessons content
join public.chapters c on c.is_visible and c.title = content.chapter_title
join public.modules m on m.chapter_id = c.id and m.title = content.module_title;

update public.modules m
set description = content.description
from public.chapters c, _stoa_rewritten_lessons content
where m.chapter_id = c.id
  and c.is_visible
  and c.title = content.chapter_title
  and m.title = content.module_title;
