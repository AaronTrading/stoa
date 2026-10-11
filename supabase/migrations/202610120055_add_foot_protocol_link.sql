update public.subchapters
set content = replace(
  content,
  $$<li>Acheter des chaussettes gants fivefingers (15€)&nbsp;</li></ul><p></p>$$,
  $$<li>Acheter des chaussettes gants fivefingers (15€)&nbsp;</li></ul><p><a href="https://stoa-coaching.fr/assets/resources/protocole-pieds-optimaux-stoa.pdf" target="_blank" rel="noopener noreferrer">Ouvrir le protocole complet pour retrouver des pieds optimaux</a></p>$$
)
where id = '6cd9396b-8d58-4f1a-b708-f02f0ef5ef39'
  and content not like '%protocole-pieds-optimaux-stoa.pdf%';
