import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const jsonServer = require('json-server');
const directory = path.dirname(fileURLToPath(import.meta.url));

export function createApp(databaseFile = process.env.DB_FILE || path.join(directory, 'db.json')) {
  const app = jsonServer.create();
  app.use(jsonServer.defaults());
  app.use(jsonServer.router(databaseFile));
  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3001;
  createApp().listen(port, '0.0.0.0', () => {
    console.log(`API Nexo Geek disponível na porta ${port}.`);
  });
}
