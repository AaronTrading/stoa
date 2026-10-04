import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [client, migration] = await Promise.all([
  readFile(new URL('../dist/coaching-coach.js', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/migrations/202610040040_revoke_coaching_access.sql', import.meta.url), 'utf8'),
]);

test('un administrateur peut retirer le Coaching depuis le dossier client', () => {
  assert.match(client, /data-remove-coaching/);
  assert.match(client, /admin_revoke_coaching_access/);
  assert.match(client, /selected\.status='cancelled'/);
  assert.match(client, /Son historique sera conservé/);
});

test('le retrait est protégé et révoque réellement le droit', () => {
  assert.match(migration, /if not public\.is_admin\(\)/);
  assert.match(migration, /set status = 'cancelled'/);
  assert.match(migration, /grant execute on function public\.admin_revoke_coaching_access\(uuid\) to authenticated/);
});
