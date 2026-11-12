import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const [page, editor, styles] = await Promise.all([
  read('../dist/module.html'),
  read('../dist/lesson-editor.js'),
  read('../dist/styles.css'),
]);

test('les blocs interactifs sont disponibles sans réintroduire le quiz', () => {
  assert.match(page, /id="lesson-copy-block-add"/);
  assert.match(page, /id="lesson-image-selector-add"/);
  assert.doesNotMatch(page, /lesson-quiz-enabled|Quiz dans cette leçon/);
  assert.doesNotMatch(page, /LECTURE & PRATIQUE|class="lesson-meta"/);
});

test('le sélecteur d’images est verrouillé, inséré au curseur et déplaçable', () => {
  assert.match(editor, /selector\.contentEditable = 'false'/);
  assert.match(editor, /placeInsertionMarker\(\)/);
  assert.match(editor, /insertImageAtMarker\(selector\)/);
  assert.match(editor, /selector\.draggable = editing/);
  assert.match(editor, /ensureSpaceAfterImageSelectors\(\)/);
  assert.match(styles, /Glisser pour déplacer/);
});
