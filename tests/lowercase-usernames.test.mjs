import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [profilePage, profileClient, coachPage, coachClient, migration] = await Promise.all([
  readFile(new URL('../dist/profil.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/profile.js', import.meta.url), 'utf8'),
  readFile(new URL('../dist/coaching-coach.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/coaching-coach.js', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/migrations/202610040039_lowercase_usernames.sql', import.meta.url), 'utf8'),
]);

test('le préfixe @ reste hors des champs pseudo', () => {
  assert.match(profilePage, /class="username-entry"><span aria-hidden="true">@<\/span><input id="profile-username"/);
  assert.match(coachPage, /class="username-entry"><span aria-hidden="true">@<\/span><input name="client_username"/);
  assert.match(coachPage, /class="username-entry"><span aria-hidden="true">@<\/span><input name="coach_username"/);
});

test('le navigateur convertit tous les pseudos en minuscules', () => {
  assert.match(profileClient, /toLocaleLowerCase\('fr-FR'\)/);
  assert.match(profileClient, /enforceLowercaseUsername\(usernameInput\)/);
  assert.match(coachClient, /toLocaleLowerCase\('fr-FR'\)/);
  assert.match(coachClient, /p_client_username:normalizeUsername/);
});

test('la base impose les minuscules et normalise les pseudos existants', () => {
  assert.match(migration, /normalized := lower\(/);
  assert.match(migration, /set username = lower\(username\)/);
  assert.match(migration, /profiles_username_lowercase/);
  assert.match(migration, /username = lower\(username\)/);
});
