import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const main = read('electron/main.cjs');
const preload = read('electron/preload.cjs');
const pkg = JSON.parse(read('package.json'));

test('l’application de bureau ouvre uniquement l’Académie distante', () => {
  assert.match(main, /https:\/\/stoa-coaching\.fr/);
  assert.match(main, /\/accueil/);
  assert.match(main, /isAcademyUrl/);
  assert.match(main, /url\.href === OFFLINE_URL/);
  assert.match(main, /dialog\.auth-dialog::backdrop/);
  assert.match(main, /shell\.openExternal/);
  assert.doesNotMatch(main, /loadFile\([^)]*dist\/index\.html/);
});
test('le navigateur Electron isole le contenu web', () => {
  assert.match(main, /contextIsolation:\s*true/);
  assert.match(main, /nodeIntegration:\s*false/);
  assert.match(main, /sandbox:\s*true/);
  assert.match(main, /webSecurity:\s*true/);
  assert.doesNotMatch(preload, /require\(['"](?:fs|child_process|os)['"]\)/);
});

test('le paquet Windows possède un installateur et une icône STOA', () => {
  assert.equal(pkg.main, 'electron/main.cjs');
  assert.equal(pkg.build.appId, 'fr.stoa.academie');
  assert.equal(pkg.build.win.target[0].target, 'nsis');
  assert.equal(pkg.build.win.icon, 'build/icon.ico');
});

