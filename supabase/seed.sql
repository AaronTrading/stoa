-- Données de démonstration réexécutables : 17 chapitres, 34 modules,
-- 3 sous-chapitres par module. Réservé aux environnements de développement.
truncate table public.user_progress, public.subchapters, public.modules, public.chapters cascade;

do $$
declare
  chapter_data jsonb;
  chapter_item jsonb;
  module_item jsonb;
  chapter_uuid uuid;
  module_uuid uuid;
begin
  chapter_data := $json$
  [
    {"category":"Alimentation","title":"Alimentation","description":"Comprendre ses besoins et construire une alimentation réaliste.","modules":[["Les fondations de l’équilibre","Lire ses habitudes sans jugement",18],["Composer ses repas","Passer des principes à l’assiette",22]]},
    {"category":"Hydratation","title":"Hydratation","description":"Observer et organiser son hydratation au quotidien.","modules":[["Comprendre l’hydratation","Les repères essentiels",15],["Créer ses repères","Une organisation adaptée à sa journée",16]]},
    {"category":"Sport","title":"Sport","description":"Bouger avec méthode, plaisir et régularité.","modules":[["Choisir sa pratique","Trouver le mouvement qui vous correspond",20],["Construire sa progression","Avancer avec des repères adaptés",24]]},
    {"category":"Santé","title":"Santé","description":"Mieux comprendre son parcours de santé et ses interlocuteurs.","modules":[["Cultiver sa littératie en santé","Comprendre une information avant de décider",20],["Préparer une consultation","Formuler ses questions et ses priorités",17]]},
    {"category":"Sommeil","title":"Sommeil","description":"Observer son rythme et donner une place au repos.","modules":[["Comprendre son sommeil","Observer avant de changer",19],["Construire son rituel du soir","Créer une transition réaliste",16]]},
    {"category":"Hygiène","title":"Hygiène","description":"Des gestes simples pour prendre soin de soi et de son environnement.","modules":[["Les gestes essentiels","Choisir des routines sobres",14],["Un environnement sain","Observer ses espaces de vie",18]]},
    {"category":"Énergie","title":"Énergie","description":"Identifier ce qui soutient ou disperse son énergie.","modules":[["Cartographier son énergie","Repérer les variations de la journée",17],["Gérer ses ressources","Choisir où placer son effort",20]]},
    {"category":"Productivité","title":"Productivité","description":"Faire moins, avec davantage d’intention.","modules":[["Clarifier ses priorités","Distinguer l’urgent de l’important",18],["Protéger son attention","Organiser des temps de concentration",21]]},
    {"category":"Longévité","title":"Longévité","description":"Penser sa santé dans le temps long.","modules":[["Le temps comme allié","Comprendre l’effet des habitudes répétées",20],["Construire pour durer","Créer des systèmes soutenables",23]]},
    {"category":"Société","title":"Société","description":"Comprendre l’influence de nos milieux de vie.","modules":[["Lire son environnement","Observer les normes et les incitations",22],["Choisir sa participation","Agir à son échelle",19]]},
    {"category":"Spiritualité","title":"Spiritualité","description":"Explorer le sens, les valeurs et la présence.","modules":[["Nommer ce qui compte","Clarifier ses valeurs",18],["Créer un temps de présence","Installer un espace de réflexion",16]]},
    {"category":"Courses","title":"Courses","description":"Acheter avec méthode et simplicité.","modules":[["Préparer ses courses","Partir de ses besoins réels",15],["Lire et choisir","Comparer sans se perdre",20]]},
    {"category":"Recettes","title":"Recettes","description":"Développer un répertoire simple et adaptable.","modules":[["Construire son répertoire","Choisir quelques bases fiables",18],["Cuisiner avec souplesse","Adapter une recette à ce que l’on a",22]]},
    {"category":"Autonomie","title":"Autonomie","description":"Renforcer sa capacité à comprendre, choisir et agir.","modules":[["Décider avec méthode","Passer de l’information au choix",21],["Apprendre par soi-même","Construire une pratique de recherche",24]]},
    {"category":"Relations","title":"Relations","description":"Cultiver les liens et poser des limites claires.","modules":[["Prendre soin de ses liens","Donner du temps à ce qui compte",18],["Poser ses limites","Dire ce qui est possible",20]]},
    {"category":"Argent","title":"Argent","description":"Mettre ses ressources au service de ses priorités.","modules":[["Lire ses dépenses","Observer sans culpabiliser",19],["Construire un budget utile","Donner une fonction à son argent",23]]},
    {"category":"Toxines","title":"Toxines","description":"Évaluer les expositions avec mesure et discernement.","modules":[["Comprendre l’exposition","Distinguer danger, dose et contexte",22],["Réduire avec pragmatisme","Prioriser les changements utiles",18]]}
  ]
  $json$::jsonb;

  for chapter_item in select value from jsonb_array_elements(chapter_data)
  loop
    insert into public.chapters (category, title, description, order_index)
    values (
      chapter_item ->> 'category',
      chapter_item ->> 'title',
      chapter_item ->> 'description',
      (select count(*) from public.chapters)
    )
    returning id into chapter_uuid;

    for module_item in select value from jsonb_array_elements(chapter_item -> 'modules')
    loop
      insert into public.modules (
        chapter_id, title, description, duration_minutes, order_index
      )
      values (
        chapter_uuid,
        module_item ->> 0,
        module_item ->> 1,
        (module_item ->> 2)::integer,
        (select count(*) from public.modules where chapter_id = chapter_uuid)
      )
      returning id into module_uuid;

      insert into public.subchapters (module_id, title, content, order_index)
      values
        (module_uuid, 'Comprendre', '## Comprendre\n\nLes notions essentielles de ce module, expliquées dans un langage clair.', 0),
        (module_uuid, 'Observer', '## Observer\n\nUn temps pour regarder votre situation actuelle avec précision et sans jugement.', 1),
        (module_uuid, 'Mettre en pratique', '## Mettre en pratique\n\nUne action simple à adapter à votre quotidien et à vos contraintes.', 2);
    end loop;
  end loop;
end;
$$;

