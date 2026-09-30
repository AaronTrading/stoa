create table public.pillars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  order_index integer not null unique check (order_index >= 0),
  created_at timestamptz not null default now()
);

alter table public.pillars enable row level security;
grant select, insert, update, delete on public.pillars to authenticated;
create policy "authenticated users read pillars" on public.pillars for select to authenticated using (true);
create policy "admins manage pillars" on public.pillars for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

alter table public.chapters drop constraint if exists chapters_category_check;
alter table public.chapters
  add column pillar_id uuid references public.pillars(id) on delete restrict,
  add column is_visible boolean not null default true,
  add column visual_key text;
alter table public.modules add column is_visible boolean not null default true;
create index chapters_pillar_id_idx on public.chapters(pillar_id);

-- L'ancienne structure reste en base, masquée, afin qu'aucun texte ne soit détruit.
update public.chapters set order_index = order_index + 1000, is_visible = false;
update public.modules set is_visible = false;

do $$
declare
  pillar_item jsonb;
  chapter_item jsonb;
  module_item jsonb;
  pillar_uuid uuid;
  chapter_uuid uuid;
  module_uuid uuid;
begin
  create temporary table _pillar_map (key text primary key, id uuid not null) on commit drop;
  create temporary table _chapter_map (key text primary key, id uuid not null) on commit drop;

  for pillar_item in select value from jsonb_array_elements($json$[
    {"key":"nourrir","title":"NOURRIR","order":0},
    {"key":"corps","title":"CORPS","order":1},
    {"key":"proteger","title":"PROTÉGER","order":2},
    {"key":"vivre","title":"VIVRE","order":3},
    {"key":"se-construire","title":"SE CONSTRUIRE","order":4}
  ]$json$::jsonb)
  loop
    insert into public.pillars(title,order_index)
    values (pillar_item->>'title',(pillar_item->>'order')::integer)
    returning id into pillar_uuid;
    insert into _pillar_map values (pillar_item->>'key',pillar_uuid);
  end loop;

  for chapter_item in select value from jsonb_array_elements($json$[
    {"key":"alimentation-primale","pillar":"nourrir","title":"Alimentation primale","source":"Alimentation","visual":"alimentation","order":0},
    {"key":"approvisionnement-cuisine","pillar":"nourrir","title":"Approvisionnement et Cuisine","source":"Courses","visual":"courses","order":1},
    {"key":"hydratation","pillar":"nourrir","title":"Hydratation","source":"Hydratation","visual":"hydratation","order":2},
    {"key":"mouvement","pillar":"corps","title":"Mouvement","source":"Sport","visual":"sport","order":3},
    {"key":"recuperation","pillar":"corps","title":"Récupération","source":"Sommeil","visual":"sommeil","order":4},
    {"key":"sante-hygiene","pillar":"corps","title":"Santé & Hygiène","source":"Santé","visual":"sante","order":5},
    {"key":"peau-apparence","pillar":"corps","title":"Peau & Apparence","visual":"hygiene","order":6},
    {"key":"expositions","pillar":"proteger","title":"Expositions","source":"Toxines","visual":"toxines","order":7},
    {"key":"securite-personnelle","pillar":"proteger","title":"Sécurité personnelle","description":"Savoir réduire les risques et réagir face aux situations dangereuses.","visual":"autonomie","order":8},
    {"key":"proteger-proches","pillar":"proteger","title":"Protéger ses proches","description":"Veiller sur les personnes dont on a la responsabilité.","visual":"relations","order":9},
    {"key":"foyer-biens","pillar":"proteger","title":"Foyer & biens","description":"Protéger son domicile et ce qui nous appartient.","visual":"autonomie","order":10},
    {"key":"resilience","pillar":"proteger","title":"Résilience","description":"Être capable de faire face lorsque les systèmes habituels ne fonctionnent plus.","visual":"autonomie","order":11},
    {"key":"organisation","pillar":"vivre","title":"Organisation","source":"Productivité","visual":"productivite","order":12},
    {"key":"ressources","pillar":"vivre","title":"Ressources","source":"Argent","visual":"argent","order":13},
    {"key":"relations","pillar":"vivre","title":"Relations","source":"Relations","visual":"relations","order":14},
    {"key":"societe","pillar":"vivre","title":"Société","source":"Société","visual":"societe","order":15},
    {"key":"autonomie","pillar":"se-construire","title":"Autonomie","source":"Autonomie","visual":"autonomie","order":16},
    {"key":"sens","pillar":"se-construire","title":"Sens","source":"Spiritualité","visual":"spiritualite","order":17},
    {"key":"longevite","pillar":"se-construire","title":"Longévité","source":"Longévité","visual":"longevite","order":18}
  ]$json$::jsonb)
  loop
    select id into pillar_uuid from _pillar_map where key=chapter_item->>'pillar';
    insert into public.chapters(pillar_id,category,title,description,order_index,is_visible,visual_key)
    values (
      pillar_uuid,
      chapter_item->>'title',
      chapter_item->>'title',
      coalesce(chapter_item->>'description',(
        select description from public.chapters
        where category=chapter_item->>'source' and is_visible=false
        order by order_index limit 1
      ),''),
      (chapter_item->>'order')::integer,
      true,
      chapter_item->>'visual'
    ) returning id into chapter_uuid;
    insert into _chapter_map values (chapter_item->>'key',chapter_uuid);
  end loop;

  create temporary table _module_moves (
    source_category text, source_order integer, target_key text,
    target_order integer, new_title text
  ) on commit drop;
  insert into _module_moves values
    ('Alimentation',0,'alimentation-primale',0,null),
    ('Alimentation',1,'alimentation-primale',1,null),
    ('Alimentation',2,'alimentation-primale',2,'Les Aliments à Éliminer'),
    ('Alimentation',3,'alimentation-primale',3,null),
    ('Alimentation',4,'approvisionnement-cuisine',0,'Approvisionnement et Préparation'),
    ('Courses',0,'approvisionnement-cuisine',1,null),
    ('Courses',1,'approvisionnement-cuisine',2,null),
    ('Recettes',0,'approvisionnement-cuisine',3,null),
    ('Recettes',1,'approvisionnement-cuisine',4,null),
    ('Hydratation',0,'hydratation',0,null),
    ('Hydratation',1,'hydratation',2,null),
    ('Sport',0,'mouvement',0,null),
    ('Sport',1,'mouvement',1,null),
    ('Sommeil',0,'recuperation',0,null),
    ('Sommeil',1,'recuperation',1,null),
    ('Énergie',0,'recuperation',2,null),
    ('Énergie',1,'recuperation',3,null),
    ('Santé',0,'sante-hygiene',0,null),
    ('Hygiène',0,'sante-hygiene',2,null),
    ('Hygiène',1,'sante-hygiene',3,null),
    ('Toxines',0,'expositions',0,null),
    ('Toxines',1,'expositions',1,null),
    ('Productivité',0,'organisation',0,null),
    ('Productivité',1,'organisation',1,null),
    ('Argent',0,'ressources',0,null),
    ('Argent',1,'ressources',1,null),
    ('Relations',0,'relations',0,null),
    ('Relations',1,'relations',1,null),
    ('Société',0,'societe',0,null),
    ('Société',1,'societe',1,null),
    ('Autonomie',0,'autonomie',0,null),
    ('Autonomie',1,'autonomie',1,null),
    ('Spiritualité',0,'sens',0,null),
    ('Spiritualité',1,'sens',1,null),
    ('Longévité',0,'longevite',0,null),
    ('Longévité',1,'longevite',1,null);

  update public.modules as module
  set chapter_id=target.id,
      order_index=10000+move.target_order,
      is_visible=true,
      title=coalesce(move.new_title,module.title)
  from public.chapters as source, _module_moves as move, _chapter_map as target
  where module.chapter_id=source.id
    and source.is_visible=false
    and source.category=move.source_category
    and module.order_index=move.source_order
    and target.key=move.target_key;

  update public.modules as module
  set order_index=module.order_index-10000
  from public.chapters as chapter
  where module.chapter_id=chapter.id and chapter.is_visible=true and module.order_index>=10000;

  for module_item in select value from jsonb_array_elements($json$[
    {"chapter":"hydratation","title":"Choisir son eau","order":1},
    {"chapter":"sante-hygiene","title":"Maladies chroniques","order":1},
    {"chapter":"peau-apparence","title":"Sentir bon","order":0},
    {"chapter":"peau-apparence","title":"Se maquiller","order":1},
    {"chapter":"peau-apparence","title":"Corriger ses problèmes de peau","order":2},
    {"chapter":"expositions","title":"alimentation","order":2},
    {"chapter":"expositions","title":"environnement","order":3},
    {"chapter":"expositions","title":"produits ménagers","order":4},
    {"chapter":"expositions","title":"pollution","order":5},
    {"chapter":"expositions","title":"cosmétiques","order":6},
    {"chapter":"expositions","title":"matériaux","order":7},
    {"chapter":"securite-personnelle","title":"Identifier une situation à risque","order":0},
    {"chapter":"securite-personnelle","title":"Éviter les situations dangereuses","order":1},
    {"chapter":"securite-personnelle","title":"Vigilance et conscience de l'environnement","order":2},
    {"chapter":"securite-personnelle","title":"Réagir face à une menace","order":3},
    {"chapter":"securite-personnelle","title":"Se déplacer en sécurité","order":4},
    {"chapter":"securite-personnelle","title":"Premiers réflexes en situation d'urgence","order":5},
    {"chapter":"proteger-proches","title":"Sécurité des enfants","order":0},
    {"chapter":"proteger-proches","title":"Protection des proches","order":1},
    {"chapter":"proteger-proches","title":"Situations d'urgence","order":2},
    {"chapter":"proteger-proches","title":"Organisation familiale","order":3},
    {"chapter":"proteger-proches","title":"Prévention des accidents","order":4},
    {"chapter":"proteger-proches","title":"Savoir alerter et demander de l'aide","order":5},
    {"chapter":"foyer-biens","title":"Sécurité du domicile","order":0},
    {"chapter":"foyer-biens","title":"Cambriolage","order":1},
    {"chapter":"foyer-biens","title":"Incendie","order":2},
    {"chapter":"foyer-biens","title":"Dégâts des eaux","order":3},
    {"chapter":"foyer-biens","title":"Sécurisation des accès","order":4},
    {"chapter":"foyer-biens","title":"Protection des objets de valeur","order":5},
    {"chapter":"foyer-biens","title":"Assurances","order":6},
    {"chapter":"foyer-biens","title":"Inventaire et sauvegardes","order":7},
    {"chapter":"resilience","title":"Préparer une situation d'urgence","order":0},
    {"chapter":"resilience","title":"Trousse et équipements essentiels","order":1},
    {"chapter":"resilience","title":"Eau et alimentation","order":2},
    {"chapter":"resilience","title":"Électricité et communications","order":3},
    {"chapter":"resilience","title":"Plans d'urgence","order":4},
    {"chapter":"resilience","title":"Autonomie temporaire","order":5},
    {"chapter":"resilience","title":"Continuité familiale","order":6}
  ]$json$::jsonb)
  loop
    select id into chapter_uuid from _chapter_map where key=module_item->>'chapter';
    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values (chapter_uuid,module_item->>'title','',10,(module_item->>'order')::integer,true)
    returning id into module_uuid;
    insert into public.subchapters(module_id,title,content,order_index)
    values (module_uuid,'Cours','',0);
  end loop;
end;
$$;

create or replace function public.get_user_progress_summary(p_user_id uuid)
returns table (chapter_id uuid, chapter_title text, completed_modules bigint, total_modules bigint, completion_percent numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_user_id is distinct from (select auth.uid()) and not public.is_admin() then raise exception 'Not authorized'; end if;
  return query
  select c.id,c.title,
    count(distinct up.module_id) filter (where up.status='completed' and up.subchapter_id is null),
    count(distinct m.id),
    case when count(distinct m.id)=0 then 0 else round(100.0*count(distinct up.module_id) filter (where up.status='completed' and up.subchapter_id is null)/count(distinct m.id),1) end
  from public.chapters c
  left join public.modules m on m.chapter_id=c.id and m.is_visible=true
  left join public.user_progress up on up.module_id=m.id and up.user_id=p_user_id
  where c.is_visible=true
  group by c.id,c.title,c.order_index order by c.order_index;
end;
$$;
