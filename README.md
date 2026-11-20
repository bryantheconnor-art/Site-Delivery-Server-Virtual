# Nexo Geek

Loja demonstrativa de produtos de RPG, anime e cultura geek, feita com React, JavaScript e Node.js. O projeto inclui uma API simples para catálogo e pedidos; não processa pagamentos nem salva pedidos permanentemente.

## Executar localmente

Requisitos: Node.js 24 ou superior e npm.

```powershell
npm install
npm run dev:api
```

Em outro terminal, na mesma pasta:

```powershell
npm run dev
```

Abra <http://localhost:5173>. O Vite encaminha as chamadas `/api` para a API na porta 3001.

## Executar com Docker

Com o Docker Desktop iniciado, na pasta do projeto:

```powershell
docker compose up --build -d
```

Acesse <http://localhost:3000>. Para parar o site:

```powershell
docker compose down
```

## Acessar em uma máquina virtual

Instale Docker Engine/Docker Compose na VM, copie ou clone este repositório e execute `docker compose up --build -d` na pasta do projeto. Libere a porta TCP 3000 no firewall da VM e acesse `http://IP_DA_VM:3000` pela rede autorizada. Não exponha a porta publicamente sem configurar firewall, HTTPS e os controles de segurança necessários.

## Verificações

```powershell
npm test
npm run build
```

Os pedidos são apenas demonstrativos e ficam em memória durante a resposta da API. Não há banco de dados, login ou integração de pagamento.
