import { getImageUrl, getProducts } from './api.js';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const grid = document.querySelector('#product-grid');
const feedback = document.querySelector('#feedback');
const categories = document.querySelector('#categories');
const search = document.querySelector('#search');
const productDialog = document.querySelector('#product-dialog');
const cartDialog = document.querySelector('#cart-dialog');
const cart = new Map();
let products = [];
let selectedCategory = 'Todos';

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function price(cents) {
  return money.format(cents / 100);
}

function stockStatus(product) {
  if (product.stock === 0) return { text: 'Esgotado', className: 'stock-out' };
  if (product.stock <= product.minStock) return { text: 'Últimas unidades', className: 'stock-low' };
  return { text: 'Disponível', className: 'stock-available' };
}

function renderCategories() {
  categories.replaceChildren();
  const values = ['Todos', ...new Set(products.map((product) => product.category))];
  for (const value of values) {
    const button = node('button', `category-chip${selectedCategory === value ? ' active' : ''}`, value);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(selectedCategory === value));
    button.addEventListener('click', () => {
      selectedCategory = value;
      renderCategories();
      renderProducts();
    });
    categories.append(button);
  }
  categories.append(node('span', 'results-count', `${products.length} itens no catálogo`));
}

function renderProducts() {
  const term = search.value.trim().toLocaleLowerCase('pt-BR');
  const visible = products.filter((product) => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = `${product.name} ${product.description} ${product.category}`
      .toLocaleLowerCase('pt-BR').includes(term);
    return matchesCategory && matchesSearch;
  });
  grid.replaceChildren();
  feedback.textContent = visible.length ? '' : 'Nenhum item encontrado. Tente outra busca.';
  feedback.hidden = visible.length > 0;
  for (const [index, product] of visible.entries()) grid.append(productCard(product, index));
  renderCartCount();
}

function productCard(product, index) {
  const card = node('article', 'product-card');
  const art = node('div', `product-art art-${index % 6}`);
  const imageUrl = getImageUrl(product.imageUrl);
  if (imageUrl) {
    const image = node('img', 'product-image');
    image.src = imageUrl;
    image.alt = product.name;
    image.loading = 'lazy';
    image.addEventListener('error', () => image.replaceWith(node('span', 'product-emoji', product.emoji || '✨')), { once: true });
    art.append(image);
  } else {
    art.append(node('span', 'product-emoji', product.emoji || '✨'));
  }
  if (product.badge) art.append(node('span', 'product-badge', product.badge));
  art.append(node('span', 'art-spark', '✦'));

  const meta = node('div', 'product-meta');
  meta.append(node('span', '', product.category));
  const stock = stockStatus(product);
  meta.append(node('span', `stock-status ${stock.className}`, stock.text));
  const title = node('h3', '', product.name);
  const description = node('p', 'product-description', product.description);
  const footer = node('div', 'product-footer');
  footer.append(node('strong', '', price(product.priceCents)));
  const actions = node('div', 'product-actions');
  const details = node('button', 'details-button', 'Detalhes');
  details.type = 'button';
  details.addEventListener('click', () => showDetails(product));
  const add = node('button', 'add-button', product.stock > 0 ? '+ Adicionar' : 'Esgotado');
  add.type = 'button';
  add.disabled = product.stock === 0;
  add.addEventListener('click', () => {
    cart.set(product.id, Math.min((cart.get(product.id) || 0) + 1, product.stock));
    renderCartCount();
    add.textContent = '✓ Adicionado';
    window.setTimeout(() => { add.textContent = '+ Adicionar'; }, 1000);
  });
  actions.append(details, add);
  footer.append(actions);
  card.append(art, meta, title, description, footer);
  return card;
}

function showDetails(product) {
  const detail = document.querySelector('#product-detail');
  detail.replaceChildren();
  const imageUrl = getImageUrl(product.imageUrl);
  if (imageUrl) {
    const image = node('img', 'detail-image');
    image.src = imageUrl;
    image.alt = product.name;
    detail.append(image);
  } else {
    detail.append(node('div', 'detail-emoji', product.emoji || '✨'));
  }
  detail.append(node('p', 'eyebrow', product.category.toLocaleUpperCase('pt-BR')));
  detail.append(node('h2', '', product.name));
  detail.append(node('p', 'detail-description', product.description));
  const stock = stockStatus(product);
  detail.append(node('p', `stock-status ${stock.className}`, `${stock.text} · ${product.stock} em estoque`));
  detail.append(node('strong', 'detail-price', price(product.priceCents)));
  productDialog.showModal();
}

function renderCartCount() {
  const count = [...cart.values()].reduce((total, quantity) => total + quantity, 0);
  const badge = document.querySelector('#cart-count');
  badge.textContent = String(count);
  badge.setAttribute('aria-label', `${count} itens`);
}

function renderCart() {
  const content = document.querySelector('#cart-content');
  const count = [...cart.values()].reduce((total, quantity) => total + quantity, 0);
  document.querySelector('#drawer-count').textContent = `(${count})`;
  content.replaceChildren();
  const items = products.filter((product) => cart.has(product.id));
  if (!items.length) {
    const empty = node('div', 'empty-cart');
    empty.append(node('span', '', '🪄'), node('h3', '', 'Sua sacola está vazia'),
      node('p', '', 'Tem um universo inteiro esperando para ser explorado.'));
    content.append(empty);
    return;
  }
  let total = 0;
  const list = node('div', 'cart-items');
  for (const product of items) {
    const quantity = cart.get(product.id);
    total += product.priceCents * quantity;
    const item = node('div', 'cart-item');
    item.append(node('span', 'cart-item-emoji', product.emoji || '✨'));
    const info = node('div', 'cart-item-info');
    info.append(node('strong', '', product.name), node('span', '', price(product.priceCents)));
    const controls = node('div', 'quantity-control');
    const decrease = node('button', '', '−');
    decrease.type = 'button';
    decrease.setAttribute('aria-label', `Diminuir quantidade de ${product.name}`);
    decrease.addEventListener('click', () => {
      if (quantity <= 1) cart.delete(product.id);
      else cart.set(product.id, quantity - 1);
      renderCart();
    });
    controls.append(decrease, node('span', '', String(quantity)));
    const increase = node('button', '', '+');
    increase.type = 'button';
    increase.disabled = quantity >= product.stock;
    increase.setAttribute('aria-label', `Aumentar quantidade de ${product.name}`);
    increase.addEventListener('click', () => {
      cart.set(product.id, Math.min(quantity + 1, product.stock));
      renderCart();
    });
    controls.append(increase);
    info.append(controls);
    item.append(info);
    list.append(item);
  }
  const checkout = node('div', 'checkout');
  const totalRow = node('div', 'total-row');
  totalRow.append(node('span', '', 'Total demonstrativo'), node('strong', '', price(total)));
  const note = node('p', 'demo-note', 'Esta sacola é apenas demonstrativa. Nenhum pagamento ou pedido real será enviado.');
  checkout.append(totalRow, note);
  content.append(list, checkout);
}

search.addEventListener('input', renderProducts);
document.querySelector('#open-cart').addEventListener('click', () => {
  renderCart();
  cartDialog.showModal();
});
document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => document.getElementById(button.dataset.close).close());
});
for (const dialog of [cartDialog, productDialog]) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

try {
  products = await getProducts();
  if (!Array.isArray(products)) throw new Error('A API retornou um catálogo inválido.');
  renderCategories();
  renderProducts();
} catch (error) {
  feedback.textContent = `Não foi possível carregar o catálogo: ${error.message}`;
  feedback.classList.add('error');
}
