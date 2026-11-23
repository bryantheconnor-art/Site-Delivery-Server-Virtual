# Publicação da API no Render

O front-end é estático (GitHub Pages) e não hospeda o json-server. A API vive em um serviço Docker
no Render, a partir da pasta `api/` deste repositório.

## 1. Antes de criar o serviço

- A pasta `api/` contém `Dockerfile`, `server.js`, `db.json`, `package.json` e `package-lock.json`.
- O servidor escuta na porta de `process.env.PORT` (o Render injeta a porta automaticamente).
- Não é necessário definir nenhuma variável de ambiente obrigatória. `DB_FILE` é opcional e só serve
  para apontar outro arquivo de banco.

## 2. Criar o Web Service

1. Entrar em <https://dashboard.render.com> → **New +** → **Web Service**.
2. Conectar o repositório `bryantheconnor-art/Site-Delivery-Server-Virtual`.
3. Preencher:

| Campo | Valor |
| --- | --- |
| Name | `anexo-nerd-api` (ou outro nome livre) |
| Language / Runtime | **Docker** |
| Branch | `main` |
| Root Directory | `api` |
| Region | a mais próxima (ex.: Ohio) |
| Instance Type | Free |
| Auto-Deploy | **Yes** (cada push em `main` recompila) |

4. Clicar em **Deploy Web Service** e acompanhar o log até `API Anexo Nerd disponível na porta ...`.

## 3. Conferir a publicação

Troque `<url>` pela URL HTTPS que o Render mostrar no topo do serviço
(`https://anexo-nerd-api.onrender.com`, por exemplo):

```bash
curl https://<url>/products
```

O retorno deve ser o JSON com os oito produtos de `api/db.json`.

## 4. Conectar o front-end

Edite `js/config.js` e coloque a URL pública (sem barra final):

```js
window.APP_CONFIG = {
  apiBaseUrl: 'https://<url>',
  cloudinaryCloudName: '',
  cloudinaryUploadPreset: '',
};
```

Enquanto `apiBaseUrl` for `http://localhost:3001`, a vitrine publicada no GitHub Pages não carrega
o catálogo: o navegador bloqueia requisições HTTP vindas de uma página HTTPS.

## 5. Limitações do plano Free

- **Disco efêmero:** `db.json` volta ao conteúdo do repositório quando o serviço reinicia ou é
  redesenhado. Produtos cadastrados pelo painel se perdem. Para um catálogo que persiste, é preciso
  um disco pago ou outro banco.
- **Suspensão por inatividade:** o serviço dorme após alguns minutos sem acesso; a primeira
  requisição depois disso demora até ~50 segundos.
- **Sem autenticação:** o json-server aceita `POST`, `PUT`, `PATCH` e `DELETE` de qualquer origem.
  Não use dados reais e apague ou altere produtos apenas pelo painel da demonstração.

## 6. Atualizar o catálogo publicado

`api/db.json` é a fonte inicial do catálogo. Para publicar mudanças permanentes, edite o arquivo,
faça commit em `main` e deixe o auto-deploy recompilar o serviço.
