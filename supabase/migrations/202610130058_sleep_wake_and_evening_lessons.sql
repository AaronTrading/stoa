-- Expand the Sommeil chapter with a dedicated morning lesson and evidence-based
-- guidance. Claims with limited or conflicting evidence are labelled as such.

do $$
declare
  v_chapter_id uuid;
  v_module_id uuid;
begin
  select id into v_chapter_id
  from public.chapters
  where is_visible and title = 'Sommeil'
  order by order_index
  limit 1;

  if v_chapter_id is null then
    return;
  end if;

  -- Move every module out of the final range before rebuilding the order. This
  -- keeps the per-chapter unique order constraint valid throughout the change.
  update public.modules
  set order_index = order_index + 10000
  where chapter_id = v_chapter_id;

  select id into v_module_id
  from public.modules
  where chapter_id = v_chapter_id and title = 'Réveil et matin'
  order by created_at
  limit 1;

  if v_module_id is null then
    insert into public.modules (
      chapter_id, title, description, duration_minutes, order_index, is_visible
    ) values (
      v_chapter_id,
      'Réveil et matin',
      'Ancrer son horloge biologique avec une routine matinale simple et cohérente.',
      18,
      (select coalesce(max(order_index), 9999) + 1 from public.modules where chapter_id = v_chapter_id),
      true
    ) returning id into v_module_id;
  end if;

  with ordered as (
    select
      id,
      row_number() over (
        order by
          case title
            when 'Comprendre son sommeil' then 0
            when 'Réveil et matin' then 1
            when 'Construire son rituel du soir' then 2
            when 'Cartographier son énergie' then 3
            when 'Gérer ses ressources' then 4
            else 100
          end,
          order_index,
          id
      ) - 1 as next_order
    from public.modules
    where chapter_id = v_chapter_id
  )
  update public.modules m
  set order_index = ordered.next_order
  from ordered
  where m.id = ordered.id;
end;
$$;

create temporary table _stoa_sleep_content (
  module_title text primary key,
  description text not null,
  content text not null
) on commit drop;

insert into _stoa_sleep_content values
('Comprendre son sommeil','Comprendre les rythmes, les besoins, la sieste et les conséquences d’un sommeil insuffisant.',$lesson$
<p>Le sommeil n’est pas une interruption passive de la journée. C’est un état biologique actif : les cycles de sommeil lent et paradoxal participent à la mémoire, à la régulation émotionnelle, à l’immunité et à la récupération physique.</p>

<h2>Pression de sommeil et horloge circadienne</h2>
<p>Deux forces travaillent ensemble. La pression de sommeil augmente au fil du temps passé éveillé. L’horloge circadienne organise, sur environ vingt-quatre heures, les périodes où l’éveil ou le sommeil sont les plus faciles. La lumière reçue par les yeux, les horaires, l’activité et les repas fournissent des repères à cette horloge.</p>
<p>Il n’existe pas de règle scientifique selon laquelle l’être humain ne devrait jamais rester éveillé plus de douze à quatorze heures. Pour un adulte dormant sept à neuf heures, la fenêtre d’éveil est souvent proche de quinze à dix-sept heures. Ce qui compte est de ne pas prolonger régulièrement l’éveil au prix du besoin de sommeil, et d’observer la somnolence, l’humeur, la vigilance et la récupération.</p>

<h2>La nuit blanche n’est pas une performance</h2>
<p>Une nuit blanche dégrade dès le lendemain l’attention, le temps de réaction, la mémoire, la régulation émotionnelle et plusieurs paramètres métaboliques. Une seule nuit de sommeil partiel peut déjà réduire transitoirement la sensibilité à l’insuline. Les associations avec l’obésité, le diabète, les maladies cardiovasculaires et la mortalité concernent surtout un sommeil court répété dans le temps : elles ne permettent pas de dire qu’une nuit blanche isolée provoque à elle seule ces maladies.</p>
<p>Après une nuit très courte, évitez de conduire si vous luttez contre le sommeil. Revenez à votre horaire habituel, privilégiez une nuit suivante suffisamment longue et utilisez une sieste courte si elle vous aide, plutôt que de décaler tout votre rythme de plusieurs heures.</p>

<h2>La sieste : utile, mais pas obligatoire</h2>
<p>Une sieste peut améliorer temporairement la vigilance, la mémoire et certaines performances cognitives. Une durée de dix à trente minutes, en début d’après-midi, limite souvent l’inertie du réveil et le risque de retarder l’endormissement du soir. Une sieste plus longue peut être pertinente après une dette de sommeil, mais elle expose davantage à un réveil lourd et ne remplace pas une nuit régulière.</p>
<p>Les données anthropologiques ne montrent pas une sieste quotidienne universelle. Chez trois sociétés préindustrielles étudiées, elle apparaissait sur moins de 7 % des jours en hiver et moins de 22 % en été. La sieste est donc un outil possible, pas une obligation « ancestrale ».</p>

<h2>Les signaux qui justifient une évaluation</h2>
<p>Des ronflements accompagnés de pauses respiratoires, une somnolence dangereuse, des insomnies persistantes, des mouvements nocturnes marqués ou une fatigue qui ne cède pas malgré une durée suffisante nécessitent une consultation. Les règles d’hygiène de sommeil ne remplacent pas le diagnostic d’un trouble.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/27743803/" target="_blank" rel="noopener noreferrer">Sommeil court et santé : revue systématique, méta-analyse et méta-régression</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/26361380/" target="_blank" rel="noopener noreferrer">Effet d’une nuit de sommeil partiel sur la sensibilité à l’insuline</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/34639511/" target="_blank" rel="noopener noreferrer">Effets cognitifs d’une sieste diurne courte : revue systématique et méta-analyse</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/26480842/" target="_blank" rel="noopener noreferrer">Sommeil naturel dans trois sociétés préindustrielles</a></li>
</ul>
$lesson$),

