-- Rebuild Santé & Hygiène around practical self-management and remove the
-- internal headings / numbered lists left in lessons generated for this batch.

create temporary table _stoa_generated_lessons (
  chapter_title text not null,
  module_title text not null,
  primary key (chapter_title, module_title)
) on commit drop;

insert into _stoa_generated_lessons values
  ('Mouvement','Prendre du muscle'),
  ('Mouvement','Perdre du poids'),
  ('Sommeil','Comprendre son sommeil'),
  ('Sommeil','Construire son rituel du soir'),
  ('Sommeil','Réveil et matin'),
  ('Expositions','Comprendre l’exposition'),
  ('Expositions','Alimentation'),
  ('Expositions','Environnement'),
  ('Expositions','Produits ménagers'),
  ('Expositions','Pollution'),
  ('Expositions','Cosmétiques'),
  ('Expositions','Matériaux'),
  ('Expositions','Champs électromagnétiques (EMF)'),
  ('Santé & Hygiène','Cultiver sa littératie en santé'),
  ('Santé & Hygiène','Maladies chroniques'),
  ('Santé & Hygiène','Les gestes essentiels'),
  ('Santé & Hygiène','Un environnement sain'),
  ('Peau & Apparence','Sentir bon'),
  ('Peau & Apparence','Se maquiller'),
  ('Peau & Apparence','Corriger ses problèmes de peau');

update public.subchapters s
set content = replace(
  replace(
    regexp_replace(s.content, '<h[1-6][^>]*>[^<]*</h[1-6]>', '', 'gi'),
    '<ol>',
    '<ul>'
  ),
  '</ol>',
  '</ul>'
)
from public.modules m, public.chapters c, _stoa_generated_lessons generated
where s.module_id = m.id
  and m.chapter_id = c.id
  and c.title = generated.chapter_title
  and m.title = generated.module_title;

create temporary table _stoa_health_lessons (
  module_title text primary key,
  description text not null,
  content text not null
) on commit drop;

insert into _stoa_health_lessons values
('Cultiver sa littératie en santé','Remonter des symptômes vers leurs causes possibles et tester ses hypothèses avec méthode.',$lesson$
<p>Comprendre sa santé ne consiste pas à collectionner des diagnostics. Il faut apprendre à relier un symptôme à son contexte : quand il apparaît, ce qui l’aggrave, ce qui le calme et ce qui a changé juste avant. Cette enquête transforme une sensation vague en informations sur lesquelles vous pouvez agir.</p>

<p>Commencez par reconstruire la chronologie. Notez le début du problème, les infections, blessures, médicaments, changements alimentaires, périodes de stress, déménagements, voyages, travaux dans le logement et modifications du sommeil qui ont précédé. Une cause agit parfois plusieurs semaines avant que le symptôme devienne évident.</p>

<p>Faites ensuite la différence entre trois niveaux :</p>
<ul>
  <li><b>La cause</b> crée le terrain : résistance à l’insuline, carence, infection, exposition, dérèglement hormonal, auto-immunité, blessure ou effet d’un médicament.</li>
  <li><b>Le déclencheur</b> fait apparaître la crise : repas précis, nuit trop courte, effort, alcool, parfum, pollen, conflit ou changement de rythme.</li>
  <li><b>Ce qui entretient</b> empêche le retour à l’équilibre : sédentarité, manque de sommeil, alimentation ultra-transformée, stress continu, exposition répétée ou compensation inadaptée.</li>
</ul>

<p>Gardez un relevé court pendant deux semaines. Notez l’heure, le symptôme de zéro à dix, les repas, le sommeil, le mouvement et les expositions inhabituelles. Inutile de surveiller cinquante données : choisissez celles qui peuvent réellement changer une décision.</p>

<p>Lorsque vous avez une hypothèse, ne changez qu’une variable. Retirez ou ajoutez un élément pendant une période assez longue pour observer une tendance, puis réintroduisez-le lorsque cela a du sens. Si vous changez simultanément l’alimentation, les compléments, le sport et le sommeil, une amélioration ne vous apprendra rien.</p>

<p>Une bonne information répond à une question précise. Cherchez d’abord des essais sur l’humain, puis des revues systématiques. Une expérience sur des cellules explique un mécanisme possible ; elle ne prouve pas qu’un produit fonctionne chez vous. Regardez la taille de l’effet, la durée, les participants et ce qui a réellement été mesuré avant de croire un titre.</p>

<p>Votre carnet est la mémoire de cette enquête. Il permet de voir ce que le souvenir reconstruit mal : la fréquence réelle d’un symptôme, l’effet d’un aliment, la relation avec une nuit courte ou le temps nécessaire pour récupérer.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35131029/" target="_blank" rel="noopener noreferrer">Littératie, activation du patient et autogestion des maladies chroniques</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/26684011/" target="_blank" rel="noopener noreferrer">Auto-surveillance dans les maladies chroniques</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/39517362/" target="_blank" rel="noopener noreferrer">Effets de l’autogestion : revue systématique et méta-analyse</a></li>
</ul>
$lesson$),

