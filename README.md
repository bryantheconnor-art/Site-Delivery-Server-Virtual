# Nexo Geek - Bryan da Silva 
Atividade SSO - Professor Leonid

Loja demonstrativa de itens de RPG, anime e cultura geek. A vitrine e o painel administrativo usam HTML, CSS e JavaScript puro; o catálogo e o estoque são servidos pelo json-server.

## Executar localmente

Requisitos: Node.js 24 ou superior e npm.

Instale as dependências:

```powershell
npm install
npm --prefix api install
```

Inicie a API em um terminal:

```powershell
npm run dev:api
```

Inicie o site em outro terminal:

```powershell
npm run dev
```

Abra <http://localhost:5173>. A API fica em <http://localhost:3001/products>. O arquivo `js/config.js` define o endereço da API e as opções do Cloudinary.

## Recursos

- Busca de produtos e filtros de categoria gerados a partir do catálogo.
- Status de estoque: disponível, últimas unidades e esgotado.
- Detalhes de produto e sacola demonstrativa, sem pagamentos ou pedidos reais.
- Painel `admin.html` com cadastro, edição, exclusão e entrada/baixa de estoque.
- Upload de imagens opcional pelo Cloudinary. Configure `cloudinaryCloudName` e `cloudinaryUploadPreset` em `js/config.js`; use um preset unsigned restrito. Também é possível informar diretamente uma URL HTTPS.

## Docker

Na raiz do projeto:

```powershell
docker compose up --build -d
```

Vitrine: <http://localhost:3000>. API: <http://localhost:3001/products>. Para encerrar:

```powershell
docker compose down
```

O serviço `api` também pode ser publicado separadamente no Render usando a pasta `api` como *Root Directory* e o ambiente Docker. Configure `apiBaseUrl` em `js/config.js` com a URL HTTPS pública da API antes de publicar a vitrine. O passo a passo está em [`docs/render-deploy.md`](./docs/render-deploy.md).

## GitHub Pages e VM

O workflow `.github/workflows/pages.yml` publica a vitrine e o painel quando há push para `main`. No GitHub, habilite *Settings → Pages → Build and deployment → GitHub Actions*. Antes da publicação, configure a URL pública HTTPS da API Render em `js/config.js`. GitHub Pages não hospeda o json-server; a API precisa estar em outro serviço.

Para executar em uma VM com Docker, clone o repositório e use `docker compose up --build -d`. Libere apenas as portas necessárias na rede autorizada. O json-server deste projeto é uma API de demonstração sem autenticação e permite alterar o catálogo; não use dados reais nem o exponha publicamente sem controles de acesso apropriados.

O roteiro da atividade de infraestrutura está em [`docs/SSO-checklist.md`](./docs/SSO-checklist.md) e o relatório completo (Markdown e PDF) em [`docs/relatorio-sso.md`](./docs/relatorio-sso.md). DHCP, DNS, IIS e a configuração das VMs precisam ser realizados e comprovados no ambiente real; o repositório não afirma que esses serviços já estejam configurados. Preencha o roteiro com os dados do laboratório, inclua capturas e exporte o PDF para anexar à Issue pertinente.

## Cloudinary

O endereço do console não é o `cloud_name` nem o nome do preset. Obtenha o cloud name no painel de detalhes da conta e crie/consulte um preset de upload *unsigned* em **Settings → Upload → Upload presets**. Preencha somente esses dois valores públicos em `js/config.js`; nunca coloque a API secret no front-end. A URL de `apiBaseUrl` deve ser a URL do serviço json-server no Render, não uma página de documentação.

## Verificações

```powershell
npm test
```

O catálogo inicial contém seis produtos demonstrativos. Alterações feitas pelo painel persistem em `api/db.json` no ambiente local; em hospedagem de contêiner, o arquivo pode ser restaurado ao reiniciar ou recriar o contêiner.
