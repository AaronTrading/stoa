-- Nouveaux contenus, support anonyme et chemins communautaires plus rapides.

do $$
declare
  v_vivre uuid;
  v_chapter uuid;
  v_module uuid;
begin
  select id into v_vivre from public.pillars where title='VIVRE' limit 1;
  if v_vivre is null then raise exception 'Pilier VIVRE introuvable'; end if;

  if not exists(select 1 from public.chapters where pillar_id=v_vivre and title='Gestion des émotions' and is_visible) then
    update public.chapters set order_index=order_index+5000 where order_index>=16;
    update public.chapters set order_index=order_index-4999 where order_index>=5016;
    insert into public.chapters(pillar_id,category,title,description,order_index,is_visible,visual_key)
    values(v_vivre,'Santé','Gestion des émotions','Comprendre la tension, retrouver le dehors et remettre l’action devant l’attente.',16,true,'spiritualite')
    returning id into v_chapter;

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Gestion du stress','Faire du stress un signal à lire plutôt qu’un bruit permanent.',12,0,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Le stress est une poussée d’énergie prévue pour agir. Le problème commence lorsqu’il ne rencontre jamais sa sortie : aucune course, aucun combat, aucune décision, seulement une tension gardée dans le corps pendant des heures.</p>
<p><b>Commence par nommer la menace.</b> Une facture, un conflit, un retard ou une peur vague ne demandent pas la même réponse. Écris le problème en une phrase. S’il dépend de toi, choisis le prochain geste concret. S’il ne dépend pas de toi aujourd’hui, cesse de le rejouer comme si cette répétition pouvait le résoudre.</p>
<ul>
  <li>Marche dehors assez vite pour sentir ton souffle changer.</li>
  <li>Expire lentement et relâche volontairement la mâchoire, les épaules et les mains.</li>
  <li>Termine une petite tâche laissée ouverte : le cerveau supporte mal l’accumulation des boucles inachevées.</li>
  <li>Parle à une personne réelle avant de chercher cent réponses sur un écran.</li>
</ul>
<p>Un corps fatigué, affamé, immobile ou privé de lumière interprète plus facilement le monde comme une menace. Avant de refaire toute ta vie, remets du sommeil, un repas solide, du mouvement et un peu d’ordre autour de toi.</p>
$lesson$,0);

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Exposition à la nature','Sortir du décor artificiel et laisser le vivant reprendre de la place.',11,1,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Une forêt ne te demande pas de répondre, de produire une image ou de suivre une notification. Elle remet devant toi des distances réelles, des sons irréguliers, du vent, de l’ombre, du relief et un sol qui oblige le corps à s’adapter.</p>
<p>Va dehors sans transformer chaque sortie en performance. Marche en forêt, assieds-toi près d’un arbre, observe les traces, reconnais quelques espèces, touche la pierre et le bois. L’attention cesse alors de bondir entre des signaux fabriqués pour la capturer.</p>
<p><b>Fais simple :</b></p>
<ul>
  <li>une marche quotidienne, même courte, sans écouteurs ;</li>
  <li>une sortie plus longue chaque semaine dans un lieu réellement végétalisé ;</li>
  <li>un moment immobile pour regarder et écouter au lieu de traverser le paysage ;</li>
  <li>une activité concrète dehors : jardiner, ramasser du bois, observer les oiseaux, grimper ou suivre un sentier.</li>
</ul>
<p>La nature n’est pas un fond d’écran vert. Elle devient utile lorsque tu y entres avec ton corps et que tu lui rends une place régulière dans ta semaine.</p>
$lesson$,0);

    insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible)
    values(v_chapter,'Procrastination','Réduire la distance entre la décision et le premier geste.',12,2,true) returning id into v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>La procrastination protège souvent d’une émotion immédiate : peur d’échouer, peur de choisir, ennui, fatigue ou tâche devenue énorme dans la tête. Tu ne repousses pas toujours le travail. Tu repousses surtout l’inconfort de commencer.</p>
