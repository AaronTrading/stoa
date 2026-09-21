create table if not exists public.shop_products (
  id text primary key,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  image_url text not null default '',
  producer text,
  source_url text,
  selections jsonb not null default '[]'::jsonb check (jsonb_typeof(selections) = 'array'),
  order_index integer not null check (order_index > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shop_products enable row level security;
grant select on public.shop_products to anon, authenticated;
grant insert, update, delete on public.shop_products to authenticated;

create policy "shop products are publicly readable"
  on public.shop_products for select to anon, authenticated using (true);
create policy "admins manage shop products"
  on public.shop_products for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

insert into public.shop_products (id, name, description, price, image_url, producer, source_url, selections, order_index) values
('huile-olive-charisma','Huile d’olive Charisma','Huile d’olive vierge extra biologique grecque, issue d’olives Koroneiki. Format 1 litre.',29.99,'/assets/shop/catalog/huile-charisma.webp','Vassilakis Estate','https://www.amazon.fr/Charisma-dOlive-Vierge-Biologique-Grecque/dp/B0CRZ73R7B?th=1','[]',1),
('mastiha-chios','Mastiha de Chios','Larmes naturelles de mastiha de Chios, sélection large. Un produit grec singulier au format 100 g.',29.99,'/assets/shop/catalog/mastiha.jpg','Mastiha Shop','https://mastihashop.com/en/collections/chios-mastiha/products/natural-chios-mastiha-large-tears','[]',2),
('sanglier','Sanglier','Une viande sauvage de caractère, proposée en coffret complet ou en pièces choisies.',74.99,'/assets/shop/catalog/sanglier.jpg','Nemrod','https://nemrod.co/collections/nos-viandes-fraiches/products/colis-de-viande-le-tout-sanglier','["Coffret complet — 2,3 kg","Civet — 1 kg","Côtelettes — 500 g","Rôti — 800 g"]',3),
('cerf','Cerf','Cerf sauvage français, à choisir en assortiment complet ou selon la pièce souhaitée.',94.99,'/assets/shop/catalog/cerf.jpg','Nemrod','https://nemrod.co/collections/nos-viandes-fraiches/products/colis-de-viande-le-tout-cerf','["Coffret complet — 3 kg","Jarret — 1,2 kg","Civet — 1 kg","Pavés — 800 g"]',4),
('chevreuil','Chevreuil','Chevreuil sauvage à la chair fine, disponible en coffret ou sous forme de pièces distinctes.',129.99,'/assets/shop/catalog/chevreuil.jpg','Nemrod','https://nemrod.co/collections/nos-viandes-fraiches/products/le-tout-chevreuil','["Coffret complet — 3,6 kg","Cuissot — 1,7 kg","Civet — 1 kg","Pavés — 900 g"]',5),
('biche','Biche','Biche préparée en Sologne, tendre et parfumée, pensée pour les cuissons lentes ou rôties.',29.99,'/assets/shop/catalog/biche.jpg','Atelier du Loup','https://atelierduloup.com/gibier/cerf-biche/civet-de-biche-25-kg/','["Civet — 2,5 kg","Civet — portion","Rôti","Pavés"]',6),
('faisan','Faisan','Faisan préparé en Sologne, à la chair délicate et parfumée, prêt à cuisiner.',29.99,'/assets/shop/catalog/faisan.jpg','Atelier du Loup','https://atelierduloup.com/gibier/faisan/supremes-de-faisans-x10/','["Lot de 10 suprêmes","Suprêmes — demi-lot","Faisan entier","Cuisses"]',7),
('buffle','Buffle','Un colis découverte de buffle biologique aux morceaux variés, de la grillade au mijoté.',69.99,'/assets/shop/catalog/buffle.jpg','La Ferme de Souegnes','https://www.pourdebon.com/colis-decouverte-de-buffle-bio-p43033','["Colis découverte complet","Côtes","Steaks","Sauté"]',8),
('cheval','Cheval','Un assortiment généreux de viande chevaline comprenant des pièces à rôtir et à saisir.',149.99,'/assets/shop/catalog/cheval.jpg','Boucherie Lefeuvre','https://www.pourdebon.com/colis-de-cheval-3-1-kg-p42036','["Colis complet — 3,1 kg","Rôti — 1 kg","Faux-filets","Steaks"]',9),
('chevreau','Chevreau','Quart arrière de chevreau réunissant gigot et filet, pour une cuisson entière ou séparée.',79.99,'/assets/shop/catalog/chevreau.jpg','Ferme du Caroire','https://www.pourdebon.com/gigot-filet-de-chevreau-quart-arriere-1-7-kg-p12773','["Quart arrière complet — 1,7 kg","Gigot","Filet"]',10),
('bison','Bison','Des faux-filets de bison tendres et goûteux, conditionnés pour une cuisson rapide.',34.99,'/assets/shop/catalog/bison.jpg','Bisons d’Auvergne','https://www.pourdebon.com/steaks-de-faux-filet-de-bison-fondants-et-goutus-p7757','["Lot de 2 faux-filets","Faux-filet à l’unité","Assortiment découverte"]',11),
('autruche','Autruche','Rôti frais dans le filet d’autruche, une viande rouge tendre et délicate.',49.99,'/assets/shop/catalog/autruche.jpg','L’Autruche de Laurette','https://www.pourdebon.com/roti-dans-le-filet-frais-p82573','["Rôti dans le filet","Filet en pavés","Assortiment découverte"]',12)
on conflict (id) do nothing;
