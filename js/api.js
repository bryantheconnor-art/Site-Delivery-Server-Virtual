const apiBaseUrl = window.APP_CONFIG?.apiBaseUrl?.replace(/\/+$/, '');

if (!apiBaseUrl) {
  throw new Error('Configure apiBaseUrl em js/config.js antes de usar a aplicação.');
}

export async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `A API respondeu com o status ${response.status}.`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function getStaticCatalog() {
  const response = await fetch('./api/db.json');
  if (!response.ok) throw new Error('O catálogo local não pôde ser carregado.');
  return response.json();
}

export async function getProducts() {
  try {
    return await request('/products?_sort=name');
  } catch (error) {
    const catalog = await getStaticCatalog();
    if (!Array.isArray(catalog.products)) throw error;
    return [...catalog.products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }
}

export async function getDelivery() {
  try {
    return await request('/delivery');
  } catch (error) {
    const catalog = await getStaticCatalog();
    if (!catalog.delivery) throw error;
    return catalog.delivery;
  }
}
export const createProduct = (product) =>
  request('/products', { method: 'POST', body: JSON.stringify(product) });
export const replaceProduct = (id, product) =>
  request(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(product) });
export const updateProduct = (id, changes) =>
  request(`/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(changes) });
export const deleteProduct = (id) =>
  request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });

export function getImageUrl(value) {
  if (!value) return '';
  const localImage = /^(?:\.\/)?(?:imagens|assets)\/[a-z0-9._-]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
  if (localImage.test(value)) return new URL(value, document.baseURI).href;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}
