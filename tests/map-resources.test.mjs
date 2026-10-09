import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('la carte réunit le lait cru et les producteurs de viande au pâturage', async () => {
  const [page, script, rawPoints] = await Promise.all([
    read('dist/carte.html'),
    read('dist/map.js'),
    read('dist/data/boeufherbe-points.json')
  ]);
  const points = JSON.parse(rawPoints);
  assert.equal(points.length, 127);
  assert.ok(points.every((point) => point.type === 'viande-paturage'));
  assert.ok(points.every((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)));
  assert.match(script, /boeufherbe-points\.json/);
  assert.match(script, /Promise\.allSettled/);
  assert.match(page, /Viande au pâturage/);
  assert.match(page, /BoeufHerbe\.fr/);
});
