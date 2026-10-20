create or replace function public.get_support_thread(p_conversation_id uuid)
returns table(id uuid,conversation_id uuid,sender_kind text,content text,created_at timestamptz,read_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
declare v_conversation public.support_conversations%rowtype;
begin
  select conversation.* into v_conversation
  from public.support_conversations conversation
  where conversation.id=p_conversation_id;
  if v_conversation.id is null or (v_conversation.member_id<>(select auth.uid()) and not public.is_admin()) then
    raise exception 'Conversation introuvable';
  end if;
  return query
  select message.id,message.conversation_id,
    case when message.sender_id=v_conversation.member_id then 'member' else 'support' end,
    message.content,message.created_at,message.read_at
  from public.support_messages message
  where message.conversation_id=p_conversation_id
  order by message.created_at;
end; $$;

revoke all on function public.get_support_thread(uuid) from public,anon;
grant execute on function public.get_support_thread(uuid) to authenticated;
