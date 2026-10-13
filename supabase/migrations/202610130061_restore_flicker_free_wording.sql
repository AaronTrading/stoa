-- Keep the evening-light guidance in the requested STOA wording.

update public.subchapters s
set content = replace(
  s.content,
  '<p>Dès 18 h, commencez à limiter les lumières. Choisissez des ampoules <i>flicker-free</i>. Beaucoup de LED pilotées par une électronique médiocre pulsent des dizaines, des centaines ou parfois des milliers de fois par seconde. Vos yeux ne voient pas forcément ces scintillements, mais ils peuvent fatiguer et gêner les personnes sensibles.</p>',
  '<p>Dès 18 h, commencez à limiter les lumières. Vos ampoules doivent être <i>flicker-free</i>, sinon vos lumières LED émettent des milliers de scintillements invisibles pour vos yeux mais qui fatiguent réellement.</p>'
)
from public.modules m, public.chapters c
where s.module_id = m.id
  and m.chapter_id = c.id
  and c.is_visible
  and c.title = 'Sommeil'
  and m.title = 'Construire son rituel du soir';