('Maladies chroniques','Identifier le terrain, agir sur les causes modifiables et mesurer ce qui change réellement.',$lesson$
<p>Une maladie chronique n’arrive presque jamais à cause d’un seul bouton mal réglé. Elle se construit lorsque plusieurs contraintes dépassent longtemps la capacité d’adaptation du corps. La génétique donne un terrain ; le sommeil, l’alimentation, le mouvement, les expositions, les infections, les hormones et le stress déterminent une grande partie de ce qui s’y exprime.</p>

<p>Les mêmes mécanismes reviennent dans de nombreuses maladies modernes :</p>
<ul>
  <li><b>Une glycémie mal régulée et une résistance à l’insuline</b>, souvent visibles avant le diabète déclaré.</li>
  <li><b>Un excès de graisse viscérale</b>, stockée autour des organes, bien plus actif métaboliquement que la graisse sous-cutanée.</li>
  <li><b>Une alimentation ultra-transformée</b>, facile à manger vite et en grande quantité. Dans un essai contrôlé, elle a fait consommer environ 500 calories supplémentaires par jour malgré des repas présentés avec des quantités comparables de sucre, sel, fibres et macronutriments.</li>
  <li><b>Un manque de muscle et de mouvement</b>, qui réduit la capacité à utiliser le glucose, à produire de l’énergie et à conserver son autonomie.</li>
  <li><b>Un sommeil court ou irrégulier</b>, qui dérègle la faim, la récupération, la tension et la sensibilité à l’insuline.</li>
  <li><b>Le tabac, l’alcool fréquent et les expositions répétées</b>, qui ajoutent une charge que le foie, les poumons, la peau et les systèmes de réparation doivent absorber.</li>
  <li><b>Un stress sans récupération</b>, différent d’un stress ponctuel : le problème vient d’un organisme qui ne retrouve jamais une phase calme.</li>
  <li><b>Une infection persistante, une carence, un dérèglement hormonal, une maladie auto-immune ou un effet médicamenteux</b>, qui demandent une hypothèse spécifique plutôt qu’un conseil général.</li>
</ul>

<p>Vous pouvez déjà observer beaucoup de choses vous-même : le tour de taille, la tension, la fréquence cardiaque au repos, la force, le nombre de pas, les horaires de sommeil, la digestion, la température, l’énergie et la fréquence des crises. Choisissez deux ou trois mesures liées à votre problème et suivez leur tendance, pas chaque variation.</p>

<p>Pendant trente jours, revenez à une base lisible : viande, œufs, poisson, aliments bruts, fruits, tubercules ou riz selon votre tolérance, graisses stables et eau. Retirez l’alcool, les boissons sucrées, les huiles industrielles, les grignotages et les produits dont la liste d’ingrédients ressemble à une formule. Marchez chaque jour, particulièrement après les repas, et gardez deux à quatre séances de renforcement par semaine.</p>

<p>Protégez ensuite le sommeil avant d’ajouter des compléments. Une heure de lever stable, la lumière du matin, une chambre noire et des soirées moins lumineuses peuvent changer simultanément l’appétit, l’énergie et la récupération. Ce socle permet aussi de savoir si le symptôme résiste réellement.</p>

<p>Testez une hypothèse à la fois. Si vous suspectez un aliment, retirez-le proprement puis réintroduisez-le. Si vous suspectez une charge d’entraînement trop forte, baissez-la sans changer le reste. Si vous suspectez le logement, comparez les symptômes après plusieurs jours ailleurs. Une amélioration suivie d’un retour du symptôme lors de la réintroduction constitue une information beaucoup plus utile qu’une impression isolée.</p>

<p>L’automédication commence par ces actions à faible risque. Pour un médicament disponible sans ordonnance, lisez le principe actif, utilisez la dose minimale efficace pendant la durée la plus courte et vérifiez que vous ne prenez pas la même molécule sous deux noms différents. Ne partagez pas d’anciennes prescriptions et n’utilisez pas d’antibiotiques restants. Un complément doit répondre à une hypothèse claire ; dix produits commencés le même jour rendent les effets comme les problèmes impossibles à attribuer.</p>

<p>Un médicament peut calmer un symptôme sans corriger sa cause. Cela ne le rend pas inutile : soulager une douleur, une fièvre ou une allergie peut être précieux. Gardez simplement la distinction entre le secours immédiat et le travail de fond. Ne retirez pas brutalement un traitement quotidien dont l’arrêt peut provoquer un rebond ou un sevrage.</p>

<p>Une douleur thoracique, une difficulté soudaine à respirer, un déficit neurologique, une perte de connaissance, un saignement important ou une dégradation rapide sortent du cadre de l’expérimentation personnelle. Le reste peut être abordé avec calme : une hypothèse, une action, une mesure, puis une décision.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/31105044/" target="_blank" rel="noopener noreferrer">Alimentation ultra-transformée, prise alimentaire et poids : essai contrôlé</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/31501611/" target="_blank" rel="noopener noreferrer">Graisse viscérale et risque cardiométabolique</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/38059362/" target="_blank" rel="noopener noreferrer">Musculation et facteurs de risque cardiovasculaire</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/33618187/" target="_blank" rel="noopener noreferrer">Durée du sommeil et syndrome métabolique</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/32445735/" target="_blank" rel="noopener noreferrer">Intervention intensive sur le mode de vie et rémission du diabète de type 2</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/39517362/" target="_blank" rel="noopener noreferrer">Autogestion des maladies chroniques : méta-analyse</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/36211626/" target="_blank" rel="noopener noreferrer">Automédication, interactions et effets indésirables</a></li>
</ul>
$lesson$),

