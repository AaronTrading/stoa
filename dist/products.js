// Catalogue éditable à la main. Les champs producteur et source restent internes.
export const products = [
  {
    id: 'huile-olive-charisma', nom: 'Huile d’olive Charisma', prix: 29.99,
    description: 'Huile d’olive vierge extra biologique grecque, issue d’olives Koroneiki. Format 1 litre.',
    image: '/assets/shop/catalog/huile-charisma.webp', producteur: 'Vassilakis Estate',
    source: 'https://www.amazon.fr/Charisma-dOlive-Vierge-Biologique-Grecque/dp/B0CRZ73R7B?th=1',
  },
  {
    id: 'mastiha-chios', nom: 'Mastiha de Chios', prix: 29.99,
    description: 'Larmes naturelles de mastiha de Chios, sélection large. Un produit grec singulier au format 100 g.',
    image: '/assets/shop/catalog/mastiha.jpg', producteur: 'Mastiha Shop',
    source: 'https://mastihashop.com/en/collections/chios-mastiha/products/natural-chios-mastiha-large-tears',
  },
  {
    id: 'sanglier', nom: 'Sanglier', prix: 74.99,
    description: 'Une viande sauvage de caractère, proposée en coffret complet ou en pièces choisies.',
    image: '/assets/shop/catalog/sanglier.jpg', producteur: 'Nemrod',
    source: 'https://nemrod.co/collections/nos-viandes-fraiches/products/colis-de-viande-le-tout-sanglier',
    selections: ['Coffret complet — 2,3 kg', 'Civet — 1 kg', 'Côtelettes — 500 g', 'Rôti — 800 g'],
  },
  {
    id: 'cerf', nom: 'Cerf', prix: 94.99,
    description: 'Cerf sauvage français, à choisir en assortiment complet ou selon la pièce souhaitée.',
    image: '/assets/shop/catalog/cerf.jpg', producteur: 'Nemrod',
    source: 'https://nemrod.co/collections/nos-viandes-fraiches/products/colis-de-viande-le-tout-cerf',
    selections: ['Coffret complet — 3 kg', 'Jarret — 1,2 kg', 'Civet — 1 kg', 'Pavés — 800 g'],
  },
  {
    id: 'chevreuil', nom: 'Chevreuil', prix: 129.99,
    description: 'Chevreuil sauvage à la chair fine, disponible en coffret ou sous forme de pièces distinctes.',
    image: '/assets/shop/catalog/chevreuil.jpg', producteur: 'Nemrod',
    source: 'https://nemrod.co/collections/nos-viandes-fraiches/products/le-tout-chevreuil',
    selections: ['Coffret complet — 3,6 kg', 'Cuissot — 1,7 kg', 'Civet — 1 kg', 'Pavés — 900 g'],
  },
  {
    id: 'biche', nom: 'Biche', prix: 29.99,
    description: 'Biche préparée en Sologne, tendre et parfumée, pensée pour les cuissons lentes ou rôties.',
    image: '/assets/shop/catalog/biche.jpg', producteur: 'Atelier du Loup',
    source: 'https://atelierduloup.com/gibier/cerf-biche/civet-de-biche-25-kg/',
    selections: ['Civet — 2,5 kg', 'Civet — portion', 'Rôti', 'Pavés'],
  },
  {
    id: 'faisan', nom: 'Faisan', prix: 29.99,
    description: 'Faisan préparé en Sologne, à la chair délicate et parfumée, prêt à cuisiner.',
    image: '/assets/shop/catalog/faisan.jpg', producteur: 'Atelier du Loup',
    source: 'https://atelierduloup.com/gibier/faisan/supremes-de-faisans-x10/',
    selections: ['Lot de 10 suprêmes', 'Suprêmes — demi-lot', 'Faisan entier', 'Cuisses'],
  },
  {
    id: 'buffle', nom: 'Buffle', prix: 69.99,
    description: 'Un colis découverte de buffle biologique aux morceaux variés, de la grillade au mijoté.',
    image: '/assets/shop/catalog/buffle.jpg', producteur: 'La Ferme de Souegnes',
    source: 'https://www.pourdebon.com/colis-decouverte-de-buffle-bio-p43033',
    selections: ['Colis découverte complet', 'Côtes', 'Steaks', 'Sauté'],
  },
  {
    id: 'cheval', nom: 'Cheval', prix: 149.99,
    description: 'Un assortiment généreux de viande chevaline comprenant des pièces à rôtir et à saisir.',
    image: '/assets/shop/catalog/cheval.jpg', producteur: 'Boucherie Lefeuvre',
    source: 'https://www.pourdebon.com/colis-de-cheval-3-1-kg-p42036',
    selections: ['Colis complet — 3,1 kg', 'Rôti — 1 kg', 'Faux-filets', 'Steaks'],
  },
  {
    id: 'chevreau', nom: 'Chevreau', prix: 79.99,
    description: 'Quart arrière de chevreau réunissant gigot et filet, pour une cuisson entière ou séparée.',
    image: '/assets/shop/catalog/chevreau.jpg', producteur: 'Ferme du Caroire',
    source: 'https://www.pourdebon.com/gigot-filet-de-chevreau-quart-arriere-1-7-kg-p12773',
    selections: ['Quart arrière complet — 1,7 kg', 'Gigot', 'Filet'],
  },
  {
    id: 'bison', nom: 'Bison', prix: 34.99,
    description: 'Des faux-filets de bison tendres et goûteux, conditionnés pour une cuisson rapide.',
    image: '/assets/shop/catalog/bison.jpg', producteur: 'Bisons d’Auvergne',
    source: 'https://www.pourdebon.com/steaks-de-faux-filet-de-bison-fondants-et-goutus-p7757',
    selections: ['Lot de 2 faux-filets', 'Faux-filet à l’unité', 'Assortiment découverte'],
  },
  {
    id: 'autruche', nom: 'Autruche', prix: 49.99,
    description: 'Rôti frais dans le filet d’autruche, une viande rouge tendre et délicate.',
    image: '/assets/shop/catalog/autruche.jpg', producteur: 'L’Autruche de Laurette',
    source: 'https://www.pourdebon.com/roti-dans-le-filet-frais-p82573',
    selections: ['Rôti dans le filet', 'Filet en pavés', 'Assortiment découverte'],
  },
];

