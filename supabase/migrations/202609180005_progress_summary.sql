create or replace function public.get_user_progress_summary(p_user_id uuid)
returns table (
  chapter_id uuid,
  chapter_title text,
  completed_modules bigint,
  total_modules bigint,
  completion_percent numeric
)
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if p_user_id is distinct from (select auth.uid()) and not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    c.id,
    c.title,
    count(distinct up.module_id) filter (
      where up.status = 'completed' and up.subchapter_id is null
    ) as completed_modules,
    count(distinct m.id) as total_modules,
    case when count(distinct m.id) = 0 then 0
      else round(
        100.0 * count(distinct up.module_id) filter (
          where up.status = 'completed' and up.subchapter_id is null
        ) / count(distinct m.id),
        1
      )
    end as completion_percent
  from public.chapters c
  left join public.modules m on m.chapter_id = c.id
  left join public.user_progress up
    on up.module_id = m.id and up.user_id = p_user_id
  group by c.id, c.title, c.order_index
  order by c.order_index;
end;
$$;

revoke all on function public.get_user_progress_summary(uuid) from public;
grant execute on function public.get_user_progress_summary(uuid) to authenticated;