<p>Réduis la tâche jusqu’à obtenir un geste impossible à négocier : ouvrir le document, enfiler les chaussures, sortir les ingrédients, appeler la première personne. Ne promets pas deux heures. Promets cinq minutes propres.</p>
<ul>
  <li>Prépare le matériel avant l’heure prévue.</li>
  <li>Retire le téléphone de la pièce.</li>
  <li>Définis ce qui doit être visible lorsque la session est terminée.</li>
  <li>Arrête-toi à l’heure annoncée ou continue parce que l’élan est là, jamais par culpabilité.</li>
</ul>
<p>L’action produit souvent la motivation après coup. Attendre de ressentir l’envie revient à confier ton emploi du temps à ton humeur du moment.</p>
$lesson$,0);
  end if;
end;
$$;

-- Donner un vrai contenu à « Protéger son attention ».
do $$
declare v_module uuid;
begin
  select m.id into v_module from public.modules m join public.chapters c on c.id=m.chapter_id
  where c.title='Organisation' and m.title='Protéger son attention' and c.is_visible and m.is_visible limit 1;
  if v_module is not null then
    delete from public.subchapters where module_id=v_module;
    insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Ton attention est une ressource finie. Les applications le savent : elles placent devant toi des couleurs, des nombres rouges, des vibrations et des récompenses imprévisibles pour te faire revenir avant même que tu aies choisi.</p>
<p><b>Reprends le terrain.</b> Coupe les notifications qui ne viennent pas d’une personne importante. Retire les réseaux sociaux de l’écran d’accueil. Garde le téléphone hors de la chambre et hors de portée lorsque tu travailles ou parles avec quelqu’un.</p>
<ul>
  <li>Une seule tâche visible à la fois.</li>
  <li>Un lieu précis pour les objets qui interrompent.</li>
  <li>Des créneaux choisis pour consulter les messages.</li>
  <li>Du silence, ou un son sans parole, quand tu dois réfléchir.</li>
</ul>
<p>Protège aussi ce qui entre dans ta tête. Tout contenu consommé laisse une trace : envie, comparaison, peur, colère ou désir d’achat. Ne laisse pas un algorithme décider chaque jour de ce qui mérite ton émotion.</p>
<p>L’attention se réentraîne. Lis plusieurs pages sans changer d’onglet. Marche sans sortir le téléphone. Termine un repas sans écran. Écoute une personne jusqu’au bout. Ces gestes paraissent petits parce que la dispersion est devenue normale.</p>
$lesson$,0);
  end if;
end;
$$;

-- Transformer le parcours anti addiction en méthode complète.
do $$
declare v_chapter uuid; v_module uuid;
begin
  select id into v_chapter from public.chapters where lower(title)=lower('Parcours Anti addiction') and is_visible limit 1;
  if v_chapter is null then return; end if;
  update public.chapters set title='Parcours anti addiction',description='Comprendre la boucle, fermer les accès, traverser le manque et reconstruire durablement.' where id=v_chapter;
  delete from public.modules where chapter_id=v_chapter;

  insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible) values(v_chapter,'Comprendre la boucle','Identifier ce qui déclenche, entretient et récompense le comportement.',12,0,true) returning id into v_module;
  insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Une addiction est une boucle apprise : un signal crée une tension, un rituel promet un soulagement et la récompense renforce le chemin. À force, le cerveau réclame le geste avant même que tu aies formulé ce que tu ressens.</p>
<p>Pendant sept jours, note sans enjoliver : l’heure, le lieu, l’émotion, la personne présente, ce qui s’est passé juste avant et ce que tu espérais obtenir. Tu verras apparaître quelques portes répétées : ennui, fatigue, solitude, téléphone au lit, argent disponible, dispute ou stress.</p>
<p>Ne dis plus seulement « je manque de volonté ». Trouve le mécanisme exact. Ce que tu peux nommer devient beaucoup plus difficile à subir aveuglément.</p>
$lesson$,0);

  insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible) values(v_chapter,'Mesurer sans se mentir','Établir un point de départ assez précis pour voir les progrès.',10,1,true) returning id into v_module;
  insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Compte la fréquence, le temps, l’argent et les conséquences. Une semaine de données honnêtes vaut mieux qu’une promesse spectaculaire.</p>
