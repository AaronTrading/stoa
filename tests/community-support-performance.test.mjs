import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [migration,fix,community,posts,support,profile,app,home,styles]=await Promise.all([
  read('supabase/migrations/202610200073_emotions_attention_support_privacy_performance.sql'),
  read('supabase/migrations/202610200074_fix_support_thread_lookup.sql'),
  read('dist/communaute-v2.js'),read('dist/posts.js'),read('dist/support-widget.js'),
  read('dist/member-profile-card.js'),read('dist/app.js'),read('dist/accueil.js'),read('dist/styles.css')
]);

test('le nouveau parcours émotionnel et le parcours anti addiction complet sont migrés',()=>{
  assert.match(migration,/Gestion des émotions/);
  for(const title of ['Gestion du stress','Exposition à la nature','Procrastination','Mesurer sans se mentir','Prévenir la rechute','Protéger son attention'])assert.match(migration,new RegExp(title));
  assert.match(migration,/title='Parcours anti addiction'/);
  assert.match(migration,/La communauté fait partie du parcours/);
});

test('les durées ne sont plus affichées sous les leçons',()=>{
  assert.doesNotMatch(app,/module\.duration} min/);
  assert.doesNotMatch(home,/duration_minutes \|\| 10} min/);
});

test('le support anonyme masque l’identité et sépare les conversations',()=>{
  assert.match(migration,/unique\(member_id,is_anonymous\)/);
  assert.match(migration,/case when c\.is_anonymous then null else c\.member_id end/);
  assert.match(migration,/create policy "members read own support messages"/);
  assert.match(fix,/get_support_thread/);
  assert.match(support,/Poser cette question anonymement/);
  assert.match(support,/get_support_inbox/);
  assert.match(support,/send_support_message/);
  assert.match(support,/stoa-mark-400\.png/);
  assert.match(support,/supabase\.rpc\('is_admin'\)/);
  assert.match(support,/class="support-conversation support-conversation-open"/);
  assert.doesNotMatch(support,/<div class="support-conversation"><button/);
  assert.match(styles,/\.support-avatar img\{[\s\S]*?width:100%;[\s\S]*?height:100%;[\s\S]*?object-fit:cover/);
});

test('la discussion reste visible avec le clavier mobile et conserve le switch principal',()=>{
  assert.match(community,/--community-viewport-height/);
  assert.match(community,/visualViewport\?\.addEventListener\('resize'/);
  assert.match(styles,/height:calc\(var\(--community-viewport-height,100dvh\) - 64px\)/);
  assert.match(styles,/\.community-page \.community-mode-nav a\.active/);
  assert.match(styles,/scroll-padding-bottom:72px/);
});

test('la boîte support staff utilise un véritable viewport mobile',()=>{
  assert.match(support,/support-thread-active/);
  assert.match(support,/document\.documentElement\.classList\.add\('support-modal-open'\)/);
  assert.match(support,/placeholder="\$\{isAdmin\?'Répondre…'/);
  assert.match(styles,/Support staff — mobile-first conversation layout/);
  assert.match(styles,/\.support-panel\.support-viewport-fit\{[\s\S]*?display:flex;[\s\S]*?max-height:none!important/);
  assert.match(styles,/\.support-compose-row\{[\s\S]*?grid-template-columns:minmax\(0,1fr\) 44px/);
  assert.match(styles,/margin:6px 10px max\(10px,env\(safe-area-inset-bottom\)\)/);
});

test('les parcours communautaires évitent les rechargements bloquants',()=>{
  assert.match(community,/applyMessageChange/);
  assert.doesNotMatch(community,/resetComposer\(\); await loadMessages/);
  assert.match(community,/Promise\.allSettled\(\[subscribeAnnouncements\(\),subscribePolls\(\),loadOwnRestriction\(\)\]\)/);
  assert.match(posts,/\.limit\(100\)/);
  assert.match(posts,/setTimeout\(loadPosts,180\)/);
  assert.match(profile,/get_member_profile_card/);
  assert.match(migration,/profiles_username_lower_idx/);
});

test('les réponses peuvent être supprimées et la présence est verte en ligne',()=>{
  assert.match(posts,/delete_community_comment/);
  assert.match(migration,/v_author<>\(select auth\.uid\(\)\) and not public\.is_admin\(\)/);
  assert.match(community,/classList\.toggle\('is-online'/);
  assert.match(styles,/presence-note\.is-online \.presence-dot/);
  assert.match(styles,/data-post-reaction="❤"/);
});
