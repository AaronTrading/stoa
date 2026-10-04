import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [page, styles] = await Promise.all([
  readFile(new URL('../dist/coaching-coach.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/styles.css', import.meta.url), 'utf8'),
]);

test('la modale Coaching masque réellement les champs non pertinents', () => {
  assert.match(page, /data-action-module hidden/);
  assert.match(styles, /\.coach-dialog \[hidden\]\{display:none!important\}/);
});

test('la modale ne déborde pas horizontalement', () => {
  assert.match(styles, /\.coach-dialog\{max-width:620px;max-height:min\(90dvh,900px\);overflow-x:hidden/);
  assert.match(styles, /\.coach-dialog input:not\(\[type=checkbox\]\),\.coach-dialog select,\.coach-dialog textarea\{display:block;width:100%;min-width:0;max-width:100%\}/);
  assert.match(styles, /\.coach-dialog footer \.button\{width:auto/);
});

test('la visibilité client reste une ligne compacte', () => {
  assert.match(styles, /label\[data-action-visible\]\{display:flex;flex-direction:row;align-items:center/);
  assert.match(styles, /label\[data-action-visible\] input\{width:18px;height:18px/);
});
