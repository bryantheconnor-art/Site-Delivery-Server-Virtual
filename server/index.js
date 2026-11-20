import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const directory = path.dirname(fileURLToPath(import.meta.url));

export const products = [
  {
    id: 'dice-set',
    name: 'Dados do aventureiro',
    category: 'RPG',
    description: 'Conjunto de 7 dados para sua próxima campanha.',
    priceCents: 4590,
    emoji: '🎲',
    badge: 'Mais pedido',
  },
  {
    id: 'dragon-notebook',
    name: 'Diário do mestre',
    category: 'RPG',
    description: 'Caderno para mapas, fichas e grandes histórias.',
    priceCents: 5890,
    emoji: '📓',
    badge: 'Para sua mesa',
  },
  {
    id: 'cat-figure',
    name: 'Figure gato mágico',
    category: 'Anime',
    description: 'Um toque de fantasia para sua estante.',
    priceCents: 8990,
    emoji: '🐈‍⬛',
    badge: 'Novo',
  },
  {
    id: 'manga-kit',
    name: 'Kit leitura manga',
    category: 'Anime',
    description: 'Marcador e acessórios para acompanhar sua coleção.',
    priceCents: 3990,
    emoji: '📚',
    badge: '',
  },
  {
    id: 'space-mug',
    name: 'Caneca missão espacial',
    category: 'Geek',
    description: 'Café e ficção científica combinam demais.',
    priceCents: 6490,
    emoji: '🚀',
    badge: 'Favorito',
  },
  {
    id: 'pixel-lamp',
    name: 'Luminária pixel',
    category: 'Geek',
    description: 'Luz aconchegante para sua área de jogos.',
    priceCents: 11990,
    emoji: '👾',
    badge: '',
  },
];

const productById = new Map(products.map((product) => [product.id, product]));

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '20kb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.get('/api/products', (_request, response) => {
    response.json({ products });
  });

  app.post('/api/orders', (request, response) => {
    const { customerName, customerEmail, customerAddress, items } = request.body ?? {};

    if (
      typeof customerName !== 'string' ||
      customerName.trim().length < 2 ||
      customerName.trim().length > 80 ||
      typeof customerEmail !== 'string' ||
      customerEmail.trim().length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()) ||
      typeof customerAddress !== 'string' ||
      customerAddress.trim().length < 5 ||
      customerAddress.trim().length > 160 ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > products.length
    ) {
      return response.status(400).json({ error: 'Confira seus dados e os itens do pedido.' });
    }

    const quantities = new Map();
    for (const item of items) {
      if (
        !item ||
        typeof item.productId !== 'string' ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return response.status(400).json({ error: 'Um ou mais itens do pedido são inválidos.' });
      }

      const currentQuantity = (quantities.get(item.productId) ?? 0) + item.quantity;
      if (!productById.has(item.productId) || currentQuantity > 99) {
        return response.status(400).json({ error: 'Um ou mais itens do pedido são inválidos.' });
      }
      quantities.set(item.productId, currentQuantity);
    }

    const orderItems = [...quantities].map(([productId, quantity]) => {
      const product = productById.get(productId);
      return {
        productId,
        name: product.name,
        quantity,
        subtotalCents: product.priceCents * quantity,
      };
    });

    response.status(201).json({
      orderId: randomUUID(),
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      createdAt: new Date().toISOString(),
      items: orderItems,
      totalCents: orderItems.reduce((total, item) => total + item.subtotalCents, 0),
    });
  });

  app.use(express.static(path.resolve(directory, '../dist')));
  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'Endpoint da API não encontrado.' });
  });
  app.use((request, response, next) => {
    if (request.method !== 'GET' || request.path.startsWith('/api/')) {
      return next();
    }
    return response.sendFile(path.resolve(directory, '../dist/index.html'), (error) => {
      if (error) next(error);
    });
  });
  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);

    if (error?.type === 'entity.parse.failed') {
      return response.status(400).json({ error: 'O corpo da requisição deve ser um JSON válido.' });
    }

    console.error(error);
    return response.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  });

  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3001;
  createApp().listen(port, '0.0.0.0', () => {
    console.log(`Nexo Geek disponível na porta ${port}.`);
  });
}
