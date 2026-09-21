import { supabase } from './supabase.js';

// Copie locale utilisée si Supabase est momentanément indisponible.
const fallbackProducts = [
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
const pencil = document.querySelector('#shop-edit-pencil');
const editorBar = document.querySelector('#shop-editor-bar');
const editorStatus = document.querySelector('#shop-editor-status');
const imageInput = document.querySelector('#shop-image-input');
let selectedProduct;
let products = structuredClone(fallbackProducts);
let editing = false;
let originalProducts = [];
let deletedIds = [];
let imageProductId;
let persistedIds = new Set();

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

const editorCardMarkup = (product, index) => `
  <article class="product-card shop-product-editing" data-product-card="${escapeHtml(product.id)}">
    <button class="product-image shop-edit-image" type="button" data-edit-image aria-label="Changer l’image de ${escapeHtml(product.nom)}">
      <img src="${escapeHtml(product.image)}" alt="" loading="lazy"><span>Changer l’image</span>
    </button>
    <div class="product-card-body">
      <span class="eyebrow">PRODUIT ${String(index + 1).padStart(2, '0')}</span>
      <h2 contenteditable="true" data-shop-field="nom" spellcheck="true">${escapeHtml(product.nom)}</h2>
      <p contenteditable="true" data-shop-field="description" spellcheck="true">${escapeHtml(product.description)}</p>
      <div class="shop-edit-fields">
        <label>Prix (€)<input type="number" min="0" step="0.01" data-shop-field="prix" value="${escapeHtml(product.prix)}"></label>
        <label>Producteur<input data-shop-field="producteur" value="${escapeHtml(product.producteur || '')}"></label>
        <label class="wide">Lien source<input type="url" data-shop-field="source" value="${escapeHtml(product.source || '')}"></label>
        <label class="wide">Variantes — une par ligne<textarea rows="4" data-shop-field="selections">${escapeHtml((product.selections || []).join('\n'))}</textarea></label>
      </div>
      <button class="shop-delete-product" type="button" data-delete-product>Supprimer ce produit</button>
    </div>
  </article>`;

const publicCardMarkup = (product, index) => `
  <article class="product-card" data-product-card="${escapeHtml(product.id)}">
    <div class="product-image"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.nom)}" loading="lazy"></div>
    <div class="product-card-body">
      <span class="eyebrow">SÉLECTION ${String(index + 1).padStart(2, '0')}</span>
      <h2>${escapeHtml(product.nom)}</h2>
      <p>${escapeHtml(product.description)}</p>
      ${selectionMarkup(product)}
      <div class="product-card-bottom"><strong>${price(product.prix)}</strong><button class="button dark" type="button" data-order-product="${escapeHtml(product.id)}">Commander <span>↗</span></button></div>
    </div>
  </article>`;

const renderProducts = () => {
  grid.innerHTML = products.map((product, index) => editing ? editorCardMarkup(product, index) : publicCardMarkup(product, index)).join('');
};

const fromDatabase = (row) => ({
  id: row.id, nom: row.name, prix: Number(row.price), description: row.description,
  image: row.image_url, producteur: row.producer || '', source: row.source_url || '',
  selections: Array.isArray(row.selections) ? row.selections : [],
});

const loadProducts = async () => {
  const { data } = await supabase.from('shop_products').select('*').eq('active', true).order('order_index');
  if (data?.length) {
    products = data.map(fromDatabase);
    persistedIds = new Set(data.map((row) => row.id));
  }
  renderProducts();
};

const syncEditor = () => {
  grid.querySelectorAll('[data-product-card]').forEach((card) => {
    const product = products.find((item) => item.id === card.dataset.productCard);
    if (!product) return;
    product.nom = card.querySelector('[data-shop-field="nom"]').textContent.trim();
    product.description = card.querySelector('[data-shop-field="description"]').textContent.trim();
    product.prix = Number(card.querySelector('[data-shop-field="prix"]').value);
    product.producteur = card.querySelector('[data-shop-field="producteur"]').value.trim();
    product.source = card.querySelector('[data-shop-field="source"]').value.trim();
    product.selections = card.querySelector('[data-shop-field="selections"]').value.split('\n').map((value) => value.trim()).filter(Boolean);
  });
};

const leaveEditor = () => {
  editing = false; editorBar.hidden = true; pencil.hidden = false; deletedIds = [];
  renderProducts();
};

const saveProducts = async () => {
  syncEditor();
  if (products.some((product) => !product.nom || !Number.isFinite(product.prix) || product.prix < 0)) {
    editorStatus.textContent = 'Chaque produit doit avoir un nom et un prix valide.'; return;
  }
  editorStatus.textContent = 'Enregistrement…';
  const rows = products.map((product, index) => ({
    id: product.id, name: product.nom, description: product.description, price: product.prix,
    image_url: product.image, producer: product.producteur || null, source_url: product.source || null,
    selections: product.selections || [], order_index: index + 1, active: true,
  }));
  const { error } = await supabase.from('shop_products').upsert(rows, { onConflict: 'id' });
  if (!error && deletedIds.length) {
    const result = await supabase.from('shop_products').delete().in('id', deletedIds);
    if (result.error) { editorStatus.textContent = result.error.message; return; }
  }
  if (error) { editorStatus.textContent = error.message; return; }
  persistedIds = new Set(products.map((product) => product.id));
  editorStatus.textContent = 'Boutique enregistrée.';
  leaveEditor();
};

const initializeEditor = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role === 'admin') pencil.hidden = false;
};

