import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../dist/profile.js', import.meta.url), 'utf8');

test('le pseudo est enregistré sans réécrire l’identité', () => {
  const identitySave = source.match(/const saveProfile = async \(\) => \{[\s\S]*?const queueAutoSave/)[0];
  const usernameSave = source.match(/const saveUsername = async \(\) => \{[\s\S]*?const queueUsernameSave/)[0];

  assert.doesNotMatch(identitySave, /update\(\{[^}]*username/);
  assert.match(usernameSave, /from\('profiles'\)\.update\(\{ username \}\)/);
  assert.match(usernameSave, /updateUser\(\{ data: \{ username \} \}\)/);
  assert.doesNotMatch(usernameSave, /first_name|last_name|full_name/);
});

test('le champ pseudo possède sa propre autosauvegarde', () => {
  assert.match(source, /usernameInput\.addEventListener\('input',[\s\S]*?queueUsernameSave\(\)/);
  assert.match(source, /enforceLowercaseUsername\(usernameInput\)/);
  assert.match(source, /\[firstNameInput, lastNameInput, departmentInput, bioInput\]/);
});
