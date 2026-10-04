import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const [sql, profilePage, profileClient, shell, emailCenter] = await Promise.all([
  read('../supabase/migrations/202610040048_profile_names_and_community_privacy.sql'),
  read('../dist/profil.html'),
  read('../dist/profile.js'),
  read('../dist/academy-shell.js'),
  read('../dist/email-center.js'),
]);

test('la communauté affiche le prénom et le nom selon le choix de confidentialité', () => {
  assert.match(sql, /hide_last_name_in_community boolean not null default false/);
  assert.match(sql, /when profile\.hide_last_name_in_community then coalesce\(nullif\(btrim\(profile\.first_name\)/);
  assert.match(sql, /concat_ws\(' ',profile\.first_name,profile\.last_name\)/);
  assert.match(profilePage, /id="profile-hide-last-name"/);
  assert.match(profileClient, /hide_last_name_in_community: hideLastNameInput\.checked/);
});

test('les emails et la carte de profil utilisent l’identité civile', () => {
  const recipientResolver = sql.match(/create or replace function public\.resolve_email_campaign_recipients[\s\S]*?\$\$;/)[0];
  assert.doesNotMatch(recipientResolver, /p\.username/);
  assert.match(recipientResolver, /p\.first_name/);
  assert.match(shell, /\[profile\?\.first_name,profile\?\.last_name\]/);
  assert.doesNotMatch(shell, /const name=profile\?\.username/);
  assert.match(emailCenter, /row\.first_name\|\|'Membre'/);
});