('Les gestes essentiels','Installer une hygiène simple, sans parfum et sans décaper la peau.',$lesson$
<p>L’hygiène doit retirer ce qui s’accumule sans détruire ce qui vous protège. La peau possède une barrière lipidique et un microbiote. Les laver trop souvent avec de l’eau brûlante, des savons alcalins, des parfums et des antiseptiques laisse une peau sèche, réactive et parfois plus odorante.</p>

<p>Le matin, gardez une routine courte :</p>
<ul>
  <li>Brossez les dents pendant deux minutes avec une brosse souple. Nettoyez entre les dents une fois par jour avec du fil ou des brossettes.</li>
  <li>Rincez le visage à l’eau. Utilisez un nettoyant sans savon uniquement lorsque l’eau ne suffit pas.</li>
  <li>Appliquez une petite quantité de crème au suif de bœuf sans parfum sur les zones sèches. Testez d’abord une zone si votre peau réagit facilement.</li>
  <li>Portez des vêtements propres et respirants. Changez rapidement ceux qui restent humides après le sport.</li>
</ul>

<p>Une douche courte et tiède suffit. Nettoyez les mains, les aisselles, les pieds, les plis et la zone intime externe. Le reste du corps n’a pas besoin d’être décapé chaque jour. Un pain dermatologique sans savon et sans parfum respecte mieux la barrière cutanée qu’un savon très alcalin.</p>

<p>Le parfum ne remplace jamais la propreté. Sur une peau sensible, il ajoute une exposition inutile et peut entretenir irritation, démangeaisons ou maux de tête. Supprimez d’abord les parfums du gel douche, de la lessive, du déodorant et des produits capillaires avant de chercher un nouvel actif.</p>

<p>Pour les cheveux, adaptez la fréquence à votre cuir chevelu. Le rhassoul mélangé à l’eau absorbe le sébum sans nécessiter une longue formule. Massez doucement puis rincez avant qu’il sèche complètement. Alternez avec un shampoing simple si les longueurs deviennent rêches.</p>

<p>Quelques références simples :</p>
<ul>
  <li><a href="https://laboratoiresvendome.fr/products/pain-dermatologique-sans-parfum-100g" target="_blank" rel="noopener noreferrer">Pain dermatologique sans savon et sans parfum — Laboratoires Vendôme</a></li>
  <li><a href="https://www.bodyrestore.fr/products/beef-tallow-creme-geurloos" target="_blank" rel="noopener noreferrer">Crème au suif de bœuf sans parfum — Body Restore</a></li>
  <li><a href="https://lulubaladine.fr/products/shampoing-rhassoul" target="_blank" rel="noopener noreferrer">Shampoing au rhassoul sans parfum — Lulu &amp; Baladine</a></li>
</ul>

<p>Ajoutez un produit uniquement lorsqu’il répond à un besoin visible. Une routine que la peau tolère pendant des mois vaut mieux qu’une salle de bain pleine de solutions commencées puis abandonnées.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35335373/" target="_blank" rel="noopener noreferrer">Savons, syndets et barrière cutanée</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/38982600/" target="_blank" rel="noopener noreferrer">pH des nettoyants et peau atopique</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/25581718/" target="_blank" rel="noopener noreferrer">Nettoyage interdentaire et santé gingivale</a></li>
</ul>
$lesson$),