('Réveil et matin','Ancrer son horloge biologique avec la lumière, la régularité et une routine matinale simple.',$lesson$
<p>Le matin prépare à la fois la journée qui commence et la nuit suivante. Les repères les plus puissants sont simples : une heure de lever régulière, de la lumière extérieure, du mouvement et une routine compatible avec votre vie réelle.</p>

<h2>La lumière du matin donne l’heure au cerveau</h2>
<p>Les photons reçus par la rétine activent les cônes, les bâtonnets et des cellules ganglionnaires contenant de la mélanopsine. Ces informations rejoignent le noyau suprachiasmatique, l’horloge centrale du cerveau. Il n’est ni utile ni prudent de fixer le soleil : sortir et laisser la lumière ambiante atteindre les yeux suffit.</p>

<h3>Activation rétinienne</h3>
<p>La lumière extérieure du matin fournit un signal beaucoup plus intense que la plupart des éclairages intérieurs. Elle indique que la phase active commence et aide à stabiliser l’horaire circadien.</p>

<h3>Réponse de cortisol au réveil</h3>
<p>Chez beaucoup d’adultes, le cortisol augmente naturellement pendant les trente à quarante-cinq minutes qui suivent le réveil. Cette réponse participe à la mobilisation des ressources pour la journée. La lumière peut la moduler, mais elle ne crée pas à elle seule un « pic d’énergie instantané » et le cortisol n’est pas une hormone à éliminer.</p>

<h3>Mélatonine et nuit suivante</h3>
<p>La lumière matinale contribue à supprimer la mélatonine résiduelle et à avancer ou stabiliser l’horloge selon le moment d’exposition. Elle aide ainsi à rendre l’éveil plus net le matin et la somnolence plus prévisible le soir. Il n’existe toutefois pas de minuterie universelle garantissant un sommeil profond exactement douze à quatorze heures plus tard.</p>

<h2>Le protocole matinal minimal</h2>
<ol>
  <li>Levez-vous à une heure proche chaque jour, y compris le week-end lorsque cela est possible.</li>
  <li>Sortez dans la première heure après le réveil. Quelques dizaines de minutes sont un repère pratique ; la durée nécessaire varie avec la météo, la saison et la sensibilité individuelle.</li>
  <li>Marchez, buvez selon votre soif et évitez de commencer la journée dans une pièce sombre devant un écran très lumineux.</li>
  <li>En hiver ou en cas de lever avant l’aube, une lampe de réveil progressif peut faciliter l’éveil ; prenez ensuite de la lumière extérieure dès qu’elle est disponible.</li>
</ol>

<h2>Régularité, soleil et anthropologie</h2>
<p>Des horaires de sommeil plus réguliers sont associés à de meilleurs résultats de santé. Chercher à rapprocher son rythme du cycle jour-nuit est cohérent, mais « dormir au coucher du soleil » n’est pas une règle anthropologique : dans trois sociétés préindustrielles, l’endormissement survenait en moyenne environ 3,3 heures après le coucher du soleil, tandis que le réveil se produisait souvent près ou avant l’aube. L’objectif réaliste est une relation stable avec la lumière naturelle, pas l’imitation littérale d’un horaire saisonnier impossible.</p>

<h2>Réveil spontané et alarme</h2>
<p>Un réveil spontané à heure stable est confortable lorsqu’il est compatible avec vos obligations. Une alarme n’est cependant pas démontrée comme dangereuse ni comme responsable d’une hausse anormale durable du cortisol. La réponse de cortisol au réveil est physiologique, et des travaux n’observent pas d’effet important du simple usage d’une alarme. Si le réveil est pénible, protégez d’abord une durée de sommeil suffisante, évitez la répétition interminable du bouton « rappel » et choisissez éventuellement une sonnerie progressive ou un simulateur d’aube.</p>

<h2>Faut-il absolument manger gras au réveil ?</h2>
<p>Après une nuit sans manger, le glycogène du foie est plus bas, mais il n’est généralement pas « vide ». Le glycogène musculaire reste relativement stable pendant la nuit. Manger du gras n’est donc pas nécessaire pour « remplir » le glycogène ; ce sont surtout les glucides qui permettent sa resynthèse.</p>
<p>Le petit-déjeuner est à adapter à la faim, à l’activité et à la tolérance. Si vous mangez le matin, une combinaison de protéines, d’aliments peu transformés, de fibres et d’une source de lipides peut soutenir la satiété. Un sportif qui s’entraîne tôt peut aussi avoir intérêt à inclure des glucides. Aucune répartition universelle ne justifie de forcer un repas très gras.</p>

<h2>Grounding : ce que l’on sait réellement</h2>
<p>Marcher pieds nus dehors peut être agréable et favoriser le temps passé à la lumière, le mouvement et le contact avec un environnement naturel. Les publications proposées sur le « grounding » rapportent des signaux biologiques intéressants, notamment autour de l’inflammation, mais elles reposent surtout sur de petits travaux, des revues narratives et des auteurs très engagés dans cette hypothèse. Elles ne prouvent pas un effet clinique robuste et ne permettent pas de présenter le grounding comme un traitement.</p>
<p>Vous pouvez le pratiquer comme rituel de plein air si le sol est sûr, sans remplacer les soins validés et sans acheter de dispositif électrique présenté comme médical.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/31394505/" target="_blank" rel="noopener noreferrer">Lumière, rétine, mélanopsine et contrôle neuroendocrinien quotidien</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35298459/" target="_blank" rel="noopener noreferrer">Consensus scientifique sur la lumière du jour, du soir et de la nuit</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/39177247/" target="_blank" rel="noopener noreferrer">Revue de la réponse de cortisol au réveil</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/33054339/" target="_blank" rel="noopener noreferrer">Horaires, régularité du sommeil et santé : revue systématique</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/26480842/" target="_blank" rel="noopener noreferrer">Sommeil et lumière dans trois sociétés préindustrielles</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/12689474/" target="_blank" rel="noopener noreferrer">Valeurs normales et facteurs influençant la réponse de cortisol au réveil</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/32157774/" target="_blank" rel="noopener noreferrer">Variation journalière du glycogène hépatique et musculaire</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/25848315/" target="_blank" rel="noopener noreferrer">Grounding et inflammation : revue narrative et hypothèses</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/28987038/" target="_blank" rel="noopener noreferrer">Grounding : revue narrative des effets proposés</a></li>
</ul>
$lesson$),

