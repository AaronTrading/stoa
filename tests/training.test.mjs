import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const page=read('dist/entrainement.html');
const training=read('dist/entrainement.js');
const shell=read('dist/academy-shell.js');
const onboarding=read('dist/academy-onboarding.js');
const migration=read('supabase/migrations/202611120080_daily_training.sql');

test('S’entraîner apparaît sous la communauté et possède sa page membre',()=>{
  assert.match(shell,/\['\/posts','Communauté','community','community'\],\['\/entrainement','S’entraîner','train','training'\]/);
  assert.match(shell,/path==='\/entrainement'\?'training'/);
  assert.match(page,/class="member-page training-page"/);
  assert.match(page,/src="entrainement\.js"/);
});

test('la session se construit uniquement depuis les leçons consultées',()=>{
  assert.match(training,/from\('user_learning_state'\)/);
  assert.match(training,/states\.some\(state=>state\.module_id===question\.moduleId\)/);
  assert.match(migration,/La leçon doit avoir été consultée/);
  assert.match(migration,/user_learning_state/);
});

test('les six formes de questions et leur retour vers la leçon sont présentes',()=>{
  for(const type of ['choice','true_false','scenario','ordering','trap','open'])assert.match(training,new RegExp(`${type}:`));
  assert.match(training,/Revoir le passage dans la leçon/);
  assert.match(training,/sourceUrl=`\$\{source\.lesson\.url\}#lesson-/);
});

test('la répétition espacée distingue erreur hésitation et maîtrise',()=>{
  assert.match(migration,/p_result='incorrect'[\s\S]*interval '8 hours'/);
  assert.match(migration,/p_result='hesitant'[\s\S]*make_interval/);
  assert.match(migration,/v_previous\.interval_days\*2\.2/);
  assert.match(training,/result==='incorrect'.*queue\.push\(question\)/);
  assert.match(migration,/claim_training_rest_day/);
});

test('l’onboarding présente l’entraînement sans imposer de session',()=>{
  assert.match(onboarding,/tour_training/);
  assert.match(onboarding,/data-nav="training"/);
  assert.match(onboarding,/sans étape obligatoire/);
  assert.doesNotMatch(onboarding,/stoa:training-completed/);
});
