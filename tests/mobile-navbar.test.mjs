import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const shell = await readFile(new URL('../dist/academy-shell.js', import.meta.url), 'utf8');

test('la barre mobile fermée ne contient aucun libellé après le logo', () => {
  assert.doesNotMatch(shell, /mobilePageLabel/);
  assert.match(shell, /class="academy-mobile-menu"[^`]+<img[^>]+alt="STOA"><\/button>/);
  assert.doesNotMatch(shell, /<img[^>]+alt="STOA"><span>/);
});
