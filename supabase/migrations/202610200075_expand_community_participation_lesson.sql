update public.subchapters s
set content = s.content || $lesson$
<p><b>La communauté fait partie du parcours</b></p>
<p>Tu peux avancer seul sans rester isolé. La communauté STOA sert à poser une question, partager une difficulté, montrer une progression si tu en as envie et transmettre ce qui a fonctionné pour toi. Rien ne t’oblige à exposer ta vie.</p>
<p>Prends le temps de répondre aux nouveaux, de féliciter un effort réel et de proposer un échange de service lorsque tu sais faire quelque chose qu’un autre membre cherche à apprendre. Une recette, une adresse, un conseil d’organisation ou une heure donnée peuvent faire gagner des semaines à quelqu’un.</p>
<p>L’espace est pensé pour rester sain et bienveillant : on critique une idée sans humilier la personne, on ne transforme pas chaque différence en rivalité et on respecte ce que l’autre choisit de garder privé. Commence simplement par lire, réagir ou dire bonjour. La participation vient ensuite à ton rythme.</p>
$lesson$
from public.modules m
where s.module_id=m.id and lower(m.title) like 'tu es l%acteur de ta progression'
  and s.content not like '%La communauté fait partie du parcours%';
