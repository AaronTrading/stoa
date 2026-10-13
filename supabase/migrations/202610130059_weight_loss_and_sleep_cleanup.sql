-- Remove the misplaced energy-tracking lesson and replace the weight-gain
-- module with an evidence-based weight-loss lesson.

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

  if v_chapter_id is not null then
    delete from public.modules
    where chapter_id = v_chapter_id
      and title = 'Cartographier son énergie';

    update public.modules
    set order_index = order_index + 10000
    where chapter_id = v_chapter_id;

    with ordered as (
      select id, row_number() over (order by order_index, id) - 1 as next_order
      from public.modules
      where chapter_id = v_chapter_id
    )
    update public.modules m
    set order_index = ordered.next_order
    from ordered
    where m.id = ordered.id;
  end if;

  select id into v_chapter_id
  from public.chapters
  where is_visible and title = 'Mouvement'
  order by order_index
  limit 1;

  if v_chapter_id is null then
    return;
  end if;

  select id into v_module_id
  from public.modules
  where chapter_id = v_chapter_id and title = 'Perdre du poids'
  order by created_at
  limit 1;

  if v_module_id is null then
    update public.modules
    set title = 'Perdre du poids'
    where id = (
      select id
      from public.modules
      where chapter_id = v_chapter_id and title = 'Prendre du poids'
      order by created_at
      limit 1
    )
    returning id into v_module_id;
  else
    delete from public.modules
    where chapter_id = v_chapter_id
      and title = 'Prendre du poids';
  end if;

  if v_module_id is null then
    insert into public.modules (
      chapter_id, title, description, duration_minutes, order_index, is_visible
    ) values (
      v_chapter_id,
      'Perdre du poids',
      'Réduire la masse grasse sans sacrifier la santé, les hormones ni la masse musculaire.',
      22,
      (select coalesce(max(order_index), -1) + 1 from public.modules where chapter_id = v_chapter_id),
      true
    ) returning id into v_module_id;
  end if;

  update public.modules
  set description = 'Réduire la masse grasse sans sacrifier la santé, les hormones ni la masse musculaire.',
      duration_minutes = 22
  where id = v_module_id;

  delete from public.subchapters where module_id = v_module_id;

  insert into public.subchapters (module_id, title, content, order_index)
  values (v_module_id, 'Cours', $lesson$
<p>Perdre du poids n’est pas toujours nécessaire, et perdre du poids n’est pas exactement la même chose que perdre de la graisse. Une démarche utile cherche à réduire un excès de masse grasse lorsqu’il existe, tout en préservant le muscle, l’énergie, le sommeil, la santé hormonale et la capacité à vivre normalement.</p>

<h2>Avant de créer un déficit</h2>
<p>La balance seule ne décide pas si une perte est souhaitable. Regardez aussi le tour de taille, l’évolution de la composition corporelle, la tension artérielle, les marqueurs métaboliques lorsqu’ils sont disponibles, les performances, les symptômes et le rapport que vous entretenez avec l’alimentation.</p>
<p>Si votre poids est stable, que vos marqueurs sont satisfaisants et que votre objectif est uniquement de correspondre à une image très sèche, perdre davantage peut offrir peu de bénéfices et créer beaucoup de contraintes. Une grossesse, un allaitement, un trouble du comportement alimentaire actuel ou ancien, une aménorrhée, une perte de poids involontaire ou une maladie chronique nécessitent un avis professionnel avant toute restriction.</p>

<h2>Le pourcentage de masse grasse n’a pas un chiffre idéal universel</h2>
<p>Les méthodes de mesure comportent une marge d’erreur : impédancemètre, plis cutanés et DXA ne donnent pas des valeurs parfaitement interchangeables. Un chiffre isolé ne doit donc jamais devenir un verdict.</p>
<p>Une étude de référence a proposé les fourchettes provisoires suivantes en reliant le pourcentage de masse grasse aux IMC habituellement considérés comme sains. Ce sont des repères de population, pas des objectifs obligatoires :</p>
<ul>
  <li><b>20 à 39 ans :</b> environ 8 à 20 % chez l’homme et 21 à 33 % chez la femme.</li>
  <li><b>40 à 59 ans :</b> environ 11 à 22 % chez l’homme et 23 à 34 % chez la femme.</li>
  <li><b>60 à 79 ans :</b> environ 13 à 25 % chez l’homme et 24 à 36 % chez la femme.</li>
</ul>
<p>Ces fourchettes sont larges parce que l’âge, le sexe, la masse musculaire, la répartition abdominale ou gynoïde de la graisse, les antécédents et les marqueurs métaboliques comptent davantage qu’un prétendu taux parfait.</p>

<h2>Origine ethnique : des différences moyennes, aucun quota individuel</h2>
<p>Il n’existe pas de pourcentage de masse grasse « idéal » validé pour chaque ethnogroupe. Les catégories ethniques regroupent des populations très diverses et ne remplacent pas une mesure individuelle. Les études montrent cependant que la relation entre IMC, masse grasse et risque métabolique varie en moyenne :</p>
<ul>
  <li><b>Populations d’Asie de l’Est et du Sud :</b> à IMC égal, plusieurs cohortes observent souvent davantage de masse grasse, parfois de l’ordre de trois à cinq points, et un risque cardiométabolique plus précoce. Cela justifie de surveiller le tour de taille et les marqueurs métaboliques ; cela ne justifie pas de poursuivre arbitrairement un taux de graisse plus bas.</li>
  <li><b>Populations d’ascendance africaine :</b> certaines cohortes observent en moyenne davantage de masse maigre et une relation IMC–masse grasse différente de celle des populations européennes. Il serait faux d’appliquer une correction fixe ou de conclure que le risque est absent.</li>
  <li><b>Populations européennes, latino-américaines, caribéennes ou mixtes :</b> les résultats varient fortement selon l’âge, le sexe, la région, le niveau d’activité et les conditions sociales. Les références construites surtout dans des cohortes européennes ou nord-américaines ne constituent pas une norme biologique universelle.</li>
</ul>
<p>En pratique, utilisez plusieurs indicateurs : évolution du tour de taille, composition corporelle mesurée toujours avec la même méthode, force, cycle menstruel, sommeil et bilan clinique. L’origine peut aider à interpréter un résultat ; elle ne doit pas dicter une cible esthétique.</p>

<h2>Pourquoi les femmes ont naturellement davantage de masse grasse</h2>
<p>À âge et corpulence comparables, les femmes ont généralement un pourcentage de masse grasse plus élevé que les hommes. Les hormones sexuelles influencent le stockage sous-cutané, notamment autour des hanches et des cuisses. Cette réserve et cette répartition font partie de la physiologie féminine ; elles ne sont pas une version imparfaite d’un corps masculin.</p>
<p>Une restriction énergétique trop forte peut réduire la disponibilité énergétique, perturber les hormones reproductives, modifier ou arrêter les règles et fragiliser la santé osseuse. Les hommes peuvent également subir des effets hormonaux et osseux lorsque le déficit devient important, mais les troubles menstruels fournissent chez la femme un signal d’alerte visible.</p>
<p>Une femme n’a donc pas à chercher systématiquement le taux le plus bas possible. Des règles qui deviennent irrégulières, une sensation de froid constante, une fatigue persistante, une baisse de libido, des blessures répétées, une humeur dégradée ou une obsession alimentaire indiquent qu’il faut interrompre l’escalade du déficit et demander un avis adapté.</p>

<h2>Cellulite : normale, fréquente et indépendante de l’accouchement</h2>
<p>La cellulite concerne la grande majorité des femmes après la puberté, y compris des femmes minces et sportives. Elle dépend notamment de l’architecture des cloisons fibreuses et du tissu sous-cutané, qui diffère en moyenne entre les sexes. Elle n’est ni une preuve d’excès de graisse ni une réserve nécessaire à l’accouchement. La grossesse et l’accouchement ne nécessitent pas la présence de cellulite.</p>
<p>Une perte de graisse peut en modifier l’apparence chez certaines personnes, mais ne garantit pas sa disparition. La traiter comme un défaut à éliminer conduit souvent à poursuivre inutilement une perte de poids alors que la composition corporelle est déjà saine.</p>

<h2>Perdre de la graisse en préservant le reste</h2>
<ol>
  <li><b>Créez un déficit modéré.</b> Commencez par réduire légèrement les portions les plus énergétiques ou les consommations peu rassasiantes. Un déficit extrême accélère la perte de masse maigre et augmente la fatigue.</li>
  <li><b>Conservez les protéines et la musculation.</b> Répartissez des sources protéiques suffisantes dans la journée et maintenez un entraînement de résistance progressif.</li>
  <li><b>Gardez du mouvement quotidien.</b> Marche, escaliers et activités ordinaires soutiennent la dépense sans transformer chaque séance en punition.</li>
  <li><b>Protégez le sommeil.</b> Une stratégie qui exige de sacrifier le sommeil ou augmente fortement la faim devient difficile à maintenir.</li>
  <li><b>Suivez une tendance.</b> Comparez les moyennes hebdomadaires, le tour de taille, la force et votre fonctionnement général plutôt qu’une variation quotidienne.</li>
</ol>
<p>Un rythme lent est généralement plus compatible avec la conservation du muscle. Si la force chute durablement, si la faim devient envahissante ou si le cycle menstruel se dérègle, le déficit est probablement trop agressif pour votre situation.</p>

<h2>Le résultat doit rester vivable</h2>
<p>La meilleure cible n’est pas le chiffre le plus bas que vous pouvez atteindre pendant quelques semaines. C’est une zone que vous pouvez maintenir avec une alimentation suffisante, une vie sociale, un sommeil stable, de bonnes performances et sans surveillance mentale permanente. Une fois cette zone atteinte, stabiliser est une réussite à part entière.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/10966886/" target="_blank" rel="noopener noreferrer">Fourchettes provisoires de masse grasse selon l’âge, le sexe et la population</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/26663309/" target="_blank" rel="noopener noreferrer">Différences entre populations dans la relation IMC–adiposité : revue critique</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/12164465/" target="_blank" rel="noopener noreferrer">Relation entre IMC et masse grasse dans différentes populations asiatiques</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/31696452/" target="_blank" rel="noopener noreferrer">Disponibilité énergétique, fonction reproductive et santé osseuse chez les femmes et les hommes</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/38194640/" target="_blank" rel="noopener noreferrer">Disponibilité énergétique et troubles menstruels : revue critique</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/32976174/" target="_blank" rel="noopener noreferrer">Physiopathologie de la cellulite : revue</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/34623696/" target="_blank" rel="noopener noreferrer">Déficit énergétique, entraînement de résistance et préservation de la masse maigre</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/40909191/" target="_blank" rel="noopener noreferrer">Musculation pendant la perte de poids : revue systématique et méta-analyse</a></li>
</ul>
$lesson$, 0);
end;
$$;