('Construire son rituel du soir','Réduire progressivement la lumière et préparer un environnement frais, sombre et calme.',$lesson$
<p>Un bon rituel du soir n’a pas besoin d’être spectaculaire. Il répète des signaux cohérents : la journée ralentit, la lumière baisse, les sollicitations diminuent et la chambre devient un lieu de sommeil.</p>

<h2>Commencer par l’heure de lever</h2>
<p>Choisissez d’abord une heure de lever stable, puis une fenêtre de coucher qui vous laisse une durée suffisante. La régularité compte davantage qu’une heure « parfaite ». Aller au lit exactement au coucher du soleil n’est ni nécessaire ni conforme à toutes les observations anthropologiques ; en revanche, réduire l’éclairage après la tombée du jour rapproche l’environnement moderne du contraste naturel entre jour et nuit.</p>

<h2>Faire descendre la lumière</h2>
<p>Dans les deux à trois heures précédant le coucher, réduisez progressivement l’intensité lumineuse. Préférez plusieurs petites lampes basses, tamisées et chaudes à un plafonnier puissant. Une lampe dite circadienne peut automatiser cette transition si elle diminue réellement l’intensité et la part de courtes longueurs d’onde le soir.</p>
<p>Il n’existe pas d’heure de sécurité universelle comme 18 h : en été, en hiver, selon votre chronotype et votre heure de coucher, elle serait arbitraire. Utilisez plutôt l’heure prévue du sommeil comme repère. La mention « sans scintillement » ou <i>flicker-free</i> peut améliorer le confort visuel chez certaines personnes sensibles, mais la preuve concernant le sommeil porte surtout sur l’intensité, le spectre, le moment et la durée de la lumière.</p>

<h2>Pourquoi l’orangé et le rouge semblent apaisants</h2>
<p>Les tons orangés rappellent le feu et le soleil bas, et contiennent moins de courtes longueurs d’onde que de nombreux éclairages blancs froids. Ils produisent donc généralement un signal mélanopique plus faible à intensité comparable. L’idée que cette préférence vient directement du « camp paisible de nos ancêtres » est une hypothèse séduisante, pas un fait anthropologique démontré.</p>

<h2>Panneaux rouges : ne pas confondre couleur et traitement</h2>
<p>Une lumière rouge faible gêne généralement moins le système circadien qu’une lumière bleue ou verte intense. Cela ne signifie pas qu’il faille regarder un panneau de LED rouges. Une source rouge très lumineuse reste une stimulation visuelle, et les preuves ne montrent pas qu’un panneau fixé des yeux soit nécessaire pour mieux dormir. Pour le soir, la priorité est une lumière faible, indirecte et confortable. Ne fixez jamais une LED puissante et respectez les consignes de sécurité du fabricant.</p>

<h2>Lunettes filtrantes : une option, pas une garantie</h2>
<p>Si vous ne pouvez pas réduire l’éclairage ou éviter les écrans, des verres rouges ou ambrés fortement filtrants peuvent diminuer le signal lumineux reçu par la rétine. Les essais restent petits et hétérogènes : certaines études observent un bénéfice sur l’endormissement, d’autres non. Portez-les éventuellement pendant les deux à trois heures avant le coucher ou après le coucher du soleil lorsque l’exposition artificielle est forte ; les imposer systématiquement dès 18 h n’a pas de fondement universel.</p>
<p><a href="https://www.decathlon.fr/p/mp/lunettes-sexton-filtre-rouge-contre-la-lumiere-bleue-pour-un-sommeil-profond/4317bb69-e6ba-447d-a853-f2bedb371dec/c1c14" target="_blank" rel="noopener noreferrer"><b>Voir la référence Sexton à filtre rouge →</b></a></p>
<p>La fiche commerciale annonce un filtrage de 98 à 100 % entre 380 et 500 nm. Ce chiffre ne remplace pas une mesure spectrale indépendante. Elle indique une monture en acétate et des verres CR-39 : elle ne permet pas d’affirmer que le produit est composé à 100 % de fibres naturelles ou qu’il ne contient aucun polymère.</p>

<h2>Écrans : réduire le signal et l’engagement</h2>
<ul>
  <li>Activez Night Shift, le filtre de lumière chaude ou <a href="https://justgetflux.com/" target="_blank" rel="noopener noreferrer">f.lux</a> sur ordinateur avant la soirée.</li>
  <li>Réduisez fortement la luminosité et utilisez le mode sombre lorsque cela diminue réellement la lumière émise.</li>
  <li>Coupez les notifications et évitez les contenus qui prolongent volontairement l’usage.</li>
  <li>Quand c’est possible, posez l’écran trente à soixante minutes avant de dormir.</li>
</ul>
<p>Une teinte orangée ou un mode sombre réduit souvent l’éblouissement, mais ne neutralise pas toute lumière et ne rend pas une heure de défilement équivalente à l’obscurité.</p>

<h2>Une chambre sombre, calme et thermiquement confortable</h2>
<p>Éteignez ou masquez les voyants gênants, éloignez le téléphone et utilisez des rideaux occultants si la lumière extérieure entre dans la chambre. Une petite LED lointaine n’est pas automatiquement un désastre biologique, mais toute lumière visible qui vous réveille ou éclaire nettement la pièce mérite d’être supprimée. Dormir les volets ouverts peut aider à recevoir la lumière de l’aube seulement si l’environnement reste sombre et sûr pendant la nuit. Le signal circadien passe surtout par la lumière visible reçue par la rétine, pas par des rayons infrarouges qui réveilleraient le corps à travers les paupières.</p>
<p>Un masque ou des bouchons d’oreille ne sont pas intrinsèquement mauvais. Les études montrent qu’ils peuvent améliorer le sommeil dans les environnements bruyants ou lumineux. Choisissez-les confortables, gardez-les propres et n’utilisez pas de bouchons lorsque vous devez entendre une alarme de sécurité, un enfant ou un signal important. Le meilleur choix reste de réduire le bruit et la lumière à la source lorsque c’est possible.</p>
<p>Le sommeil s’accompagne d’une baisse de la température centrale. Une chambre plutôt fraîche aide beaucoup de personnes, mais il n’existe pas une température parfaite pour tous. Commencez autour de 17 à 20 °C, puis ajustez selon la literie, l’humidité, l’âge et votre confort. Chauffage et climatisation sont acceptables s’ils maintiennent une température stable sans souffle direct, bruit, sécheresse excessive ni filtre mal entretenu.</p>

<h2>Une séquence simple de 45 à 60 minutes</h2>
<ol>
  <li>Terminez le travail et notez ce qui devra être repris demain.</li>
  <li>Baissez les lumières, préparez la chambre et placez le téléphone hors de portée.</li>
  <li>Choisissez un geste répétable : lecture, douche tiède, respiration calme ou mouvements légers.</li>
  <li>Allez au lit lorsque la somnolence apparaît. Si vous restez longtemps éveillé avec une tension croissante, levez-vous brièvement sous une lumière faible et revenez quand la somnolence revient.</li>
</ol>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/21193540/" target="_blank" rel="noopener noreferrer">Lumière ambiante avant le coucher et suppression de la mélatonine</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35286195/" target="_blank" rel="noopener noreferrer">Effets cardiométaboliques d’une lumière modérée pendant le sommeil</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35298459/" target="_blank" rel="noopener noreferrer">Recommandations consensuelles sur l’exposition lumineuse quotidienne</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/37593770/" target="_blank" rel="noopener noreferrer">Revue Cochrane des verres filtrant la lumière bleue</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/37192881/" target="_blank" rel="noopener noreferrer">Réduction de la lumière de courte longueur d’onde et sommeil : revue systématique et méta-analyse</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/34925113/" target="_blank" rel="noopener noreferrer">Masques, bouchons d’oreille et sommeil : revue systématique et méta-analyse</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/31105512/" target="_blank" rel="noopener noreferrer">Température et sommeil : revue des mécanismes</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/26480842/" target="_blank" rel="noopener noreferrer">Sommeil, température et cycle solaire dans des sociétés préindustrielles</a></li>
</ul>
$lesson$);

-- Keep each edited lesson as one block, matching the current lesson editor.
delete from public.subchapters s
using public.modules m, public.chapters c, _stoa_sleep_content content
where s.module_id = m.id
  and m.chapter_id = c.id
  and c.is_visible
  and c.title = 'Sommeil'
  and m.title = content.module_title;

insert into public.subchapters (module_id, title, content, order_index)
select m.id, 'Cours', content.content, 0
from _stoa_sleep_content content
join public.chapters c on c.is_visible and c.title = 'Sommeil'
join public.modules m on m.chapter_id = c.id and m.title = content.module_title;

update public.modules m
set description = content.description
from public.chapters c, _stoa_sleep_content content
where m.chapter_id = c.id
  and c.is_visible
  and c.title = 'Sommeil'
  and m.title = content.module_title;
