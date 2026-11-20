import {
  createProduct, deleteProduct, getImageUrl, getProducts, replaceProduct, updateProduct,
} from './api.js';

const form = document.querySelector('#product-form');
const rows = document.querySelector('#product-rows');
const status = document.querySelector('#admin-status');
const saveButton = document.querySelector('#save-product');
const cancelButton = document.querySelector('#cancel-edit');
const fileInput = document.querySelector('#image-file');
let products = [];

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function money(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function stockStatus(product) {
  if (product.stock === 0) return ['Esgotado', 'stock-out'];
  if (product.stock <= product.minStock) return ['Últimas unidades', 'stock-low'];
  return ['Disponível', 'stock-available'];
}

function isValidAmount(amount) {
  return Number.isInteger(amount) && amount >= 1;
}

function cell(row, text) {
  const element = document.createElement('td');
  element.textContent = text;
  row.append(element);
  return element;
}

function actionButton(label, className, action, disabled = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener('click', action);
  return button;
}

function renderRows() {
  rows.replaceChildren();
  for (const product of products) {
    const row = document.createElement('tr');
    const title = document.createElement('td');
    title.className = 'admin-product-name';
    title.textContent = `${product.emoji || '✨'} ${product.name}`;
    row.append(title);
    cell(row, product.category);
    cell(row, money(product.priceCents));
    cell(row, `${product.stock} (mín. ${product.minStock})`);
    const statusCell = document.createElement('td');
    const [label, className] = stockStatus(product);
    const badge = document.createElement('span');
    badge.className = `stock-status ${className}`;
    badge.textContent = label;
    statusCell.append(badge);
    row.append(statusCell);

    const actions = document.createElement('td');
    actions.className = 'admin-actions';
    const amount = Number(document.querySelector('#stock-amount').value);
    actions.append(
      actionButton('Editar', 'table-button', () => startEdit(product)),
      actionButton('+ Estoque', 'table-button', () => changeStock(product, amount), !isValidAmount(amount)),
      actionButton('− Estoque', 'table-button', () => changeStock(product, -amount), !isValidAmount(amount) || product.stock < amount),
      actionButton('Excluir', 'table-button danger-button', () => removeProduct(product)),
    );
    row.append(actions);
    rows.append(row);
  }
}

function field(name) {
  return form.elements.namedItem(name);
}

function startEdit(product) {
  field('id').value = product.id;
  field('name').value = product.name;
  field('category').value = product.category;
  field('price').value = (product.priceCents / 100).toFixed(2);
  field('stock').value = product.stock;
  field('minStock').value = product.minStock;
  field('emoji').value = product.emoji || '✨';
  field('description').value = product.description;
  field('imageUrl').value = product.imageUrl || '';
  document.querySelector('#product-form-title').textContent = 'Editar produto';
  saveButton.textContent = 'Salvar alterações';
  cancelButton.hidden = false;
  field('name').focus();
}

function resetForm() {
  form.reset();
  field('id').value = '';
  field('emoji').value = '✨';
  document.querySelector('#product-form-title').textContent = 'Novo produto';
  saveButton.textContent = 'Salvar produto';
  cancelButton.hidden = true;
  fileInput.value = '';
}

async function changeStock(product, adjustment) {
  // O botão é reabilitado a cada render, mas o valor pode mudar entre o clique e a resposta:
  // repetir a checagem aqui evita gravar estoque negativo ou fracionário na API.
  if (!isValidAmount(Math.abs(adjustment))) {
    setStatus('Informe uma quantidade inteira maior que zero.', true);
    return;
  }
  const nextStock = product.stock + adjustment;
  if (!Number.isInteger(nextStock) || nextStock < 0) {
    setStatus('Quantidade inválida para a baixa de estoque.', true);
    return;
  }
  try {
    const updated = await updateProduct(product.id, { stock: nextStock });
    products = products.map((item) => item.id === product.id ? updated : item);
    renderRows();
    setStatus(`Estoque de "${product.name}" atualizado.`);
  } catch (error) {
    setStatus(`Falha ao atualizar estoque: ${error.message}`, true);
  }
}

async function removeProduct(product) {
  if (!window.confirm(`Excluir "${product.name}" do catálogo?`)) return;
  try {
    await deleteProduct(product.id);
    products = products.filter((item) => item.id !== product.id);
    renderRows();
    setStatus(`Produto "${product.name}" excluído.`);
  } catch (error) {
    setStatus(`Falha ao excluir produto: ${error.message}`, true);
  }
}

async function uploadImage(file) {
  const { cloudinaryCloudName, cloudinaryUploadPreset } = window.APP_CONFIG || {};
  if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
    throw new Error('Configure cloudinaryCloudName e cloudinaryUploadPreset em js/config.js ou informe uma URL HTTPS.');
  }
  // A troca do nome do arquivo ao lado do botão não dispara 'change' se for o mesmo arquivo:
  // limpar o input garante que reenviar a mesma imagem volte a funcionar.
  fileInput.value = '';
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', cloudinaryUploadPreset);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudinaryCloudName)}/image/upload`, {
    method: 'POST',
    body,
  });
  const data = await response.json();
  if (!response.ok || typeof data.secure_url !== 'string') {
    throw new Error(data.error?.message || `Cloudinary respondeu com o status ${response.status}.`);
  }
  return data.secure_url;
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    setStatus('Selecione um arquivo de imagem.', true);
    fileInput.value = '';
    return;
  }
  try {
    setStatus('Enviando imagem ao Cloudinary...');
    field('imageUrl').value = await uploadImage(file);
    setStatus('Imagem enviada. Salve o produto para registrar a URL.');
  } catch (error) {
    setStatus(error.message, true);
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  saveButton.disabled = true;
  const data = new FormData(form);
  const imageUrl = String(data.get('imageUrl') || '').trim();
  if (imageUrl && !getImageUrl(imageUrl)) {
    setStatus('A imagem precisa usar uma URL HTTPS válida.', true);
    saveButton.disabled = false;
    return;
  }
  const product = {
    name: String(data.get('name')).trim(),
    category: String(data.get('category')).trim(),
    description: String(data.get('description')).trim(),
    priceCents: Math.round(Number(data.get('price')) * 100),
    stock: Number(data.get('stock')),
    minStock: Number(data.get('minStock')),
    emoji: String(data.get('emoji') || '✨').trim(),
    imageUrl,
  };
  const id = String(data.get('id') || '');
  try {
    if (id) {
      const current = products.find((item) => String(item.id) === id);
      const updated = await replaceProduct(id, { ...product, id: current.id, badge: current.badge || '' });
      products = products.map((item) => item.id === current.id ? updated : item);
      setStatus(`Produto "${product.name}" atualizado.`);
    } else {
      product.id = `produto-${crypto.randomUUID()}`;
      product.badge = '';
      const created = await createProduct(product);
      products = [...products, created];
      setStatus(`Produto "${product.name}" cadastrado.`);
    }
    resetForm();
    renderRows();
  } catch (error) {
    setStatus(`Falha ao salvar produto: ${error.message}`, true);
  } finally {
    saveButton.disabled = false;
  }
});

cancelButton.addEventListener('click', resetForm);
document.querySelector('#stock-amount').addEventListener('input', renderRows);

try {
  products = await getProducts();
  if (!Array.isArray(products)) throw new Error('A API retornou um catálogo inválido.');
  renderRows();
  setStatus(`${products.length} produtos carregados.`);
} catch (error) {
  setStatus(`Não foi possível carregar o catálogo: ${error.message}`, true);
}
