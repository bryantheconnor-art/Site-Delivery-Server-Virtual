import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp, products } from '../server/index.js';

let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('lista produtos de RPG, anime e cultura geek', async () => {
  const response = await fetch(`${baseUrl}/api/products`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(new Set(data.products.map((product) => product.category)), new Set(['RPG', 'Anime', 'Geek']));
});

test('cria pedido e calcula o total usando o catálogo do servidor', async () => {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Aventureira',
      customerEmail: 'aventura@example.com',
      customerAddress: 'Rua das Estrelas, 42',
      items: [{ productId: products[0].id, quantity: 2 }],
    }),
  });
  const order = await response.json();

  assert.equal(response.status, 201);
  assert.equal(order.totalCents, products[0].priceCents * 2);
  assert.equal(order.items[0].quantity, 2);
  assert.equal(order.customerAddress, 'Rua das Estrelas, 42');
  assert.ok(order.orderId);
});

test('exige endereço de entrega', async () => {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Aventureira',
      customerEmail: 'aventura@example.com',
      customerAddress: '',
      items: [{ productId: products[0].id, quantity: 1 }],
    }),
  });

  assert.equal(response.status, 400);
});

test('rejeita itens desconhecidos ou quantidades inválidas', async () => {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Aventureira',
      customerEmail: 'aventura@example.com',
      customerAddress: 'Rua das Estrelas, 42',
      items: [{ productId: 'item-inexistente', quantity: 1 }],
    }),
  });

  assert.equal(response.status, 400);
});

test('rejeita e-mail excessivamente longo', async () => {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Aventureira',
      customerEmail: `${'a'.repeat(115)}@example.com`,
      customerAddress: 'Rua das Estrelas, 42',
      items: [{ productId: products[0].id, quantity: 1 }],
    }),
  });

  assert.equal(response.status, 400);
});

test('retorna JSON para endpoints da API inexistentes', async () => {
  const response = await fetch(`${baseUrl}/api/inexistente`);
  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.error, 'Endpoint da API não encontrado.');
});

test('rejeita JSON malformado', async () => {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"customerName":',
  });
  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.error, 'O corpo da requisição deve ser um JSON válido.');
});