const RECIPIENT = 'coaching.stoa@gmail.com';
const grid = document.querySelector('#product-grid');
const dialog = document.querySelector('#order-dialog');
const form = document.querySelector('#order-form');
const productInput = document.querySelector('#order-product');
const variantWrap = document.querySelector('#order-selection-wrap');
const variantInput = document.querySelector('#order-selection');
const errorMessage = document.querySelector('#order-error');
let selectedProduct;

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const price = (value) => new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 2,
}).format(value);

const selectionMarkup = (product) => product.selections?.length ? `
  <label class="product-selection-label" for="selection-${escapeHtml(product.id)}">Sélection</label>
  <select class="product-selection" id="selection-${escapeHtml(product.id)}" data-product-selection>
    ${product.selections.map((selection) => `<option>${escapeHtml(selection)}</option>`).join('')}
  </select>` : '';

grid.innerHTML = products.map((product, index) => `
  <article class="product-card" data-product-card="${escapeHtml(product.id)}">
    <div class="product-image"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.nom)}" loading="lazy"></div>
    <div class="product-card-body">
      <span class="eyebrow">SÉLECTION ${String(index + 1).padStart(2, '0')}</span>
      <h2>${escapeHtml(product.nom)}</h2>
      <p>${escapeHtml(product.description)}</p>
      ${selectionMarkup(product)}
      <div class="product-card-bottom"><strong>${price(product.prix)}</strong><button class="button dark" type="button" data-order-product="${escapeHtml(product.id)}">Commander <span>↗</span></button></div>
    </div>
  </article>`).join('');

document.querySelectorAll('[data-year]').forEach((element) => { element.textContent = new Date().getFullYear(); });

const openOrder = (productId, preferredSelection) => {
  selectedProduct = products.find((product) => product.id === productId);
  if (!selectedProduct) return;
  form.reset(); errorMessage.hidden = true;
  productInput.value = `${selectedProduct.nom} — ${price(selectedProduct.prix)}`;
  variantWrap.hidden = !selectedProduct.selections?.length;
  variantInput.required = Boolean(selectedProduct.selections?.length);
  variantInput.innerHTML = (selectedProduct.selections || []).map((selection) => `<option${selection === preferredSelection ? ' selected' : ''}>${escapeHtml(selection)}</option>`).join('');
  document.querySelector('#order-quantity').value = '1';
  dialog.showModal(); document.querySelector('#order-name').focus();
};

const closeOrder = () => { if (dialog.open) dialog.close(); };

grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-order-product]');
  if (!button) return;
  const card = button.closest('[data-product-card]');
  openOrder(button.dataset.orderProduct, card?.querySelector('[data-product-selection]')?.value);
});

document.querySelector('#order-close').addEventListener('click', closeOrder);
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeOrder();
});

form.addEventListener('submit', (event) => {
  event.preventDefault(); errorMessage.hidden = true;
  if (!selectedProduct || !form.reportValidity()) {
    errorMessage.textContent = 'Renseignez votre nom, votre email et votre adresse de livraison.';
    errorMessage.hidden = false; return;
  }
  const data = new FormData(form);
  const quantity = Math.max(1, Number(data.get('quantity')) || 1);
  const selection = String(data.get('selection') || '').trim();
  const subject = `Commande STOA — ${selectedProduct.nom}`;
  const body = [
    'Bonjour,', '', 'Je souhaite commander le produit suivant :',
    `Produit : ${selectedProduct.nom}`, `Référence : ${selectedProduct.id}`,
    selection ? `Sélection : ${selection}` : null,
    `Prix unitaire affiché : ${price(selectedProduct.prix)}`, `Quantité : ${quantity}`, '',
    `Nom complet : ${String(data.get('name')).trim()}`, `Email : ${String(data.get('email')).trim()}`,
    `Téléphone : ${String(data.get('phone')).trim() || 'Non renseigné'}`,
    `Adresse de livraison : ${String(data.get('address')).trim()}`, '',
    'Merci de me confirmer la disponibilité, le montant final et le délai de livraison.',
  ].filter(Boolean).join('\n');
  window.location.href = `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
