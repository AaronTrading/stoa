update public.subchapters
set content = replace(
  replace(
    regexp_replace(
      content,
      E'\\s*<p><u>Notions associées\\s*:</u>[^<]*</p>',
      '',
      'g'
    ),
    'Sources&nbsp;:',
    'Sources:'
  ),
  'Sources :',
  'Sources:'
)
where content like '%Notions associées%'
   or content like '%Sources :%'
   or content like '%Sources&nbsp;:%';
