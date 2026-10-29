import { calculateStoaRating } from './scanner-rules.js';

const startButton = document.querySelector('#scanner-start');
const stopButton = document.querySelector('#scanner-stop');
const video = document.querySelector('#scanner-video');
const status = document.querySelector('#scanner-status');
const form = document.querySelector('#barcode-form');
const input = document.querySelector('#barcode-input');
const resultPanel = document.querySelector('#product-analysis');
const emptyPanel = document.querySelector('#scanner-empty');
let controls;
let reader;
let analysing = false;
document.querySelectorAll('[data-year]').forEach((element) => { element.textContent = new Date().getFullYear(); });

const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const normalizeCode = (raw) => String(raw || '').replace(/\s/g, '').match(/\d{8,14}/)?.[0] || '';

const nutritionValue = (value, unit = 'g') => Number.isFinite(Number(value)) ? `${Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${unit}` : '—';

const renderProduct = (product, code) => {
  const rating = calculateStoaRating(product), nutrients = product.nutriments || {};
  const allergens = (product.allergens_tags || []).map((item) => item.replace(/^..:/, '').replaceAll('-', ' ')).join(', ');
  const ingredients = [product.ingredients_text, product.ingredients_text_fr, product.ingredients_text_en]
    .filter(Boolean).map(String).sort((left, right) => right.length - left.length)[0] || '';
  resultPanel.innerHTML = `
    <div class="analysis-head">
      <div class="analysis-image">${product.image_front_url || product.image_front_small_url ? `<img src="${escapeHtml(product.image_front_url || product.image_front_small_url)}" alt="${escapeHtml(product.product_name || 'Produit')}" loading="lazy">` : '<span>Σ</span>'}</div>
      <div><span class="eyebrow">${escapeHtml(product.brands || 'PRODUIT ALIMENTAIRE')}</span><h2>${escapeHtml(product.product_name || 'Produit sans nom')}</h2><p>${escapeHtml(product.quantity || '')} · ${escapeHtml(code)}</p></div>
      <div class="stoa-score score-${Math.floor(rating.score / 20)}"><strong>${rating.score}</strong><span>/ 100<br>${rating.label}</span></div>
    </div>
    <div class="analysis-verdict"><span>VERDICT STOA</span><strong>${escapeHtml(rating.label)}</strong><p>${escapeHtml(rating.recommendation)}</p></div>
    <div class="analysis-rules">${rating.rules.map((item) => `<span class="${item.tone === 'good' ? 'good' : 'bad'}">${escapeHtml(item.label)}</span>`).join('')}</div>
    <div class="nutrition-grid">
      <div><span>Énergie</span><strong>${nutritionValue(nutrients['energy-kcal_100g'], 'kcal')}</strong></div>
      <div><span>Sucres</span><strong>${nutritionValue(nutrients.sugars_100g)}</strong></div>
      <div><span>Graisses saturées</span><strong>${nutritionValue(nutrients['saturated-fat_100g'])}</strong></div>
      <div><span>Sel</span><strong>${nutritionValue(nutrients.salt_100g)}</strong></div>
      <div><span>Fibres</span><strong>${nutritionValue(nutrients.fiber_100g)}</strong></div>
      <div><span>Protéines</span><strong>${nutritionValue(nutrients.proteins_100g)}</strong></div>
    </div>
    <details class="analysis-details"><summary>Ingrédients et allergènes <span>+</span></summary><p>${escapeHtml(ingredients || 'Liste des ingrédients non renseignée.')}</p><p><strong>Allergènes :</strong> ${escapeHtml(allergens || 'non renseignés')}</p></details>`;
  emptyPanel.hidden = true; resultPanel.hidden = false;
};

const analyse = async (rawCode) => {
  const code = normalizeCode(rawCode);
  if (!code) { status.textContent = 'Aucun code-barres alimentaire valide détecté.'; return; }
  if (analysing) return;
  analysing = true; status.textContent = `Recherche du produit ${code}…`; input.value = code;
  try {
    const fields = 'code,product_name,generic_name,brands,quantity,image_front_url,image_front_small_url,nova_group,additives_n,ingredients_n,ingredients_text,ingredients_text_fr,ingredients_text_en,allergens_tags,categories_tags,labels_tags,nutriments';
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`);
    if (!response.ok) throw new Error('Service indisponible');
    const payload = await response.json();
    if (payload.status !== 1 || !payload.product) { resultPanel.hidden = true; emptyPanel.hidden = false; status.textContent = 'Produit inconnu dans Open Food Facts.'; return; }
    renderProduct(payload.product, code); status.textContent = 'Analyse terminée.'; navigator.vibrate?.(80);
  } catch { status.textContent = 'Impossible de récupérer les informations du produit.'; }
  finally { analysing = false; }
};

const stopScanner = () => {
  controls?.stop(); controls = undefined; video.srcObject = null;
  startButton.hidden = false; stopButton.hidden = true;
};

startButton.addEventListener('click', async () => {
  startButton.disabled = true; status.textContent = 'Ouverture de la caméra…';
  try {
    const { BrowserMultiFormatReader } = await import('https://esm.sh/@zxing/browser@0.2.1');
    reader ||= new BrowserMultiFormatReader(undefined, { delayBetweenScanAttempts: 250 });
    controls = await reader.decodeFromVideoDevice(undefined, video, (scanResult) => {
      if (!scanResult) return;
      const code = normalizeCode(scanResult.getText());
      if (!code) return;
      stopScanner(); analyse(code);
    });
    startButton.hidden = true; stopButton.hidden = false; status.textContent = 'Placez le code-barres dans le cadre.';
  } catch { status.textContent = 'Caméra indisponible. Vérifiez son autorisation ou saisissez le code.'; }
  finally { startButton.disabled = false; }
});
stopButton.addEventListener('click', () => { stopScanner(); status.textContent = 'Caméra arrêtée.'; });
form.addEventListener('submit', (event) => { event.preventDefault(); stopScanner(); analyse(input.value); });
window.addEventListener('pagehide', stopScanner);
const initialCode = new URLSearchParams(location.search).get('code');
if (initialCode) analyse(initialCode);