await loadProducts();
initializeEditor();

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
  const imageButton = event.target.closest('[data-edit-image]');
  if (editing && imageButton) {
    syncEditor(); imageProductId = imageButton.closest('[data-product-card]').dataset.productCard; imageInput.click(); return;
  }
  const deleteButton = event.target.closest('[data-delete-product]');
  if (editing && deleteButton) {
    syncEditor();
    const id = deleteButton.closest('[data-product-card]').dataset.productCard;
    if (persistedIds.has(id)) deletedIds.push(id);
    products = products.filter((product) => product.id !== id); renderProducts(); return;
  }
  const button = event.target.closest('[data-order-product]');
  if (!button) return;
  const card = button.closest('[data-product-card]');
  openOrder(button.dataset.orderProduct, card?.querySelector('[data-product-selection]')?.value);
});

grid.addEventListener('paste', (event) => {
  if (!editing || !event.target.closest('[contenteditable="true"]')) return;
  event.preventDefault(); document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
});

pencil.addEventListener('click', () => {
  editing = true; originalProducts = structuredClone(products); deletedIds = [];
  pencil.hidden = true; editorBar.hidden = false; editorStatus.textContent = 'Modifiez directement les produits.'; renderProducts();
});

document.querySelector('#shop-edit-cancel').addEventListener('click', () => {
  products = structuredClone(originalProducts); leaveEditor();
});
document.querySelector('#shop-edit-save').addEventListener('click', saveProducts);
document.querySelector('#shop-add-product').addEventListener('click', () => {
  syncEditor();
  products.push({ id: `produit-${crypto.randomUUID()}`, nom: 'Nouveau produit', prix: 0, description: 'Description du produit.', image: '/assets/shop/catalog/huile-charisma.webp', producteur: '', source: '', selections: [] });
  renderProducts(); grid.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

imageInput.addEventListener('change', async () => {
  const file = imageInput.files?.[0];
  if (!file || !imageProductId) return;
  editorStatus.textContent = 'Envoi de l’image…';
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `shop/${imageProductId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('module-assets').upload(path, file, { upsert: false, contentType: file.type });
  if (error) { editorStatus.textContent = error.message; imageInput.value = ''; return; }
  const product = products.find((item) => item.id === imageProductId);
  if (product) product.image = supabase.storage.from('module-assets').getPublicUrl(path).data.publicUrl;
  editorStatus.textContent = 'Image ajoutée. Enregistrez pour publier.'; imageInput.value = ''; renderProducts();
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
