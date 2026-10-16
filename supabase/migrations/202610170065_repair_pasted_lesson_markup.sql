-- Répare les balises HTML collées comme texte brut dans la leçon « Avec quoi se laver ».
update public.subchapters as section
set content = replace(
  replace(
    replace(section.content, '&amp;nbsp;', '&nbsp;'),
    '&lt;', '<'
  ),
  '&gt;', '>'
)
from public.modules as lesson
where lesson.id = section.module_id
  and lower(trim(lesson.title)) = 'avec quoi se laver'
  and section.content ~* '&lt;/?(div|p|ul|ol|li|b|strong|i|em|br)([[:space:]]|&gt;)';