<ul><li>Combien de fois ?</li><li>Combien de temps perdu ensuite ?</li><li>Quelle dépense réelle sur un mois ?</li><li>Qu’as-tu annulé, caché ou négligé à cause de cette habitude ?</li></ul>
<p>Choisis ensuite une règle nette : arrêt complet, seuil temporaire ou environnement entièrement fermé. Une règle floue devient une négociation quotidienne, et l’addiction sait très bien négocier.</p>
$lesson$,0);

  insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible) values(v_chapter,'Couper les accès','Construire les barrières avant que l’envie arrive.',11,2,true) returning id into v_module;
  insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Ne garde pas la tentation à dix centimètres pour prouver ta force. Jette le stock, bloque les applications et les sites, retire les moyens de paiement, change le trajet et quitte les groupes qui alimentent la boucle.</p>
<p>Dis ta règle à une personne fiable. Donne-lui un rôle précis : garder un objet, recevoir un message à l’heure difficile, vérifier une dépense ou marcher avec toi. Demander une barrière n’est pas abandonner sa liberté ; c’est utiliser son intelligence avant le moment où elle sera affaiblie.</p>
<p>Prépare un remplacement matériel : téléphone hors de la chambre, promenade à l’heure du pari, repas prêt avant la faim, activité manuelle lorsque l’écran appelle. Une barrière sans remplacement laisse un vide.</p>
$lesson$,0);

  insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible) values(v_chapter,'Traverser le manque','Passer la vague sans lui obéir.',11,3,true) returning id into v_module;
  insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>L’envie monte, ment sur sa durée, puis redescend. Mets dix minutes entre l’impulsion et le geste. Marche, bois, respire lentement, appelle quelqu’un et observe où la tension s’installe dans ton corps.</p>
<p>Prépare une fiche d’urgence courte : trois personnes à contacter, trois lieux où aller et trois actions physiques capables de t’occuper vingt minutes. Quand le manque arrive, tu exécutes la fiche au lieu d’inventer une solution sous pression.</p>
<p><b>Attention :</b> un sevrage brutal d’alcool ou de benzodiazépines après une consommation régulière peut être dangereux. Dans ce cas, organise le retrait avec un professionnel et un entourage prévenu.</p>
$lesson$,0);

  insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible) values(v_chapter,'Prévenir la rechute','Reconnaître les portes qui se rouvrent avant la chute.',10,4,true) returning id into v_module;
  insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>La rechute commence souvent avant le geste : sommeil dégradé, isolement, retour d’un accès, phrase du type « une fois ne compte pas », abandon des routines et honte gardée en secret.</p>
<p>Garde une règle de reprise immédiate. Une faute ne devient pas une semaine entière. Note le déclencheur, ferme la porte découverte, préviens la personne choisie et reprends au prochain geste. Aucun grand discours, aucune punition.</p>
<p>Observe aussi les victoires : argent conservé, matinées récupérées, relations plus calmes, sommeil, capacité à rester présent. Le cerveau doit voir ce que la nouvelle vie rapporte réellement.</p>
$lesson$,0);

  insert into public.modules(chapter_id,title,description,duration_minutes,order_index,is_visible) values(v_chapter,'Reconstruire','Remplir l’espace libéré avec une vie plus solide.',12,5,true) returning id into v_module;
  insert into public.subchapters(module_id,title,content,order_index) values(v_module,'Cours',$lesson$
<p>Retirer l’addiction libère du temps, de l’argent et de l’énergie. Si cet espace reste vide, l’ancienne boucle finit par sembler plus vivante que le reste.</p>
<p>Remets du mouvement, des repas, du sommeil, des rendez-vous, un travail manuel et un projet dans la semaine. Cherche des récompenses lentes qui laissent quelque chose après elles : force gagnée, objet construit, compétence apprise, lieu découvert, service rendu.</p>
<p>Répare ce qui peut l’être sans exiger un pardon immédiat. Redeviens fiable par les actes répétés. La sortie ne consiste pas seulement à ne plus consommer ; elle consiste à construire une vie que tu n’as plus besoin de fuir.</p>
$lesson$,0);
end;
$$;

