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
