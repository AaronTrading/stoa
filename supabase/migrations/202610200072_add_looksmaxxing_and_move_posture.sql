do $$
declare
  v_corps uuid;
  v_movement uuid;
  v_appearance uuid;
  v_posture uuid;
  v_release uuid;
  v_release_content text;
  v_module uuid;
  v_order integer;
begin
  select id into v_corps from public.pillars where title='CORPS' limit 1;
  select id into v_movement from public.chapters where pillar_id=v_corps and title='Mouvement' and is_visible limit 1;
  select id into v_appearance from public.chapters where pillar_id=v_corps and title='Peau & Apparence' and is_visible limit 1;

  -- Rassembler posture, pieds, respiration et automassage dans Mouvement.
  select m.id into v_posture
  from public.modules m
  where m.title='Posture et position' and m.is_visible
  limit 1;

  select m.id into v_release
  from public.modules m
  where m.chapter_id=v_movement and m.title='Relâchement myofascial'
  limit 1;

  if v_posture is not null and v_movement is not null then
    if v_release is not null then
      select string_agg(content, E'\n' order by order_index)
      into v_release_content
      from public.subchapters
      where module_id=v_release;

      if coalesce(v_release_content,'')<>'' then
        update public.subchapters
        set content=content || E'\n' || v_release_content
        where module_id=v_posture
          and content not like '%Une balle d’automassage ne « casse » pas un nœud%';
      end if;

      delete from public.modules where id=v_release;
    end if;

    select coalesce(max(order_index),-1)+1 into v_order
    from public.modules where chapter_id=v_movement;

    update public.modules
    set chapter_id=v_movement,
        order_index=v_order,
        description='Aligner le corps, reconstruire les pieds, respirer par le nez et redonner du mouvement aux zones raides.'
    where id=v_posture;
  end if;

  -- Ajouter la leçon d'apparence masculine demandée.
  if v_appearance is not null and not exists(
    select 1 from public.modules where chapter_id=v_appearance and title='Looksmaxxing'
  ) then
    select coalesce(max(order_index),-1)+1 into v_order
    from public.modules where chapter_id=v_appearance;

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_appearance,'Looksmaxxing','Améliorer son apparence sans se blesser ni devenir l’élève d’un algorithme.',13,v_order,true)
    returning id into v_module;

    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Le looksmaxxing part d’une idée saine puis peut très vite devenir absurde : prendre soin de son visage, de ses cheveux, de sa barbe, de sa posture et de sa composition corporelle est utile. Se frapper les os du visage pour essayer de les remodeler ne l’est pas.</p>

<p><b>Le bonesmashing est débile.</b> Un coup répété ne sculpte pas proprement une pommette. Il crée un traumatisme, un hématome, une inflammation et parfois une fracture, une atteinte dentaire ou nerveuse. Le gonflement temporaire que certains prennent en photo n’est pas une nouvelle structure osseuse.</p>

<p><b>Fais plutôt travailler ce que le visage utilise réellement.</b></p>
<ul>
  <li>Mâche des aliments entiers qui demandent un effort : viande, fruits fermes, légumes croquants et pain au levain avec une vraie croûte.</li>
  <li>Utilise les deux côtés au cours du repas au lieu de mâcher systématiquement du même côté.</li>
  <li>Prends le temps de mâcher longtemps, mais augmente progressivement. Une mâchoire douloureuse, qui craque ou se bloque n’a pas besoin d’une heure supplémentaire.</li>
  <li>Le mastic de Chios est plus résistant qu’un chewing-gum ordinaire. Il fait travailler les masséters et peut augmenter la force de morsure. Il ne transforme pas magiquement la forme de la mandibule.</li>
</ul>

<p>Un essai contrôlé mené pendant six mois a observé une augmentation de la force de morsure avec l’entraînement au chewing-gum, sans modification mesurable de l’épaisseur du masséter ni de la forme de la mandibule. Le bénéfice raisonnable est donc un muscle qui travaille et une mastication plus forte, pas une reconstruction osseuse.</p>

<p><b>Dégonfler sans acheter un protocole miracle</b></p>
<p>Le sodium et le potassium participent à l’équilibre hydrique. Commence par réduire les aliments transformés et ultra-transformés très salés plutôt que bannir le sel de chaque repas maison. Pour augmenter simplement le potassium alimentaire, une eau de coco 100 %, sans sucre ajouté ni arôme, peut remplacer une boisson industrielle. Les pommes de terre, les fruits, la viande et les produits laitiers en apportent aussi.</p>

<p><b>Teste ton visage au lieu de suivre une règle</b></p>
<p>Un homme doit essayer plusieurs longueurs de barbe, moustache, rasage, coupe courte et cheveux longs. Prends les photos au même endroit, avec la même lumière et le même angle. Compare après plusieurs semaines, pas après cinq minutes devant un miroir.</p>

<p>Les cheveux longs et la barbe ont été diabolisés à tort chez les hommes. Pendant une grande partie de l’histoire, ils étaient parfaitement masculins. Ce qui change le résultat, c’est leur densité, leur forme, leur entretien et leur accord avec le visage. Une barbe peut renforcer une mâchoire ou cacher une bonne structure. Des cheveux longs peuvent encadrer le visage ou l’écraser. Il faut tester.</p>

<p><b>Garde tes distances avec la communauté looksmaxxing.</b> Elle est remplie de très jeunes utilisateurs, de classements obsessionnels et de créateurs qui transforment une insécurité en spectacle. Des figures comme Clavicular appartiennent à cet écosystème provocateur : une vidéo virale n’est ni un diagnostic ni une raison de te frapper, de prendre un produit ou de mépriser ton propre visage.</p>

<p>Travaille ce qui répond réellement : sommeil, peau, dents, posture, masse grasse lorsqu’elle est excessive, muscle, vêtements, coiffure et présence. Le but est d’avoir meilleure allure dans ta vie, pas de devenir prisonnier d’une note donnée par des inconnus.</p>

<p><u>Sources:</u></p>
<ul>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/39215439/" target="_blank" rel="noopener noreferrer">Entraînement de mastication, force de morsure, masséter et forme mandibulaire</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/39400843/" target="_blank" rel="noopener noreferrer">Mastication et capacité du muscle masséter</a></li>
  <li><a href="https://pubmed.ncbi.nlm.nih.gov/11347660/" target="_blank" rel="noopener noreferrer">Mastication prolongée, fatigue et douleur des muscles de la mâchoire</a></li>
</ul>
$lesson$,0);
  end if;
end;
$$;
