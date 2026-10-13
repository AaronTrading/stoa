-- Scientific references displayed in Academy lessons should point to the
-- underlying PubMed literature rather than institutional summaries.

do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('https://pmc.ncbi.nlm.nih.gov/articles/PMC5867436/','https://pubmed.ncbi.nlm.nih.gov/28698222/'),
      ('https://pmc.ncbi.nlm.nih.gov/articles/PMC4442216/','https://pubmed.ncbi.nlm.nih.gov/25979105/'),

      ('<li><a href="https://www.who.int/health-topics/air-pollution" target="_blank" rel="noopener noreferrer">OMS — pollution de l’air et santé</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/38867899/" target="_blank" rel="noopener noreferrer">Revue scientifique de l’exposome environnemental : air, eau, sols et agents physiques</a></li>'),
      ('<li><a href="https://www.who.int/news-room/questions-and-answers/item/radiation-electromagnetic-fields" target="_blank" rel="noopener noreferrer">OMS — champs électromagnétiques</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/38640611/" target="_blank" rel="noopener noreferrer">Revue systématique et méta-analyse des symptômes rapportés lors d’expositions aux radiofréquences</a></li>'),
      ('<li><a href="https://iris.who.int/bitstream/handle/10665/164348/9789289041683-eng.pdf" target="_blank" rel="noopener noreferrer">OMS — humidité, moisissures et air intérieur</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/17661925/" target="_blank" rel="noopener noreferrer">Méta-analyses sur humidité, moisissures domestiques et effets respiratoires</a></li>'),

      ('<li><a href="https://www.who.int/news-room/fact-sheets/detail/food-safety" target="_blank" rel="noopener noreferrer">OMS — sécurité sanitaire des aliments</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/25710165/" target="_blank" rel="noopener noreferrer">Revue systématique des interventions de prévention des maladies d’origine alimentaire</a></li>'),
      ('<li><a href="https://www.who.int/news-room/fact-sheets/detail/alcohol" target="_blank" rel="noopener noreferrer">OMS — alcool et santé</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/37905315/" target="_blank" rel="noopener noreferrer">Revue systématique et méta-analyse : niveaux de consommation d’alcool et risque de cancer</a></li>'),
      ('<li><a href="https://www.anses.fr/fr/content/les-recommandations-sur-lalimentation-lactivite-physique-et-la-sedentarite" target="_blank" rel="noopener noreferrer">Anses — repères alimentaires et activité</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/39285208/" target="_blank" rel="noopener noreferrer">Cartographie systématique de l’exposition humaine aux substances issues des matériaux au contact des aliments</a></li>'),

      ('<li><a href="https://www.who.int/health-topics/air-pollution" target="_blank" rel="noopener noreferrer">OMS — pollution de l’air</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/37210806/" target="_blank" rel="noopener noreferrer">Revue systématique et méta-analyse : pollution liée au trafic et mortalité</a></li>'),
      ('<li><a href="https://iris.who.int/bitstream/handle/10665/164348/9789289041683-eng.pdf" target="_blank" rel="noopener noreferrer">OMS — humidité et moisissures</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/21269928/" target="_blank" rel="noopener noreferrer">Revue épidémiologique des effets respiratoires de l’humidité et des moisissures</a></li>'),
      ('<li><a href="https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss" target="_blank" rel="noopener noreferrer">OMS — bruit et perte auditive</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/37030015/" target="_blank" rel="noopener noreferrer">Revue parapluie des méta-analyses sur bruit environnemental et santé</a></li>'),

      ('<li><a href="https://www.anses.fr/fr/system/files?file=AIR2018SA0145Ra.pdf" target="_blank" rel="noopener noreferrer">Anses — sprays et diffuseurs à base d’huiles essentielles</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/38366695/" target="_blank" rel="noopener noreferrer">Revue systématique : polluants intérieurs, produits de nettoyage et résultats respiratoires</a></li>'),
      ('<li><a href="https://vigilanses.anses.fr/sites/default/files/VigilAnsesN11_Juillet2020_2.pdf" target="_blank" rel="noopener noreferrer">Anses — composés volatils et produits domestiques</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/33234692/" target="_blank" rel="noopener noreferrer">Revue systématique et méta-analyse : produits de nettoyage et santé respiratoire</a></li>'),
      ('<li><a href="https://www.cdc.gov/chemical-emergencies/about/about-chlorine-gas.html" target="_blank" rel="noopener noreferrer">CDC — risques liés au chlore gazeux</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/17661925/" target="_blank" rel="noopener noreferrer">Méta-analyses des expositions domestiques humides et des effets respiratoires</a></li>'),

      ('<li><a href="https://www.who.int/publications/i/item/9789240034228" target="_blank" rel="noopener noreferrer">OMS — lignes directrices mondiales sur la qualité de l’air</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/36828043/" target="_blank" rel="noopener noreferrer">Revue systématique et méta-analyse : PM2,5, santé cardiovasculaire et mortalité</a></li>'),
      ('<li><a href="https://www.who.int/publications/i/item/B09440" target="_blank" rel="noopener noreferrer">OMS — pollution de l’air domestique</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/34374125/" target="_blank" rel="noopener noreferrer">Revue systématique et méta-analyse de la filtration de l’air intérieur en conditions réelles</a></li>'),

      ('<li><a href="https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-products-specific-topics/fragrance-allergens-labelling_en" target="_blank" rel="noopener noreferrer">Commission européenne — étiquetage des allergènes parfumants</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/38945918/" target="_blank" rel="noopener noreferrer">Revue systématique : sensibilisation de contact aux mélanges parfumants</a></li>'),
      ('<li><a href="https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-products-specific-topics/fragrance-allergens-labelling_en" target="_blank" rel="noopener noreferrer">Commission européenne — allergènes parfumants dans les cosmétiques</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/31433384/" target="_blank" rel="noopener noreferrer">Revue scientifique des allergies de contact et effets indésirables des parfums</a></li>'),
      ('<li><a href="https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-products-specific-topics/fragrance-allergens-labelling_en" target="_blank" rel="noopener noreferrer">Commission européenne — allergènes parfumants</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/38945918/" target="_blank" rel="noopener noreferrer">Revue systématique sur les allergènes parfumants et la sensibilisation de contact</a></li>'),

      ('<li><a href="https://www.anses.fr/fr/content/les-compos%C3%A9s-organiques-volatils-cov" target="_blank" rel="noopener noreferrer">Anses — composés organiques volatils</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/38366695/" target="_blank" rel="noopener noreferrer">Revue systématique des effets respiratoires des COV et autres polluants intérieurs</a></li>'),
      ('<li><a href="https://echa.europa.eu/hot-topics/bisphenols" target="_blank" rel="noopener noreferrer">Agence européenne des produits chimiques — bisphénols</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/36965141/" target="_blank" rel="noopener noreferrer">Revue actualisée de la migration des bisphénols depuis les matériaux au contact des aliments</a></li>'),
      ('<li><a href="https://echa.europa.eu/hot-topics/phthalates" target="_blank" rel="noopener noreferrer">Agence européenne des produits chimiques — phtalates</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/35585831/" target="_blank" rel="noopener noreferrer">Cartographie systématique des substances migrant depuis les matériaux au contact des aliments</a></li>'),

      ('<li><a href="https://www.who.int/news-room/questions-and-answers/item/radiation-electromagnetic-fields" target="_blank" rel="noopener noreferrer">OMS — questions et réponses sur les champs électromagnétiques</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/38640611/" target="_blank" rel="noopener noreferrer">Revue systématique et méta-analyse expérimentale des radiofréquences et symptômes rapportés</a></li>'),
      ('<li><a href="https://www.who.int/health-topics/electromagnetic-fields/" target="_blank" rel="noopener noreferrer">OMS — projet international sur les champs électromagnétiques</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/28766560/" target="_blank" rel="noopener noreferrer">Revue systématique des niveaux d’exposition aux radiofréquences dans les environnements quotidiens</a></li>'),
      ('<li><a href="https://www.iarc.who.int/wp-content/uploads/2018/07/pr208_E.pdf" target="_blank" rel="noopener noreferrer">CIRC — classification des radiofréquences en groupe 2B</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/40339346/" target="_blank" rel="noopener noreferrer">Revue systématique des radiofréquences et cancers dans les études animales</a></li>'),

      ('<li><a href="https://www.who.int/news-room/fact-sheets/detail/health-literacy" target="_blank" rel="noopener noreferrer">Organisation mondiale de la Santé — littératie en santé</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/32813388/" target="_blank" rel="noopener noreferrer">Revue systématique des interventions de littératie en santé et résultats associés</a></li>'),
      ('<li><a href="https://www.has-sante.fr/jcms/c_1671523/" target="_blank" rel="noopener noreferrer">Haute Autorité de Santé — décider avec le patient</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/38553843/" target="_blank" rel="noopener noreferrer">Revue systématique et méta-analyse des aides à la décision pour les maladies chroniques</a></li>'),
      ('<li><a href="https://www.has-sante.fr/jcms/c_2838959/" target="_blank" rel="noopener noreferrer">HAS — éléments pour une décision partagée</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/32605608/" target="_blank" rel="noopener noreferrer">Revue systématique des interventions améliorant littératie et comportements de santé</a></li>'),

      ('<li><a href="https://www.has-sante.fr/jcms/p_3306659/fr/indicateurs-de-qualite-des-parcours-de-soins" target="_blank" rel="noopener noreferrer">HAS — qualité et coordination des parcours de soins</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/35131029/" target="_blank" rel="noopener noreferrer">Revue systématique : activation du patient, littératie et autogestion des maladies chroniques</a></li>'),
      ('<li><a href="https://www.has-sante.fr/jcms/c_1671523/" target="_blank" rel="noopener noreferrer">HAS — décision médicale partagée</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/38553843/" target="_blank" rel="noopener noreferrer">Méta-analyse des aides informatisées à la décision partagée</a></li>'),
      ('<li><a href="https://eurohealthobservatory.who.int/publications/i/where-are-the-patients-in-decision-making-about-their-own-care" target="_blank" rel="noopener noreferrer">OMS Europe — participation du patient à ses soins</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/41176327/" target="_blank" rel="noopener noreferrer">Revue systématique : littératie et autogestion des maladies chroniques</a></li>'),

      ('<li><a href="https://iris.who.int/bitstream/handle/10665/164348/9789289041683-eng.pdf" target="_blank" rel="noopener noreferrer">OMS — humidité, moisissures et qualité de l’air intérieur</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/17661925/" target="_blank" rel="noopener noreferrer">Méta-analyses sur humidité, moisissures et effets respiratoires</a></li>'),
      ('<li><a href="https://www.anses.fr/fr/system/files?file=AIR2018SA0145Ra.pdf" target="_blank" rel="noopener noreferrer">Anses — sprays, diffuseurs et pollution de l’air intérieur</a></li>',
       '<li><a href="https://pubmed.ncbi.nlm.nih.gov/33234692/" target="_blank" rel="noopener noreferrer">Revue systématique et méta-analyse des produits de nettoyage et effets respiratoires</a></li>')
    ) as replacements(old_value,new_value)
  loop
    update public.subchapters
    set content=replace(content,item.old_value,item.new_value)
    where content like '%' || item.old_value || '%';
  end loop;
end;
$$;

