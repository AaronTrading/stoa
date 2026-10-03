import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(path,import.meta.url),'utf8');
const [sql,page,client,edge,shell,logo]=await Promise.all([
  read('../supabase/migrations/202610040037_email_center.sql'),read('../dist/email-center.html'),
  read('../dist/email-center.js'),read('../api/email-center-send.mjs'),
  read('../dist/academy-shell.js'),readFile(new URL('../dist/assets/branding/stoa-mark-400.png',import.meta.url))
]);

test('les données Email Center sont strictement réservées aux administrateurs',()=>{
  assert.match(sql,/alter table public\.email_campaigns enable row level security/);
  assert.match(sql,/admins manage email campaigns/);
  assert.match(sql,/if not public\.is_admin\(\)/);
  assert.match(client,/profile\?\.role!=='admin'/);
  assert.match(shell,/data-email-center-link/);
});

test('l’éditeur couvre les blocs et parcours demandés',()=>{
  for(const block of ['image','title','text','button','divider','spacer','quote','footer'])assert.match(page,new RegExp(`data-add-block="${block}"`));
  assert.match(page,/Envoyer un test/);
  assert.match(page,/data-email-preview/);
  assert.match(client,/email_campaigns/);
  assert.match(client,/email-assets/);
});

test('l’envoi Gmail reste côté serveur et exige un administrateur',()=>{
  for(const secret of ['GMAIL_CLIENT_ID','GMAIL_CLIENT_SECRET','GMAIL_REFRESH_TOKEN'])assert.match(edge,new RegExp(`process\\.env\\.${secret}`));
  assert.doesNotMatch(client,/GMAIL_CLIENT_SECRET|GMAIL_REFRESH_TOKEN/);
  assert.match(edge,/profile\?\.role!=='admin'/);
  assert.match(edge,/gmail\.googleapis\.com\/gmail\/v1\/users\/me\/messages\/send/);
});

test('le nouveau symbole de navbar est bien un PNG carré 400 × 400',()=>{
  assert.equal(logo.toString('ascii',1,4),'PNG');
  assert.equal(logo.readUInt32BE(16),400);
  assert.equal(logo.readUInt32BE(20),400);
  assert.match(shell,/stoa-mark-400\.png/);
});
