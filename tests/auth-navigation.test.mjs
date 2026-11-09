import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const auth = read('dist/auth.js');
const landing = read('dist/index.html');
const shell = read('dist/academy-shell.js');

test('un compte connecté peut revenir à Académie ou se déconnecter depuis la vitrine', () => {
  assert.match(landing, /data-footer-account/);
  assert.match(landing, /data-footer-academy-link/);
  assert.match(landing, /data-auth-signout/);
  assert.match(auth, /document\.querySelectorAll\('\[data-auth-signout\]'\)/);
  assert.match(auth, /currentAcademyAccess === true \? '\/accueil' : '\/'/);
});

test('connexion et droit Académie restent deux états différents', () => {
  assert.match(auth, /let currentAcademyAccess = null/);
  assert.match(auth, /accessResolved/);
  assert.match(auth, /#compte/);
  assert.match(shell, /context\.has_academy_access/);
  assert.match(shell, /access=required/);
  assert.match(shell, /access=error/);
});