-- Présenter réellement la communauté dans la première leçon concernée.
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

-- Une conversation de support distincte par mode, avec une identité masquée au staff.
create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(member_id,is_anonymous)
);

alter table public.support_messages add column if not exists conversation_id uuid references public.support_conversations(id) on delete cascade;
insert into public.support_conversations(member_id,is_anonymous)
select distinct member_id,false from public.support_messages on conflict(member_id,is_anonymous) do nothing;
update public.support_messages m set conversation_id=c.id from public.support_conversations c
where m.conversation_id is null and c.member_id=m.member_id and c.is_anonymous=false;
alter table public.support_messages alter column conversation_id set not null;
create index if not exists support_messages_thread_created_idx on public.support_messages(conversation_id,created_at);
create index if not exists support_conversations_updated_idx on public.support_conversations(updated_at desc);

alter table public.support_conversations enable row level security;
grant select on public.support_conversations to authenticated;
drop policy if exists "members read own support conversations" on public.support_conversations;
create policy "members read own support conversations" on public.support_conversations for select to authenticated using(member_id=(select auth.uid()));

drop policy if exists "academy members and admins read support conversations" on public.support_messages;
drop policy if exists "academy members and admins send support messages" on public.support_messages;
drop policy if exists "academy members and admins mark support messages read" on public.support_messages;
create policy "members read own support messages" on public.support_messages for select to authenticated
  using(member_id=(select auth.uid()) and (select public.has_active_academy_access()));

create or replace function public.get_my_support_conversations()
returns table(conversation_id uuid,is_anonymous boolean,created_at timestamptz,updated_at timestamptz,last_message text,last_message_at timestamptz,unread_count bigint)
language sql stable security definer set search_path='' as $$
  select c.id,c.is_anonymous,c.created_at,c.updated_at,last.content,last.created_at,
    (select count(*) from public.support_messages unread where unread.conversation_id=c.id and unread.sender_id<>c.member_id and unread.read_at is null)
  from public.support_conversations c
  left join lateral(select m.content,m.created_at from public.support_messages m where m.conversation_id=c.id order by m.created_at desc limit 1) last on true
  where c.member_id=(select auth.uid()) order by c.updated_at desc;
$$;

create or replace function public.get_support_inbox()
returns table(conversation_id uuid,is_anonymous boolean,member_id uuid,display_name text,username text,avatar_url text,last_message text,last_message_at timestamptz,unread_count bigint)
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'Accès réservé au staff'; end if;
  return query
  select c.id,c.is_anonymous,case when c.is_anonymous then null else c.member_id end,
    case when c.is_anonymous then 'Conversation anonyme' else coalesce(nullif(btrim(concat_ws(' ',p.first_name,p.last_name)),''),nullif(p.full_name,''),'Membre STOA') end,
    case when c.is_anonymous then null else p.username end,case when c.is_anonymous then null else p.avatar_url end,
    last.content,last.created_at,
    (select count(*) from public.support_messages unread where unread.conversation_id=c.id and unread.sender_id=c.member_id and unread.read_at is null)
  from public.support_conversations c join public.profiles p on p.id=c.member_id
  left join lateral(select m.content,m.created_at from public.support_messages m where m.conversation_id=c.id order by m.created_at desc limit 1) last on true
  where last.created_at is not null order by last.created_at desc;
end; $$;

