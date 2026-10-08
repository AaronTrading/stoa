import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const onboarding=read('dist/academy-onboarding.js');
const shell=read('dist/academy-shell.js');
const community=read('dist/communaute-v2.js');
const lesson=read('dist/app.js');
const success=read('dist/subscription-success.js');
const protection=read('dist/content-protection.js');
const migration=read('supabase/migrations/202610040046_profile_location_visibility.sql');
const usernameRules=read('supabase/migrations/202610080058_onboarding_username_rules.sql');
const auth=read('dist/auth.js');
const support=read('dist/support-widget.js');
const profilePage=read('dist/profil.html');
const landing=read('dist/index.html');
const styles=read('dist/styles.css');

test('the Academy onboarding is server-persistent and resumes across real routes',()=>{
  assert.match(shell,/import\('\.\/academy-onboarding\.js'\)/);
  assert.match(onboarding,/onboarding_state/);
  assert.match(onboarding,/onboarding_completed:true/);
  for(const selector of ['academy-sidebar','home-summary','academy-profile-compact','message-form','home-next-link','support-trigger','complete-module'])assert.match(onboarding,new RegExp(selector));
  assert.match(migration,/add column if not exists onboarding_state/);
  assert.match(migration,/subscriptions_prepare_academy_onboarding/);
});

test('first community message and first completed lesson are real actions',()=>{
  assert.match(community,/stoa:community-message-sent/);
  assert.match(lesson,/stoa:lesson-completed/);
  assert.match(onboarding,/addEventListener\('stoa:community-message-sent'/);
  assert.match(onboarding,/addEventListener\('stoa:lesson-completed'/);
});

test('onboarding requires real member actions and remains mobile-safe',()=>{
  assert.doesNotMatch(onboarding,/data-onboarding-later/);
  assert.doesNotMatch(onboarding,/data-tour-later/);
  assert.match(onboarding,/addEventListener\('stoa:support-opened'/);
  assert.match(support,/new CustomEvent\('stoa:support-opened'\)/);
  assert.match(styles,/onboarding-actions>button:only-child/);
  assert.match(styles,/safe-area-inset-bottom/);
});

test('signup defers location to onboarding and reserved placeholders cannot be confirmed',()=>{
  assert.doesNotMatch(auth,/auth-department/);
  assert.doesNotMatch(auth,/departmentCode\(data\.get\('department'\)\)/);
  assert.match(onboarding,/reservedUsername/);
  assert.match(onboarding,/initialUsername=reservedUsername\(profile\.username\)\?'':/);
  assert.match(usernameRules,/!~ '\^membre'/);
  assert.match(usernameRules,/profiles_reject_reserved_username/);
});

test('every member page stays hidden until the active entitlement is confirmed',()=>{
  assert.match(profilePage,/academy-access-pending/);
  assert.match(shell,/if\(accessError\|\|!academyAccess\)/);
  assert.doesNotMatch(shell,/path!=='\/profil'/);
  assert.match(styles,/html\.academy-access-pending body\{visibility:hidden\}/);
});

test('the public Coaching card has one booking CTA and the welcome oil section',()=>{
  assert.doesNotMatch(landing,/Le Coaching se rejoint depuis l’espace membre/);
  assert.doesNotMatch(landing,/data-member-coaching-link/);
  assert.match(landing,/Huile d’olive bio extra vierge offerte/);
  assert.match(landing,/class="section public-olive"/);
});

test('paid Academy and Coaching access launch their respective onboarding',()=>{
  assert.match(success,/coaching\?'\/coaching-onboarding':'\/accueil\?onboarding=1'/);
  assert.match(success,/has_active_academy_access/);
  assert.match(success,/has_coaching_access/);
});

test('paid lesson content has browser deterrents while server RLS stays authoritative',()=>{
  assert.match(shell,/import\('\.\/content-protection\.js'\)/);
  assert.match(protection,/contextmenu/);
  assert.match(protection,/PrintScreen/);
  assert.match(protection,/noindex,nofollow,noarchive/);
  assert.match(protection,/profile\?\.role==='admin'/);
});
