// Remplacez simplement ces trois objets lorsque les produits définitifs sont connus.
// Le champ producteur reste une référence interne et n’est jamais affiché sur la page.
export const products = [
  {
    id: 'produit-01',
    nom: 'Infusion du soir',
    description: 'Un mélange sobre de plantes sélectionnées pour accompagner le passage vers le repos.',
    prix: 18,
    image: '/assets/shop/produit-01.svg',
    producteur: 'Producteur à renseigner',
  },
  {
    id: 'produit-02',
    nom: 'Carnet de pratique',
    description: 'Un carnet simple pour observer ses habitudes, noter ses repères et suivre sa progression.',
    prix: 24,
    image: '/assets/shop/produit-02.svg',
    producteur: 'Producteur à renseigner',
  },
  {
    id: 'produit-03',
    nom: 'Huile essentielle',
    description: 'Une référence choisie avec mesure pour compléter les rituels du quotidien.',
    prix: 16,
    image: '/assets/shop/produit-03.svg',
    producteur: 'Producteur à renseigner',
  },
];

const RECIPIENT = 'coaching.stoa@gmail.com';
const grid = document.querySelector('#product-grid');
const dialog = document.querySelector('#order-dialog');
const form = document.querySelector('#order-form');
const productInput = document.querySelector('#order-product');
const errorMessage = document.querySelector('#order-error');
let selectedProduct;

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const price = (value) => new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 0,
}).format(value);

grid.innerHTML = products.map((product, index) => `
  <article class="product-card">
    <div class="product-image"><img src="${escapeHtml(product.image)}" alt="Illustration de ${escapeHtml(product.nom)}"></div>
    <div class="product-card-body">
      <span class="eyebrow">SÉLECTION ${String(index + 1).padStart(2, '0')}</span>
      <h2>${escapeHtml(product.nom)}</h2>
      <p>${escapeHtml(product.description)}</p>
      <div class="product-card-bottom"><strong>${price(product.prix)}</strong><button class="button dark" type="button" data-order-product="${escapeHtml(product.id)}">Commander <span>↗</span></button></div>
    </div>
  </article>`).join('');

document.querySelectorAll('[data-year]').forEach((element) => { element.textContent = new Date().getFullYear(); });

const openOrder = (productId) => {
  selectedProduct = products.find((product) => product.id === productId);
  if (!selectedProduct) return;
  form.reset();
  errorMessage.hidden = true;
  productInput.value = `${selectedProduct.nom} — ${price(selectedProduct.prix)}`;
  document.querySelector('#order-quantity').value = '1';
  dialog.showModal();
  document.querySelector('#order-name').focus();
};

const closeOrder = () => {
  if (dialog.open) dialog.close();
};

grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-order-product]');
  if (button) openOrder(button.dataset.orderProduct);
});

document.querySelector('#order-close').addEventListener('click', closeOrder);
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeOrder();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  errorMessage.hidden = true;
  if (!selectedProduct || !form.reportValidity()) {
    errorMessage.textContent = 'Renseignez votre nom, votre email et votre adresse de livraison.';
    errorMessage.hidden = false;
    return;
  }

  const data = new FormData(form);
  const quantity = Math.max(1, Number(data.get('quantity')) || 1);
  const subject = `Commande STOA — ${selectedProduct.nom}`;
  const body = [
    'Bonjour,', '',
    'Je souhaite commander le produit suivant :',
    `Produit : ${selectedProduct.nom}`,
    `Référence : ${selectedProduct.id}`,
    `Prix unitaire affiché : ${price(selectedProduct.prix)}`,
    `Quantité : ${quantity}`, '',
    `Nom complet : ${String(data.get('name')).trim()}`,
    `Email : ${String(data.get('email')).trim()}`,
    `Téléphone : ${String(data.get('phone')).trim() || 'Non renseigné'}`,
    `Adresse de livraison : ${String(data.get('address')).trim()}`, '',
    'Merci de me confirmer la disponibilité, le montant final et le délai de livraison.',
  ].join('\n');

  window.location.href = `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