create or replace function public.get_support_thread(p_conversation_id uuid)
returns table(id uuid,conversation_id uuid,sender_kind text,content text,created_at timestamptz,read_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
declare v_conversation public.support_conversations%rowtype;
begin
  select conversation.* into v_conversation from public.support_conversations conversation where conversation.id=p_conversation_id;
  if v_conversation.id is null or (v_conversation.member_id<>(select auth.uid()) and not public.is_admin()) then raise exception 'Conversation introuvable'; end if;
  return query select m.id,m.conversation_id,case when m.sender_id=v_conversation.member_id then 'member' else 'support' end,m.content,m.created_at,m.read_at
  from public.support_messages m where m.conversation_id=p_conversation_id order by m.created_at;
end; $$;

create or replace function public.send_support_message(p_conversation_id uuid,p_content text,p_anonymous boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_conversation public.support_conversations%rowtype; v_user uuid=(select auth.uid());
begin
  if v_user is null or not public.has_active_academy_access() then raise exception 'Accès Académie requis'; end if;
  if nullif(btrim(p_content),'') is null or char_length(btrim(p_content))>2000 then raise exception 'Message invalide'; end if;
  if public.is_admin() then
    select * into v_conversation from public.support_conversations where id=p_conversation_id;
    if v_conversation.id is null then raise exception 'Conversation introuvable'; end if;
  else
    if p_conversation_id is not null then select * into v_conversation from public.support_conversations where id=p_conversation_id and member_id=v_user;
    else insert into public.support_conversations(member_id,is_anonymous) values(v_user,coalesce(p_anonymous,false))
      on conflict(member_id,is_anonymous) do update set updated_at=public.support_conversations.updated_at returning * into v_conversation;
    end if;
    if v_conversation.id is null then raise exception 'Conversation introuvable'; end if;
  end if;
  insert into public.support_messages(member_id,sender_id,content,conversation_id) values(v_conversation.member_id,v_user,btrim(p_content),v_conversation.id);
  update public.support_conversations set updated_at=now() where id=v_conversation.id;
  return v_conversation.id;
end; $$;

create or replace function public.mark_support_thread_read(p_conversation_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_member uuid;
begin
  select member_id into v_member from public.support_conversations where id=p_conversation_id;
  if v_member is null or (v_member<>(select auth.uid()) and not public.is_admin()) then raise exception 'Conversation introuvable'; end if;
  update public.support_messages set read_at=now() where conversation_id=p_conversation_id and read_at is null
    and ((public.is_admin() and sender_id=v_member) or (not public.is_admin() and sender_id<>v_member));
end; $$;

revoke all on function public.get_my_support_conversations() from public,anon;
revoke all on function public.get_support_inbox() from public,anon;
revoke all on function public.get_support_thread(uuid) from public,anon;
revoke all on function public.send_support_message(uuid,text,boolean) from public,anon;
revoke all on function public.mark_support_thread_read(uuid) from public,anon;
grant execute on function public.get_my_support_conversations(),public.get_support_inbox(),public.get_support_thread(uuid),public.send_support_message(uuid,text,boolean),public.mark_support_thread_read(uuid) to authenticated;

-- Indexes et fonctions ciblées pour supprimer les parcours qui balayaient toute la base.
create index if not exists profiles_username_lower_idx on public.profiles(lower(username)) where username is not null;
create index if not exists user_progress_profile_completed_idx on public.user_progress(user_id,module_id) where status='completed';
create index if not exists community_posts_recent_idx on public.community_posts(created_at desc);

create or replace function public.get_member_profile_card(target_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.has_active_academy_access() then raise exception 'Accès Académie requis'; end if;
  select jsonb_build_object(
    'viewer_is_admin',public.is_admin(),
    'id',p.id,'display_name',case when p.hide_last_name_in_community then coalesce(nullif(btrim(p.first_name),''),'Membre') else coalesce(nullif(btrim(concat_ws(' ',p.first_name,p.last_name)),''),nullif(btrim(p.full_name),''),'Membre') end,
    'username',p.username,'avatar_url',p.avatar_url,'department',p.department,'location_label',p.location_label,'bio',p.bio,'role',p.role,'created_at',p.created_at,
    'completed_modules',(select count(distinct up.module_id) from public.user_progress up where up.user_id=p.id and up.status='completed'),
    'email',case when public.is_admin() then u.email else null end,'phone',case when public.is_admin() then nullif(u.phone::text,'') else null end,
    'discord_username',case when public.is_admin() then nullif(coalesce(discord.identity_data->>'global_name',discord.identity_data->>'username',discord.identity_data->>'user_name'),'') else null end,
    'discord_id',case when public.is_admin() then nullif(coalesce(discord.identity_data->>'sub',discord.provider_id),'') else null end,
    'restricted_until',case when public.is_admin() then r.restricted_until else null end,'is_restricted',case when public.is_admin() then (r.user_id is not null) else false end
  ) into result from public.profiles p left join auth.users u on u.id=p.id
  left join lateral(select i.identity_data,i.provider_id from auth.identities i where i.user_id=p.id and i.provider='discord' order by i.created_at desc limit 1) discord on true
  left join public.chat_restrictions r on r.user_id=p.id where p.id=target_user_id;
  return result;
end; $$;
revoke all on function public.get_member_profile_card(uuid) from public,anon;
grant execute on function public.get_member_profile_card(uuid) to authenticated;

create or replace function public.delete_community_comment(p_comment_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_author uuid;
begin
  select user_id into v_author from public.community_post_comments where id=p_comment_id;
  if v_author is null then raise exception 'Réponse introuvable'; end if;
  if v_author<>(select auth.uid()) and not public.is_admin() then raise exception 'Vous ne pouvez pas supprimer cette réponse'; end if;
  delete from public.community_post_comments where id=p_comment_id;
end; $$;
revoke all on function public.delete_community_comment(uuid) from public,anon;
grant execute on function public.delete_community_comment(uuid) to authenticated;

create or replace function public.create_community_notifications()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_reply_user uuid; v_mentions text[];
begin
  if new.deleted_at is not null then return new; end if;
  if new.reply_to_message_id is not null then
    select user_id into v_reply_user from public.messages where id=new.reply_to_message_id;
    if v_reply_user is not null and v_reply_user<>new.user_id then
      insert into public.community_notifications(user_id,actor_id,message_id,channel_id,kind,content,created_at)
      values(v_reply_user,new.user_id,new.id,new.channel_id,'reply',new.content,new.created_at)
      on conflict(user_id,message_id) do update set kind=case when public.community_notifications.kind='mention' then 'reply_mention' else public.community_notifications.kind end;
    end if;
  end if;
  select coalesce(array_agg(distinct lower(match[1])),'{}') into v_mentions
  from regexp_matches(new.content,'@([[:alnum:]_.;-]{3,30})','g') match;
  if cardinality(v_mentions)>0 then
    insert into public.community_notifications(user_id,actor_id,message_id,channel_id,kind,content,created_at)
    select p.id,new.user_id,new.id,new.channel_id,'mention',new.content,new.created_at from public.profiles p
    where lower(p.username)=any(v_mentions) and p.id<>new.user_id
    on conflict(user_id,message_id) do update set kind=case when public.community_notifications.kind='reply' then 'reply_mention' else public.community_notifications.kind end;
  end if;
  return new;
end; $$;

create or replace function public.create_community_post_notifications()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_author uuid; v_mentions text[];
begin
  select author_id into v_author from public.community_posts where id=new.post_id;
  if v_author is not null and v_author<>new.user_id then
    insert into public.community_post_notifications(user_id,actor_id,post_id,comment_id,kind,content,created_at)
    values(v_author,new.user_id,new.post_id,new.id,'post_reply',new.content,new.created_at) on conflict(user_id,comment_id) do nothing;
  end if;
  select coalesce(array_agg(distinct lower(match[1])),'{}') into v_mentions
  from regexp_matches(new.content,'@([[:alnum:]_.;-]{3,30})','g') match;
  if cardinality(v_mentions)>0 then
    insert into public.community_post_notifications(user_id,actor_id,post_id,comment_id,kind,content,created_at)
    select p.id,new.user_id,new.post_id,new.id,'post_mention',new.content,new.created_at from public.profiles p
    where lower(p.username)=any(v_mentions) and p.id<>new.user_id
    on conflict(user_id,comment_id) do update set kind=case when public.community_post_notifications.kind='post_reply' then 'post_reply_mention' else public.community_post_notifications.kind end;
  end if;
  return new;
end; $$;
