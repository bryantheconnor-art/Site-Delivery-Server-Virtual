import assert from 'node:assert/strict';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createApp } from '../api/server.js';

const catalogPath = fileURLToPath(new URL('../api/db.json', import.meta.url));

test('catálogo JSON tem IDs únicos e níveis de estoque válidos', async () => {
  const { products } = JSON.parse(await readFile(catalogPath, 'utf8'));
  const ids = products.map(({ id }) => id);

  assert.ok(products.length > 0);
  assert.equal(new Set(ids).size, ids.length);
  for (const product of products) {
    assert.equal(typeof product.name, 'string');
    assert.ok(Number.isInteger(product.priceCents) && product.priceCents > 0);
    assert.ok(Number.isInteger(product.stock) && product.stock >= 0);
    assert.ok(Number.isInteger(product.minStock) && product.minStock >= 0);
  }
  assert.ok(products.some(({ stock }) => stock === 0));
  assert.ok(products.some(({ stock, minStock }) => stock > 0 && stock <= minStock));
});

test('API json-server permite listar, cadastrar, atualizar e excluir produtos', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'nexo-geek-api-'));
  const database = path.join(directory, 'db.json');
  await copyFile(catalogPath, database);
  const server = createApp(database).listen(0, '127.0.0.1');
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  });
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const listResponse = await fetch(`${baseUrl}/products`);
  const listed = await listResponse.json();
  assert.equal(listResponse.status, 200);
  assert.equal(listed.length, 6);

  const createResponse = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'test-product', name: 'Produto de teste', category: 'Geek', description: 'Item temporário',
      priceCents: 1000, stock: 2, minStock: 1, emoji: '✨', imageUrl: '',
    }),
  });
  assert.equal(createResponse.status, 201);

  const updateResponse = await fetch(`${baseUrl}/products/test-product`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock: 0 }),
  });
  assert.equal(updateResponse.status, 200);
  assert.equal((await updateResponse.json()).stock, 0);

  const deleteResponse = await fetch(`${baseUrl}/products/test-product`, { method: 'DELETE' });
  assert.ok(deleteResponse.ok);
  assert.equal(JSON.parse(await readFile(database, 'utf8')).products.length, 6);
});
