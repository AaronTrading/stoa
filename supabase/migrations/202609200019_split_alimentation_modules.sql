do $$
declare
  v_chapter uuid;
  v_module uuid;
  v_subchapter uuid;
begin
  select id into v_chapter from public.chapters where category='Alimentation' order by order_index limit 1;
  if v_chapter is null then raise exception 'Chapitre Alimentation introuvable'; end if;
  update public.chapters set title='Alimentation', description='Ce module est le fondement de notre vitalité. Il explore comment se nourrir comme nos ancêtres, en privilégiant les aliments qui ont façonné notre évolution et soutiennent au mieux notre biologie. L''objectif est d''atteindre une densité nutritionnelle maximale pour une énergie stable, une clarté mentale et une santé optimale.' where id=v_chapter;
  delete from public.modules where chapter_id=v_chapter;
  insert into public.modules(chapter_id,title,description,duration_minutes,order_index) values (v_chapter,'Les Fondamentaux de l''Assiette Primale','Poser les principes d’une alimentation ancestrale et dense.',12,0) returning id into v_module;
  insert into public.subchapters(module_id,title,content,order_index) values (v_module,'Cours',$content$Philosophie : Manger des aliments entiers, non transformés, issus d'animaux élevés sainement et de la nature, qui ont nourri l'humanité pendant des millions d'années.

Priorité absolue : La densité nutritionnelle. Chaque calorie doit apporter un maximum de vitamines, minéraux, protéines et graisses saines.

Exclusion stricte : Tout ce qui est industriel, raffiné, ou qui n'existait pas à l'époque ancestrale.$content$,0) returning id into v_subchapter;
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/alimentation.jpg','Illustration temporaire du sous-module',null,1,0);
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/hydratation.jpg','Illustration temporaire du sous-module',null,2,1);
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/sport.jpg','Illustration temporaire du sous-module',null,3,2);
  insert into public.modules(chapter_id,title,description,duration_minutes,order_index) values (v_chapter,'Les Piliers de Votre Nutrition','Construire l’assiette autour des aliments essentiels.',25,1) returning id into v_module;
  insert into public.subchapters(module_id,title,content,order_index) values (v_module,'Cours',$content$Protéines Animales de Qualité (La Base) :

Viandes Rouges et Volaille : Bœuf, agneau, bison, gibier, poulet, dinde, canard. Privilégiez les animaux élevés à l'herbe (grass-fed/pastured), sans hormones ni antibiotiques.

Idéal : Consommer la viande crue ou très peu cuite (bleue, saignante) pour préserver les enzymes et les vitamines thermosensibles.

Abats (Super-aliments) : Foie (riche en vitamine A, B12, fer), cœur, rognons, langue, cervelle, thymus. C'est l'un des aliments les plus nutritifs qui existent.

Intégration : Consommer 1 à 2 fois par semaine, crus (hachés dans la viande) ou légèrement poêlés.

Poissons et Fruits de Mer Sauvages : Saumon, maquereau, sardines, huîtres, moules, crevettes, algues. Sources essentielles d'oméga-3 (DHA, EPA) et de minéraux (zinc, iode, sélénium).

Huîtres : Un super-aliment inégalé pour le zinc, la vitamine B12, le cuivre et les DHA. À consommer crues.

Œufs Entiers : De poules élevées en plein air. Une source complète de protéines, choline, vitamines liposolubles (A, D, K2) et minéraux.

Idéal : Consommer les jaunes crus pour préserver leur intégrité nutritionnelle.

Graisses Animales Pures (Votre Carburant Principal) :

Beurre Cru/Ghee : De vaches nourries à l'herbe. Riche en vitamines A, D, K2.

Suif, Saindoux, Moelle Osseuse : Graisses animales stables et nutritives, idéales pour la cuisson ou la consommation directe.

Huile d'Olive Vierge Extra : Pour assaisonner à froid uniquement.

Huile de Coco : Utilisable pour la cuisson à chaleur modérée.

Produits Laitiers Crus (Si Tolérés et Légaux) :

Lait cru, kéfir de lait cru, yaourt au lait cru, fromage au lait cru. Sources exceptionnelles de calcium biodisponible, probiotiques, graisses saines et vitamines.

Important : La tolérance est individuelle. Commence par de petites quantités et observe ton corps.

Glucides Naturels et Saisonniers (Avec Intention) :

Fruits de Saison : Baies, pommes, poires, oranges, mangues, etc. Sources de vitamines, minéraux et fibres.

Miel Brut : Local et non pasteurisé. Une source d'énergie rapide, d'antioxydants et d'oligo-éléments.

Tubercules (Optionnel) : Pommes de terre, patates douces. Pour ceux qui ont des besoins énergétiques plus élevés (activité physique intense).$content$,0) returning id into v_subchapter;
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/sante.jpg','Illustration temporaire du sous-module',null,6,0);
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/sommeil.jpg','Illustration temporaire du sous-module',null,12,1);
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/hygiene.jpg','Illustration temporaire du sous-module',null,18,2);
  insert into public.modules(chapter_id,title,description,duration_minutes,order_index) values (v_chapter,'Les Aliments à Éliminer Strictement (Les Toxines Modernes)','Identifier les produits modernes à écarter.',18,2) returning id into v_module;
  insert into public.subchapters(module_id,title,content,order_index) values (v_module,'Cours',$content$Huiles Végétales/de Graines Industrielles :

TOUTES : Tournesol, colza, soja, maïs, carthame, arachide, pépins de raisin, "huile végétale", margarine, shortening. Elles sont pro-inflammatoires, riches en oméga-6 et détruisent la santé cellulaire.

Sucres Raffinés et Édulcorants Artificiels :

Sucre blanc, sirop de maïs à haute teneur en fructose (HFCS), édulcorants comme l'aspartame, le sucralose, la saccharine. Ils perturbent la glycémie, la flore intestinale et la santé métabolique.

Aliments Ultra-Transformés :

Toute préparation industrielle avec une longue liste d'ingrédients inconnus, les "plats préparés", les "snacks" industriels, les céréales du petit-déjeuner.

Céréales et Légumineuses (À Éviter au Maximum) :

Blé, riz, maïs, haricots, lentilles, pois chiches. Elles contiennent des anti-nutriments (lectines, phytates) qui peuvent endommager l'intestin et empêcher l'absorption des minéraux. Les préparations ancestrales (trempage, fermentation longue) peuvent réduire leur toxicité, mais elles ne sont pas le pilier d'une alimentation optimale.

Produits Laitiers Industriels :

Lait pasteurisé, homogénéisé, écrémé. Le traitement industriel détruit les enzymes, dénature les protéines et rend les nutriments moins biodisponibles.

"Viandes" Végétales et Substituts :

Tous les produits à base de soja, pois, ou autres protéines végétales transformées pour imiter la viande. Ils sont ultra-transformés et souvent chargés en ingrédients indésirables.$content$,0) returning id into v_subchapter;
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/energie.jpg','Illustration temporaire du sous-module',null,3,0);
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/productivite.jpg','Illustration temporaire du sous-module',null,7,1);
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/longevite.jpg','Illustration temporaire du sous-module',null,10,2);
  insert into public.modules(chapter_id,title,description,duration_minutes,order_index) values (v_chapter,'Structurer vos Repas','Organiser ses repas selon sa faim et son activité.',15,3) returning id into v_module;
  insert into public.subchapters(module_id,title,content,order_index) values (v_module,'Cours',$content$Écoutez votre Faim : Ne mangez que lorsque vous avez faim. L'alimentation primale est naturellement rassasiante.

Repas Centrés sur Protéines et Graisses : Chaque repas doit être riche en protéines et graisses animales, avec des glucides naturels en fonction de votre activité et de vos préférences.

Jeûne Intermittent (Optionnel) : Sauter un repas (souvent le petit-déjeuner) peut être bénéfique pour la digestion et la flexibilité métabolique.

Exemples de Repas :

Petit-déjeuner : Quelques jaunes d'œufs crus, une tranche de foie, un peu de fruit ou de miel. Ou un grand verre de lait cru avec du miel.

Déjeuner/Dîner : Steak de bœuf (cru ou bleu) avec du suif, un morceau de foie (cru ou très léger), quelques huîtres, et un peu de fruit.$content$,0) returning id into v_subchapter;
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/societe.jpg','Illustration temporaire du sous-module',null,2,0);
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/spiritualite.jpg','Illustration temporaire du sous-module',null,4,1);
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/courses.jpg','Illustration temporaire du sous-module',null,5,2);
  insert into public.modules(chapter_id,title,description,duration_minutes,order_index) values (v_chapter,'Approvisionnement et Préparation Pratique','Choisir ses produits et les préparer simplement.',18,4) returning id into v_module;
  insert into public.subchapters(module_id,title,content,order_index) values (v_module,'Cours',$content$La Qualité est ROI : Investissez dans la meilleure qualité que votre budget permet. Cherchez des bouchers locaux, des éleveurs directs, des marchés de producteurs et des poissonniers fiables.

Privilégiez le Cru : Pour la viande, les œufs, les produits laitiers. C'est la forme la plus biodisponible des nutriments.

Cuisson Simple : Si vous cuisez, utilisez des méthodes douces : saisir rapidement, cuisson lente (bouillon d'os), privilégier le peu cuit (bleu, saignant).

Listes de Courses : Fournir des exemples de listes de courses types pour faciliter le démarrage.

Budget : Discuter des stratégies pour manger primal sans se ruiner (acheter en gros, utiliser les abats, cuisiner simplement).$content$,0) returning id into v_subchapter;
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/recettes.jpg','Illustration temporaire du sous-module',null,2,0);
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/autonomie.jpg','Illustration temporaire du sous-module',null,3,1);
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/relations.jpg','Illustration temporaire du sous-module',null,5,2);
  insert into public.modules(chapter_id,title,description,duration_minutes,order_index) values (v_chapter,'L''Esprit et l''Intuition Alimentaire','Retrouver écoute, souplesse et plaisir.',12,5) returning id into v_module;
  insert into public.subchapters(module_id,title,content,order_index) values (v_module,'Cours',$content$Reconnectez-vous à votre Corps : Apprenez à interpréter les signaux de faim, de satiété, de digestion, d'énergie et d'humeur. Votre corps est votre meilleur guide.

Flexibilité : L'alimentation primale est un cadre, pas une prison. Adaptez-la à vos besoins, saisons, activités et préférences personnelles.

Plaisir : Manger doit rester une expérience agréable et satisfaisante. Profitez de chaque repas.$content$,0) returning id into v_subchapter;
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/argent.jpg','Illustration temporaire du sous-module',null,1,0);
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/toxines.jpg','Illustration temporaire du sous-module',null,2,1);
  insert into public.subchapter_images(subchapter_id,image_url,alt_text,caption,position_index,order_index) values (v_subchapter,'/assets/categories/alimentation.jpg','Illustration temporaire du sous-module',null,3,2);
end;
$$;
