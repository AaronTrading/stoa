import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [page, client, migration] = await Promise.all([
  readFile(new URL('../dist/coaching-coach.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/coaching-coach.js', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/migrations/202610040038_coaching_access_by_username.sql', import.meta.url), 'utf8'),
]);

test('l’activation Coaching demande des pseudos et jamais un UUID', () => {
  assert.match(page, /name="client_username"/);
  assert.match(page, /name="coach_username"/);
  assert.doesNotMatch(page, /UUID du membre|UUID du coach/);
  assert.match(client, /admin_set_coaching_client_by_username/);
});

test('la résolution des pseudos reste protégée côté serveur', () => {
  assert.match(migration, /if not public\.is_admin\(\)/);
  assert.match(migration, /lower\(username\) = lower\(v_client_username\)/);
  assert.match(migration, /lower\(username\) = lower\(v_coach_username\)/);
});
