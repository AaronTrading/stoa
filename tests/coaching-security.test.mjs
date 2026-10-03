import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql=await readFile(new URL('../supabase/migrations/202610030034_private_coaching.sql',import.meta.url),'utf8');
const tables=[...sql.matchAll(/create table public\.(coaching_[a-z_]+)/g)].map(match=>match[1]);

test('chaque table coaching active RLS',()=>{
  assert.ok(tables.length>=15);
  assert.match(sql,/enable row level security/);
  for(const table of tables)assert.ok(sql.includes(`'${table}'`),`${table} manque dans la liste RLS`);
});

test('les accès reposent sur un entitlement distinct',()=>{
  assert.match(sql,/create table public\.coaching_clients/);
  assert.match(sql,/create or replace function public\.has_coaching_access/);
  assert.match(sql,/status in \('onboarding','active'\)/);
  assert.match(sql,/access_source text not null/);
});

test('les notes restent coach-only et les contenus cachés restent invisibles',()=>{
  assert.match(sql,/"coaches read private notes"/);
  assert.doesNotMatch(sql,/clients read private notes/);
  assert.match(sql,/visible_to_client/);
  assert.match(sql,/Only progress fields may be changed by the client/);
});
