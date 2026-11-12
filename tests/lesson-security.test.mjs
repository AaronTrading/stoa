import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const security = read('dist/security.js');
const styles = read('dist/security.css');
const lesson = read('dist/module.html');
const cgv = read('dist/cgv.html');
const headers = read('vercel.json');
const robots = read('dist/robots.txt');

test('les leçons chargent la protection partagée et sont exclues des moteurs', () => {
  assert.match(lesson, /href="security\.css"/);
  assert.match(lesson, /src="security\.min\.js"/);
  assert.match(lesson, /noindex,nofollow,noarchive,nosnippet,noimageindex/);
  assert.match(robots, /Disallow: \/module/);
});

test('les copies, impressions, captures et outils navigateur sont préventivement bloqués', () => {
  for (const token of ['contextmenu', 'selectstart', 'copy', 'cut', 'dragstart', 'PrintScreen', 'visibilitychange', 'debugger;']) {
    assert.match(security, new RegExp(token));
  }
  assert.match(styles, /-webkit-touch-callout:none/);
  assert.match(styles, /@media print/);
  assert.match(styles, /stoa-security-obscured/);
});

test('les images et vidéos ne proposent ni téléchargement ni image dans image', () => {
  assert.match(security, /image\.draggable = false/);
  assert.match(security, /nodownload noremoteplayback/);
  assert.match(security, /disablePictureInPicture = true/);
});

test('les sessions membres sont uniques sans timeout local forcé', () => {
  assert.match(security, /signOut\(\{ scope: 'others' \}\)/);
  assert.doesNotMatch(security, /INACTIVITY_TIMEOUT_MS|startInactivityLogout/);
});

test('les CGV existantes encadrent la copie et le partage des contenus', () => {
  assert.match(cgv, /copie, capture, impression, téléchargement/);
});

test('les en-têtes interdisent les cadres et le cache des leçons', () => {
  assert.match(headers, /"X-Frame-Options", "value": "DENY"/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /private, no-store, max-age=0/);
  assert.match(headers, /X-Robots-Tag/);
});
