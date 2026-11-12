import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const [profilePage, profileClient, styles, manifestText, worker] = await Promise.all([
  read('../dist/profil.html'),
  read('../dist/profile.js'),
  read('../dist/styles.css'),
  read('../dist/manifest.webmanifest'),
  read('../dist/sw.js'),
]);

test('le profil propose l’installation PWA sur mobile et ordinateur', () => {
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/accueil');
  assert.match(profilePage, /id="profile-install-app"/);
  assert.match(profilePage, /rel="manifest"/);
  assert.match(profileClient, /beforeinstallprompt/);
  assert.match(profileClient, /serviceWorker\?\.register\('\/sw\.js'\)/);
  assert.match(worker, /self\.clients\.claim/);
});

test('les correctifs d’alignement du profil restent explicites', () => {
  assert.match(profilePage, /class="profile-compact-row"/);
  assert.match(profilePage, /profile-autosave-note" id="profile-autosave-note" hidden/);
  assert.match(styles, /\.profile-page \.username-entry\{display:flex/);
  assert.match(styles, /\.profile-page \.profile-meta>div\{grid-template-columns:105px minmax\(0,1fr\);align-items:center/);
  assert.match(styles, /\.profile-page \.profile-side-stack\{height:100%\}/);
});
