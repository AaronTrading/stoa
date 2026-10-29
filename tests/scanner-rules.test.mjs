import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateStoaRating } from '../dist/scanner-rules.js';

test('les huiles de graines rendent le produit incompatible avec STOA', () => {
  const product = {
    product_name: 'Crackers bio',
    ingredients_text: 'Farine de blé, huile de tournesol, sel',
    ingredients_n: 3,
    nova_group: 3,
    additives_n: 0,
    nutrition_grades: 'a',
  };
  const result = calculateStoaRating(product);
  assert.ok(result.score <= 14);
  assert.equal(result.label, 'À écarter');
  assert.ok(result.blockers.some(item => item.key === 'seed-oil'));
});

test('un aliment brut riche en graisses saturées reste conforme', () => {
  const result = calculateStoaRating({
    product_name: 'Beurre cru',
    ingredients_text: 'Crème crue',
    ingredients_n: 1,
    nova_group: 1,
    additives_n: 0,
    nutriments: { 'saturated-fat_100g': 55, salt_100g: 1.2 },
  });
  assert.ok(result.score >= 85);
  assert.equal(result.label, 'Conforme STOA');
});

test('le sucre naturellement présent dans un fruit ne fait pas chuter la note', () => {
  const result = calculateStoaRating({
    product_name: 'Purée de pommes',
    ingredients_text: 'Pommes',
    ingredients_n: 1,
    nova_group: 1,
    additives_n: 0,
    nutriments: { sugars_100g: 14 },
  });
  assert.ok(result.score >= 85);
  assert.ok(!result.warnings.some(item => item.key === 'refined-sugar'));
});

test('un produit ultra-transformé avec édulcorant reçoit un refus net', () => {
  const result = calculateStoaRating({
    product_name: 'Barre protéinée végétale',
    ingredients_text: 'Protéine de pois, sirop de glucose, sucralose, huile de colza, arômes',
    ingredients_n: 5,
    nova_group: 4,
    additives_n: 3,
  });
  assert.ok(result.score <= 14);
  assert.equal(result.label, 'À écarter');
  assert.ok(result.blockers.some(item => item.key === 'sweetener'));
  assert.ok(result.blockers.some(item => item.key === 'nova-4'));
});

test('le Nutri-Score public ne change jamais le verdict STOA', () => {
  const product = {
    product_name: 'Produit simple',
    ingredients_text: 'Pommes',
    ingredients_n: 1,
    nova_group: 1,
    additives_n: 0,
  };
  const withA = calculateStoaRating({ ...product, nutrition_grades: 'a' });
  const withE = calculateStoaRating({ ...product, nutrition_grades: 'e' });
  assert.equal(withA.score, withE.score);
  assert.equal(withA.label, withE.label);
});

test('la composition française complète prime sur une traduction tronquée', () => {
  const result = calculateStoaRating({
    product_name: 'Pâte à tartiner',
    ingredients_text: 'sugar, palm oil',
    ingredients_text_fr: 'Sucre, huile de palme, noisettes, cacao maigre, lait écrémé en poudre, lactosérum, lécithine de soja, vanilline',
    ingredients_n: 2,
    nova_group: 3,
  });
  assert.ok(result.score <= 34);
  assert.ok(result.warnings.some(item => item.key === 'refined-sugar'));
  assert.ok(result.warnings.some(item => item.key === 'industrial-dairy'));
});

test('une composition absente interdit toute bonne note', () => {
  const result = calculateStoaRating({ product_name: 'Produit mystère' });
  assert.ok(result.score <= 29);
  assert.match(result.recommendation, /Impossible de valider/);
});