('Un environnement sain','Retirer du logement les expositions qui entretiennent fatigue, irritation et mauvais sommeil.',$lesson$
<p>Votre logement agit sur vous plusieurs heures par jour. Commencez par ce qui pèse le plus : l’air, l’humidité, la combustion, la lumière nocturne, le bruit, la poussière et les produits diffusés volontairement.</p>

<p>Ouvrez largement les fenêtres matin et soir, puis après la douche, la cuisine et le ménage. Utilisez la hotte dès qu’une cuisson produit fumée ou vapeur. Une odeur de renfermé, de terre ou de cave signale souvent une humidité à chercher derrière les meubles, autour des fenêtres et sous les éviers. Nettoyer la tache sans réparer la fuite ne change rien.</p>

<p>Retirez les diffuseurs, désodorisants, bougies parfumées, encens et sprays. Une maison propre n’a pas besoin de sentir un parfum. Pour les surfaces ordinaires, de l’eau, une microfibre et un produit simple non parfumé suffisent. Ne mélangez jamais la Javel avec du vinaigre, un acide ou de l’ammoniaque.</p>

<p>La chambre mérite le plus d’attention :</p>
<ul>
  <li>Gardez-la fraîche, sombre et silencieuse.</li>
  <li>Choisissez des draps, une housse de couette et des vêtements de nuit en coton lavable.</li>
  <li>Lavez régulièrement la literie et laissez-la sécher complètement avant de refaire le lit.</li>
  <li>Aspirez lentement le matelas et les zones où la poussière s’accumule.</li>
  <li>En cas de réaction aux acariens, utilisez une housse intégrale à tissage serré pour le matelas et l’oreiller.</li>
</ul>

<p><a href="https://www.protecsom.com/produit/housse-matelas-anti-acariens-texaal-coton/" target="_blank" rel="noopener noreferrer">Voir la housse intégrale Texaal en coton →</a></p>

<p>Après des travaux ou l’achat de meubles, aérez davantage pendant plusieurs jours. Laissez les peintures, colles, mousses et bois composites dégazer avant d’y dormir lorsque vous le pouvez. Préférez ensuite le bois massif, le verre, le métal, la laine et le coton aux objets très parfumés ou chargés de traitements.</p>

<p>Changez une pièce à la fois. Commencez par la chambre, puis la cuisine et la salle de bain. Vous verrez plus facilement si la respiration, la peau, le sommeil ou les maux de tête évoluent.</p>

<p><u>Sources :</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/17661925/" target="_blank" rel="noopener noreferrer">Humidité, moisissures et santé respiratoire</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/24484971/" target="_blank" rel="noopener noreferrer">Housses anti-acariens et exposition domestique</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/35286195/" target="_blank" rel="noopener noreferrer">Lumière nocturne et réponses cardiométaboliques pendant le sommeil</a></li>
</ul>
$lesson$);

delete from public.subchapters s
using public.modules m, public.chapters c, _stoa_health_lessons content
where s.module_id = m.id
  and m.chapter_id = c.id
  and c.is_visible
  and c.title = 'Santé & Hygiène'
  and m.title = content.module_title;

insert into public.subchapters (module_id, title, content, order_index)
select m.id, 'Cours', content.content, 0
from _stoa_health_lessons content
join public.chapters c on c.is_visible and c.title = 'Santé & Hygiène'
join public.modules m on m.chapter_id = c.id and m.title = content.module_title;

update public.modules m
set description = content.description
from public.chapters c, _stoa_health_lessons content
where m.chapter_id = c.id
  and c.is_visible
  and c.title = 'Santé & Hygiène'
  and m.title = content.module_title;
