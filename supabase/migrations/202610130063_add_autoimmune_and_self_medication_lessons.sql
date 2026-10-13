-- Add two practical Santé & Hygiène lessons and keep their order deterministic.

do $$
declare
  v_chapter_id uuid;
  v_title text;
  v_description text;
begin
  select id into v_chapter_id
  from public.chapters
  where is_visible and title = 'Santé & Hygiène'
  order by order_index
  limit 1;

  if v_chapter_id is null then
    return;
  end if;

  update public.modules
  set order_index = order_index + 10000
  where chapter_id = v_chapter_id;

  for v_title, v_description in
    select * from (values
      ('Maladies auto-immunes'::text, 'Comprendre le terrain auto-immun et agir sur les facteurs qui entretiennent les poussées.'::text),
      ('Automédication utile'::text, 'Choisir quelques médicaments réellement utiles et savoir exactement quand s’arrêter.'::text)
    ) as lessons(title, description)
  loop
    if not exists (
      select 1 from public.modules where chapter_id = v_chapter_id and title = v_title
    ) then
      insert into public.modules (
        chapter_id, title, description, duration_minutes, order_index, is_visible
      ) values (
        v_chapter_id,
        v_title,
        v_description,
        20,
        (select coalesce(max(order_index), 9999) + 1 from public.modules where chapter_id = v_chapter_id),
        true
      );
    end if;
  end loop;

  with ordered as (
    select
      id,
      row_number() over (
        order by
          case title
            when 'Cultiver sa littératie en santé' then 0
            when 'Maladies chroniques' then 1
            when 'Maladies auto-immunes' then 2
            when 'Automédication utile' then 3
            when 'Les gestes essentiels' then 4
            when 'Un environnement sain' then 5
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

create temporary table _stoa_new_health_lessons (
  module_title text primary key,
  description text not null,
  content text not null
) on commit drop;

insert into _stoa_new_health_lessons values
('Maladies auto-immunes','Comprendre le terrain auto-immun et agir sur les facteurs qui entretiennent les poussées.',$lesson$
<p>Une maladie auto-immune apparaît lorsque le système immunitaire perd une partie de sa tolérance et attaque un tissu de l’organisme. Selon la cible, cela peut toucher la thyroïde, les articulations, l’intestin, la peau, le pancréas ou le système nerveux. Hashimoto, Basedow, la polyarthrite rhumatoïde, le diabète de type 1, la maladie cœliaque, le lupus et la sclérose en plaques ne sont donc pas la même maladie, même si elles partagent certains mécanismes.</p>

<p>Ce n’est pas simplement un système immunitaire « trop fort ». C’est une réponse mal dirigée, construite par la rencontre entre un terrain génétique et plusieurs expositions. Une infection peut servir de déclencheur. Le lien entre le virus d’Epstein-Barr et la sclérose en plaques est aujourd’hui particulièrement fort. Le tabac augmente nettement le risque de polyarthrite rhumatoïde et aggrave plusieurs maladies auto-immunes. Le sommeil, l’adiposité viscérale, le manque de mouvement, certaines expositions, l’état de la barrière intestinale et les carences peuvent ensuite peser sur l’inflammation et la récupération.</p>

<p>Commencez par reconstruire votre histoire. Faites une frise avec le début des symptômes, les infections, antibiotiques, changements hormonaux, périodes de stress, déménagements, nouveaux produits, modifications alimentaires et nuits très courtes. Ajoutez les poussées avec leur durée. Le but est de faire apparaître les éléments qui reviennent, pas de trouver un coupable unique en une soirée.</p>

<p>Entre deux poussées, construisez un socle qui laisse moins de bruit :</p>
<ul>
  <li>Retirez le tabac et limitez l’alcool.</li>
  <li>Gardez des horaires de sommeil réguliers et prenez la lumière extérieure le matin.</li>
  <li>Mangez surtout des aliments bruts, suffisamment de protéines, du poisson gras, des œufs, de la viande, des fruits et les féculents que vous tolérez.</li>
  <li>Réduisez franchement les produits ultra-transformés, les huiles industrielles et le grignotage continu.</li>
  <li>Marchez chaque jour et maintenez du renforcement. Pendant une poussée, baissez l’intensité avant de supprimer tout mouvement.</li>
  <li>Corrigez une carence réellement identifiée. La vitamine D mérite d’être mesurée avant de multiplier les fortes doses.</li>
  <li>Soignez les foyers d’irritation permanents : bouche, peau, sommeil, moisissures et fumées.</li>
</ul>

<p>Pour tester l’alimentation, retirez un seul groupe à la fois puis réintroduisez-le. Une éviction immense et permanente vous empêche de savoir ce qui comptait vraiment. La maladie cœliaque fait exception : le gluten y déclenche la réponse auto-immune et doit être retiré strictement. Si vous la suspectez, faites les analyses avant de supprimer le gluten, car l’éviction peut faire disparaître les marqueurs recherchés.</p>

<p>Gardez un relevé simple : douleur, énergie, digestion, peau, sommeil, température et cycle lorsque cela s’applique. Ajoutez le changement testé et sa date. Une baisse nette des symptômes, puis leur retour lors d’une réintroduction prudente, donne une piste plus solide qu’une bonne journée isolée.</p>

<p>Les traitements qui freinent la réponse immunitaire peuvent protéger une articulation, une glande ou un organe pendant que vous travaillez sur le terrain. Ne les arrêtez pas brutalement. L’objectif n’est pas de choisir entre le mode de vie et le traitement : c’est de réduire tout ce qui entretient la maladie sans perdre la protection déjà obtenue.</p>

<p>Une faiblesse soudaine, une perte de vision, une difficulté à respirer, une douleur thoracique, une fièvre importante sous traitement immunosuppresseur ou une dégradation rapide ne se testent pas à la maison.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35025605/" target="_blank" rel="noopener noreferrer">Virus d’Epstein-Barr et risque de sclérose en plaques</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/24594022/" target="_blank" rel="noopener noreferrer">Tabac et polyarthrite rhumatoïde : méta-analyse dose-réponse</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/39228044/" target="_blank" rel="noopener noreferrer">Environnement, mode de vie et développement des maladies auto-immunes</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/29108826/" target="_blank" rel="noopener noreferrer">Activité physique et maladies auto-immunes</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35082139/" target="_blank" rel="noopener noreferrer">Vitamine D et apparition de maladies auto-immunes : essai VITAL</a></li>
</ul>
$lesson$),

('Automédication utile','Choisir quelques médicaments réellement utiles et savoir exactement quand s’arrêter.',$lesson$
<p>Une bonne automédication ne remplit pas une armoire. Elle utilise une molécule connue, pour un problème banal et reconnaissable, à la dose minimale efficace et pendant peu de temps. Regardez toujours le principe actif : deux boîtes de marques différentes peuvent contenir exactement le même médicament.</p>

<p>Voici le noyau utile pour un adulte. Les doses indiquées sont des repères usuels ; la notice de votre boîte reste prioritaire, notamment selon le poids, la grossesse, les reins, le foie et les autres traitements.</p>

<table>
  <thead><tr><th>Problème</th><th>Choix utile</th><th>Comment l’utiliser</th><th>Quand éviter</th></tr></thead>
  <tbody>
    <tr><td>Douleur courante ou fièvre</td><td><strong>Paracétamol</strong></td><td>500 mg, puis 1 g si nécessaire, espacés d’au moins 4 à 6 heures. Maximum 3 g par jour chez l’adulte de plus de 50 kg. Vérifiez toutes les associations pour ne pas le doubler.</td><td>Maladie du foie, alcool important, poids inférieur à 50 kg ou prise d’un autre produit contenant du paracétamol.</td></tr>
    <tr><td>Douleur inflammatoire, règles douloureuses, douleur dentaire ou migraine connue</td><td><strong>Ibuprofène</strong></td><td>200 à 400 mg avec un repas, espacés d’au moins 6 heures. Maximum 1 200 mg par jour, pendant la durée la plus courte.</td><td>Grossesse, ulcère, maladie rénale, déshydratation, anticoagulant, asthme déclenché par un anti-inflammatoire ou infection qui s’aggrave.</td></tr>
    <tr><td>Rhume des foins ou urticaire simple</td><td><strong>Cétirizine</strong></td><td>10 mg une fois par jour chez l’adulte et l’adolescent de plus de 12 ans. Testez-la un jour sans conduite si vous ne connaissez pas son effet sur vous.</td><td>Somnolence importante, insuffisance rénale sans adaptation de dose ou gêne respiratoire et gonflement de la bouche.</td></tr>
    <tr><td>Reflux occasionnel</td><td><strong>Alginate avec bicarbonate</strong></td><td>Après le repas et au coucher pour former une barrière rapide. Pour des brûlures fréquentes, l’oméprazole 20 mg une fois par jour peut être utilisé au maximum 14 jours ; son effet demande souvent 2 à 3 jours.</td><td>Difficulté à avaler, sang, amaigrissement inexpliqué, douleur thoracique ou reflux qui revient dès l’arrêt. Attention au sodium des alginates.</td></tr>
    <tr><td>Diarrhée aiguë aqueuse</td><td><strong>Solution de réhydratation</strong>, puis lopéramide si la diarrhée doit être freinée</td><td>Buvez d’abord une solution de réhydratation. Pour le lopéramide adulte : 4 mg au départ, puis 2 mg après chaque selle liquide, sans dépasser 12 mg par jour ni 2 jours.</td><td>Sang dans les selles, forte fièvre, ventre gonflé, diarrhée après antibiotique, maladie inflammatoire de l’intestin ou enfant.</td></tr>
    <tr><td>Constipation occasionnelle</td><td><strong>Macrogol</strong></td><td>Il retient l’eau dans les selles et agit généralement en 24 à 48 heures. Suivez la dose de la boîte et gardez-le comme traitement temporaire.</td><td>Douleur abdominale inexpliquée, vomissements, ventre très gonflé, suspicion d’occlusion ou maladie inflammatoire intestinale en poussée.</td></tr>
    <tr><td>Mycose typique entre les orteils</td><td><strong>Terbinafine 1 % en crème</strong></td><td>Une application par jour pendant une semaine sur peau lavée et bien séchée, en débordant légèrement autour de la zone.</td><td>Ongle, cuir chevelu, grande surface, plaie, diagnostic incertain ou absence d’amélioration.</td></tr>
    <tr><td>Arrêt du tabac</td><td><strong>Substituts nicotiniques</strong></td><td>Un patch pour le fond, complété par une gomme ou une pastille lors des envies, fonctionne mieux qu’une seule forme chez beaucoup de fumeurs. La dose dépend du nombre de cigarettes et du délai avant la première cigarette.</td><td>Surdosage avec nausées, palpitations ou vertiges : retirez le patch et réduisez la dose.</td></tr>
  </tbody>
</table>

<p>Paracétamol et ibuprofène ne sont pas interchangeables. Le premier calme douleur et fièvre mais n’est pas anti-inflammatoire. Le second agit sur l’inflammation mais expose davantage l’estomac, les reins et le système cardiovasculaire. Ne les alternez pas mécaniquement et n’associez jamais deux anti-inflammatoires.</p>

<p>Pour un rhume banal, gardez le lavage de nez au sérum physiologique, l’eau, le repos et le miel après un an. Les sachets « tout-en-un », sirops antitussifs, fluidifiants, sprays multiples et cocktails de vitamines ajoutent souvent des effets indésirables sans raccourcir l’infection. La pseudoéphédrine orale n’est plus vendue sans ordonnance en France depuis décembre 2024 en raison de risques cardiovasculaires et neurologiques rares mais graves.</p>

<p>Écartez aussi l’homéopathie, les produits « détox », les antibiotiques restants et tout médicament emprunté. Un antibiotique ne soigne ni le rhume ni la grippe. Une crème corticoïde peut être très utile sur le bon problème, mais elle peut masquer ou aggraver une mycose : ne l’utilisez pas au hasard sur une plaque inconnue.</p>

<p>Arrêtez l’essai lorsque la durée prévue est atteinte, lorsque le symptôme s’aggrave ou lorsqu’un nouveau signe apparaît. Une douleur thoracique, un essoufflement, un déficit neurologique, une réaction allergique avec gonflement, un saignement important, une raideur de nuque ou une déshydratation marquée ne relèvent pas de ce tableau.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://base-donnees-publique.medicaments.gouv.fr/medicament/67770378/extrait" target="_blank" rel="noopener noreferrer">Paracétamol 500 mg : indication, dose et statut sans ordonnance</a></li>
  <li><a href="https://base-donnees-publique.medicaments.gouv.fr/medicament/62840805/extrait" target="_blank" rel="noopener noreferrer">Ibuprofène 200 mg : indication, dose et précautions</a></li>
  <li><a href="https://m.base-donnees-publique.medicaments.gouv.fr/notice-64873825-3" target="_blank" rel="noopener noreferrer">Cétirizine 10 mg : notice</a></li>
  <li><a href="https://base-donnees-publique.medicaments.gouv.fr/medicament/65728544/extrait" target="_blank" rel="noopener noreferrer">Oméprazole conseil 20 mg : traitement court du reflux</a></li>
  <li><a href="https://base-donnees-publique.medicaments.gouv.fr/medicament/67351394/extrait" target="_blank" rel="noopener noreferrer">Alginate et bicarbonate : reflux et régurgitations</a></li>
  <li><a href="https://base-donnees-publique.medicaments.gouv.fr/medicament/67504559/extrait" target="_blank" rel="noopener noreferrer">Lopéramide : dose, durée et contre-indications</a></li>
  <li><a href="https://base-donnees-publique.medicaments.gouv.fr/medicament/62128850/extrait" target="_blank" rel="noopener noreferrer">Terbinafine 1 % : traitement local du pied d’athlète</a></li>
  <li><a href="https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD013308.pub2/full" target="_blank" rel="noopener noreferrer">Substituts nicotiniques combinés : revue Cochrane</a></li>
  <li><a href="https://ansm.sante.fr/uploads/2025/02/07/20250207-marr-pseudoephedrine-fiche-patient.pdf" target="_blank" rel="noopener noreferrer">Pseudoéphédrine orale : nouvelles conditions de délivrance et risques</a></li>
</ul>
$lesson$);

delete from public.subchapters s
using public.modules m, public.chapters c, _stoa_new_health_lessons content
where s.module_id = m.id
  and m.chapter_id = c.id
  and c.is_visible
  and c.title = 'Santé & Hygiène'
  and m.title = content.module_title;

insert into public.subchapters (module_id, title, content, order_index)
select m.id, 'Cours', content.content, 0
from _stoa_new_health_lessons content
join public.chapters c on c.is_visible and c.title = 'Santé & Hygiène'
join public.modules m on m.chapter_id = c.id and m.title = content.module_title;

update public.modules m
set description = content.description,
    duration_minutes = 20,
    is_visible = true
from public.chapters c, _stoa_new_health_lessons content
where m.chapter_id = c.id
  and c.is_visible
  and c.title = 'Santé & Hygiène'
  and m.title = content.module_title;
