const fold = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const textFromTags = (tags = []) => Array.isArray(tags) ? tags.join(' ') : '';
const bounded = (value, maximum) => Math.min(value, maximum);

const BANNED_OILS = /\b(?:huile(?:s)? (?:de |d')?(?:tournesol|colza|soja|mais|carthame|arachide|pepins? de raisin|palme|palmiste|coton|son de riz)|sunflower oil|rapeseed oil|canola oil|soy(?:bean)? oil|corn oil|safflower oil|peanut oil|grape ?seed oil|palm oil|palm kernel oil|cottonseed oil|rice bran oil|huile(?:s)? vegetale(?:s)?|vegetable oil|margarine|shortening)\b/;
const ARTIFICIAL_SWEETENERS = /\b(?:aspartame|sucralose|saccharine|acesulfame(?: |-)?k|cyclamate|neotame|maltitol|sorbitol)\b/;
const REFINED_SUGARS = /\b(?:sucre(?: blanc)?|sugar|sirop de (?:glucose|mais|fructose|glucose-fructose)|high fructose corn syrup|hfcs|glucose syrup|corn syrup|dextrose|maltodextrine)\b/;
const REFINED_GRAINS = /\b(?:farine de ble|farine de froment|ble raffine|semoule de ble|amidon de mais|fleur de mais|corn flour)\b/;
const LEGUMES = /\b(?:soja|soy|pois chiche|chickpea|lentille|haricot|bean|proteine de pois|pea protein)\b/;
const INDUSTRIAL_DAIRY = /\b(?:lait ecreme|lait en poudre|poudre de lait|lait pasteurise|lait homogeneise|milk powder|skimmed milk)\b/;
const MEAT_SUBSTITUTES = /\b(?:viande vegetale|steak vegetal|simili carne|meat substitute|plant based meat|proteine vegetale texturee)\b/;
const ALCOHOL = /\b(?:alcool|ethanol|biere|beer|vin |wine |vodka|whisk(?:y|ey)|rhum|rum )\b/;
const ANCESTRAL_PREPARATION = /\b(?:levain|sourdough|fermente|fermentation|trempe|sprouted|germe)\b/;
const PREFERRED_FOODS = /\b(?:boeuf|veau|agneau|mouton|bison|gibier|poulet|dinde|canard|foie|coeur|rognon|langue|moelle|oeuf|saumon|sardine|maquereau|huitre|moule|poisson|beurre|ghee|suif|saindoux|huile d'olive vierge extra|huile de coco|lait cru|kefir|fromage au lait cru|miel|pomme de terre|patate douce|fruit)\b/;
const WHOLE_FOOD_IDENTITY = /\b(?:viande|boeuf|veau|agneau|gibier|volaille|poulet|dinde|canard|foie|abats?|oeufs?|poissons?|saumon|sardines?|maquereau|huitres?|moules?|beurre|ghee|suif|saindoux|huile d'olive vierge extra|huile de coco|lait cru|kefir|fromage au lait cru|miel|fruits? frais|pommes? de terre|patates? douces?)\b/;
const PROCESSED_IDENTITY = /\b(?:biscuit|gateau|barre|cereale|chips|snack|dessert|boisson|soda|jus|plat prepare|sauce|pate a tartiner|substitut|vegetal)\b/;

const rule = (key, label, tone = 'bad') => ({ key, label, tone });

export function calculateStoaRating(product = {}) {
  const rawIngredientTexts = [product.ingredients_text, product.ingredients_text_fr, product.ingredients_text_en]
    .filter(Boolean)
    .map(String);
  const ingredients = fold(rawIngredientTexts.sort((left, right) => right.length - left.length)[0] || '');
  const identity = fold([
    product.product_name,
    product.generic_name,
    textFromTags(product.categories_tags),
    textFromTags(product.labels_tags),
  ].filter(Boolean).join(' '));
  const nova = Number(product.nova_group || 0);
  const additives = Math.max(0, Number(product.additives_n || 0));
  const declaredIngredientCount = Number(product.ingredients_n);
  const inferredIngredientCount = ingredients ? ingredients.split(/[,;]/).filter(Boolean).length : 0;
  const ingredientCount = Math.max(
    Number.isFinite(declaredIngredientCount) && declaredIngredientCount > 0 ? declaredIngredientCount : 0,
    inferredIngredientCount,
  );
  const hasIngredients = Boolean(ingredients.trim());
  const looksWhole = WHOLE_FOOD_IDENTITY.test(identity) && !PROCESSED_IDENTITY.test(identity);
  const ancestral = ANCESTRAL_PREPARATION.test(`${ingredients} ${identity}`);
  const positives = [];
  const warnings = [];
  const blockers = [];
  let score = 55;
  let hardCap = 100;

  if (looksWhole) {
    score += 35;
    positives.push(rule('whole', 'Aliment brut et identifiable', 'good'));
  }

  if (hasIngredients && ingredientCount === 1) {
    score += 25;
    positives.push(rule('single-ingredient', 'Un seul ingrédient', 'good'));
  } else if (hasIngredients && ingredientCount <= 3) {
    score += 12;
    positives.push(rule('short-list', 'Liste très courte', 'good'));
  } else if (ingredientCount >= 10) {
    score -= 22;
    warnings.push(rule('long-list', `${ingredientCount} ingrédients : formulation industrielle`));
  } else if (ingredientCount >= 6) {
    score -= 12;
    warnings.push(rule('long-list', `${ingredientCount} ingrédients`));
  }

  if (PREFERRED_FOODS.test(ingredients || identity)) {
    score += 7;
    positives.push(rule('preferred-food', 'Base alimentaire cohérente avec STOA', 'good'));
  }

  if (BANNED_OILS.test(ingredients)) {
    score -= 55;
    hardCap = Math.min(hardCap, 14);
    blockers.push(rule('seed-oil', 'Huile industrielle ou margarine'));
  }
  if (ARTIFICIAL_SWEETENERS.test(ingredients)) {
    score -= 55;
    hardCap = Math.min(hardCap, 14);
    blockers.push(rule('sweetener', 'Édulcorant artificiel ou polyol'));
  }
  if (MEAT_SUBSTITUTES.test(`${ingredients} ${identity}`)) {
    score -= 50;
    hardCap = Math.min(hardCap, 14);
    blockers.push(rule('meat-substitute', 'Substitut industriel de viande'));
  }
  if (REFINED_SUGARS.test(ingredients)) {
    score -= 30;
    hardCap = Math.min(hardCap, 34);
    warnings.push(rule('refined-sugar', 'Sucre raffiné ou sirop ajouté'));
  }
  if (REFINED_GRAINS.test(ingredients)) {
    const penalty = ancestral ? 9 : 22;
    score -= penalty;
    hardCap = Math.min(hardCap, ancestral ? 59 : 44);
    warnings.push(rule('refined-grain', ancestral ? 'Céréale préparée par fermentation' : 'Farine ou céréale raffinée'));
  }
  if (LEGUMES.test(ingredients) && !MEAT_SUBSTITUTES.test(`${ingredients} ${identity}`)) {
    score -= ancestral ? 7 : 15;
    hardCap = Math.min(hardCap, ancestral ? 59 : 54);
    warnings.push(rule('legume', ancestral ? 'Légumineuse fermentée ou germée' : 'Légumineuse : pas une base STOA'));
  }
  if (INDUSTRIAL_DAIRY.test(ingredients)) {
    score -= 22;
    hardCap = Math.min(hardCap, 49);
    warnings.push(rule('industrial-dairy', 'Produit laitier industriel'));
  }
  if (ALCOHOL.test(`${ingredients} ${identity}`)) {
    score -= 42;
    hardCap = Math.min(hardCap, 24);
    warnings.push(rule('alcohol', 'Alcool'));
  }

  if (nova === 4) {
    score -= 45;
    hardCap = Math.min(hardCap, 19);
    blockers.push(rule('nova-4', 'Produit ultra-transformé'));
  } else if (nova === 3) {
    score -= 16;
    hardCap = Math.min(hardCap, 54);
    warnings.push(rule('nova-3', 'Produit transformé'));
  } else if (nova === 1) {
    score += 8;
    positives.push(rule('nova-1', 'Transformation minimale', 'good'));
  }

  if (additives > 0) {
    score -= bounded(additives * 9, 36);
    hardCap = Math.min(hardCap, additives >= 3 ? 24 : 49);
    warnings.push(rule('additives', `${additives} additif${additives > 1 ? 's' : ''}`));
  }

  const insufficient = !hasIngredients && !looksWhole;
  if (insufficient) {
    score = Math.min(score - 25, 29);
    hardCap = Math.min(hardCap, 29);
    warnings.push(rule('missing-ingredients', 'Liste d’ingrédients absente : produit non validé'));
  }

  score = Math.max(0, Math.min(100, Math.round(Math.min(score, hardCap))));
  const label = score >= 85 ? 'Conforme STOA'
    : score >= 70 ? 'Bon choix'
      : score >= 50 ? 'Dépannage'
        : score >= 25 ? 'À éviter'
          : 'À écarter';

  let recommendation = 'Produit acceptable ponctuellement, mais un aliment brut reste préférable.';
  if (blockers.length) recommendation = `Reposez-le. ${blockers.map(item => item.label).join(' · ')}.`;
  else if (insufficient) recommendation = 'Impossible de valider ce produit sans sa composition. Ne vous fiez pas à la face avant de l’emballage.';
  else if (score < 50) recommendation = `À éviter. ${warnings.map(item => item.label).slice(0, 2).join(' · ')}.`;
  else if (score >= 85) recommendation = 'Produit simple, identifiable et cohérent avec les fondations alimentaires de STOA.';
  else if (score >= 70) recommendation = 'Bon choix dans le cadre STOA. Vérifiez simplement sa qualité et sa provenance.';

  return {
    score,
    label,
    recommendation,
    rules: [...blockers, ...warnings, ...positives],
    blockers,
    warnings,
  };
}
