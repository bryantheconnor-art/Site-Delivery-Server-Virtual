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

export const getProducts = () => request('/products?_sort=name');
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
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}
