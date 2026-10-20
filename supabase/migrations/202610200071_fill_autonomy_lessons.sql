-- Les deux modules existaient parfois sans sous-chapitre : garantir leur contenu.
delete from public.subchapters s
using public.modules m, public.chapters c, public.pillars p
where s.module_id=m.id and m.chapter_id=c.id and c.pillar_id=p.id
  and p.title='SE CONSTRUIRE' and c.title='Autonomie'
  and m.title in ('Décider avec méthode','Apprendre par soi-même');

insert into public.subchapters(module_id,title,content,order_index)
select m.id,'Cours',$lesson$
<p>Une bonne décision ne tombe pas du ciel. Elle commence par une question nette : qu’est-ce que je cherche, qu’est-ce que je refuse et quel prix suis-je prêt à payer ? Tant que ces trois réponses restent floues, chaque option paraît à la fois attirante et dangereuse.</p>
<p>Réduis le choix à ce qui change réellement le résultat. Écris les faits, puis sépare ce que tu sais de ce que tu imagines. Choisis une action réversible lorsque tu manques d’informations. Pour une décision irréversible, prends une nuit, demande l’avis de quelqu’un qui n’a rien à te vendre et imagine le pire scénario concret.</p>
<p>L’autonomie ne consiste pas à toujours choisir seul. Elle consiste à écouter sans remettre ton volant à la première personne sûre d’elle.</p>
$lesson$,0
from public.modules m
join public.chapters c on c.id=m.chapter_id
join public.pillars p on p.id=c.pillar_id
where p.title='SE CONSTRUIRE' and c.title='Autonomie' and m.title='Décider avec méthode';

insert into public.subchapters(module_id,title,content,order_index)
select m.id,'Cours',$lesson$
<p>Apprendre seul ne signifie pas consommer des heures de contenu. Choisis une compétence, trouve un modèle correct, reproduis-le puis confronte-toi au réel. Le savoir qui ne passe jamais par tes mains disparaît vite.</p>
<p>Travaille en boucle : lis peu, essaie, échoue proprement, note ce qui bloque et retourne chercher la réponse précise. Enseigne ensuite le geste ou l’idée à quelqu’un. Ce que tu n’arrives pas à expliquer reste souvent mal compris.</p>
<p>Conserve un carnet de preuves : travaux terminés, erreurs, photos, mesures, textes et décisions. La confiance ne vient plus d’une affirmation. Elle vient de ce que tu sais déjà refaire.</p>
$lesson$,0
from public.modules m
join public.chapters c on c.id=m.chapter_id
join public.pillars p on p.id=c.pillar_id
where p.title='SE CONSTRUIRE' and c.title='Autonomie' and m.title='Apprendre par soi-même';
