# Relatório de Infraestrutura — Servidores e Sistemas Operacionais (SSO)

**Projeto Integrado:** Sistema de Gestão de Catálogo e Estoque de Delivery — *Anexo Nerd*
**Disciplinas:** Servidores e Sistemas Operacionais (SSO) & Programação de Sítios Internet (PSI)
**Instituição:** FATEC São Roque
**Responsável por este relatório:** Bryan da Silva

---

## 1. Apresentação

O projeto integrado das disciplinas de SSO e PSI consiste em um sistema web de gestão de catálogo e
estoque de delivery, apoiado por uma infraestrutura de rede local com serviços corporativos e
consumindo uma API hospedada em nuvem.

A identidade da Anexo Nerd celebra a cultura geek e o cinema, reunindo referências a RPG de mesa,
anime, games, ficção científica, fantasia, animações, séries e filmes. A vitrine foi pensada para
fãs que procuram acessórios, presentes e itens colecionáveis ligados a esses universos.

- **SSO:** configuração de um Windows Server (rede interna/Host-Only) provendo DHCP e DNS para o
  domínio local `.empresa.p2.br` e o IIS para hospedagem e testes de serviços; um Windows Cliente com
  duas placas de rede, uma na rede interna e outra em NAT/Bridge para acesso à internet.
- **PSI:** front-end em HTML, CSS e JavaScript puro, publicado no GitHub Pages, consumindo uma API
  json-server publicada no Render.

Este documento registra o roteiro de configuração da infraestrutura, os testes de validação e as
evidências de cada etapa.

> **Campos marcados como _preencher_ devem ser substituídos pelos valores obtidos nas VMs antes da
> exportação para PDF.** As seções descrevem o procedimento executado no laboratório; as evidências
> (capturas de tela) são a comprovação de que cada etapa foi concluída.

## 2. Identificação do laboratório

| Item | Valor |
| --- | --- |
| Grupo/empresa | _preencher_ |
| Integrantes | Bryan da Silva; _incluir demais integrantes, se houver_ |
| Domínio local | _preencher_ (sufixo `empresa.p2.br`) |
| Windows Server (versão) | _preencher_ |
| Windows Cliente (versão) | _preencher_ |
| Hipervisor utilizado | _preencher_ (VirtualBox / VMware / Hyper-V) |
| Rede interna (Host-Only) e faixa | _preencher_ |
| IP estático do servidor | _preencher_ |
| Escopo DHCP (início, fim, máscara, exclusões) | _preencher_ |
| URL da API no Render | _preencher_ |
| URL do GitHub Pages | _preencher_ |

Convenção de nomes sugerida para as capturas: servidor `srv-<grupo>.empresa.p2.br` e cliente
`cli-<grupo>.empresa.p2.br`. Personalizar o nome da empresa nas telas facilita a identificação das
evidências do grupo.

## 3. Arquitetura de rede

```text
┌────────────────────────────────┐          ┌──────────────────────────────────┐
│ Windows Server                 │          │ Windows Cliente                  │
│ Rede interna / Host-Only       │◄────────►│ Placa 1: rede interna            │
│ IP estático fora do escopo DHCP│          │ IP + DNS obtidos via DHCP        │
│ Serviços: DHCP · DNS · IIS     │          │ Placa 2: NAT / Bridge            │
└────────────────────────────────┘          └───────────────┬──────────────────┘
                                                            │ Internet
                                                            ▼
                                               API json-server hospedada no Render
                                               Front-end publicado no GitHub Pages
```

O cliente usa a placa interna para obter IP do servidor e resolver os nomes do domínio
`.empresa.p2.br`, e a placa externa para alcançar a internet e consumir a API no Render, servida por
HTTPS.

## 4. Configuração do Windows Server

### 4.1 Preparação da máquina e da rede interna

1. Criar a VM do servidor no hipervisor com um adaptador na rede interna (Host-Only) e nomear a VM
   com o padrão do grupo.
2. Em **Configurações de Rede** → adaptador da rede interna → **Propriedades** → **Protocolo
   Internet Versão 4 (TCP/IPv4)**, definir **IP estático** fora do intervalo de concessão do DHCP,
   máscara da rede interna e DNS apontando para o próprio servidor.
3. Renomear o computador com o padrão do grupo e reiniciar.

> O IP do servidor deve ficar **fora** da faixa que o DHCP distribuirá, para evitar conflitos de
> endereço.

### 4.2 DHCP

1. **Gerenciador do Servidor** → **Adicionar funções e recursos** → marcar **DHCP Server** e
   concluir a instalação.
2. Em **Completar configuração do DHCP**, criar o grupo de segurança e autorizar o servidor (ou
   executar `Add-DhcpServerInDC`).
3. No console **DHCP**, criar o **escopo** com:
   - faixa de IPs (início e fim) coerente com a rede interna;
   - máscara de sub-rede;
   - exclusões para o IP do servidor e endereços reservados;
   - duração da concessão adequada ao laboratório.
4. Configurar as **opções do escopo**:
   - **003 Router** — gateway da rede interna, se houver;
   - **006 DNS Servers** — IP interno do servidor;
   - **015 DNS Domain Name** — domínio local (`empresa.p2.br`).
5. **Autorizar** e **ativar** o escopo.

Comandos úteis para conferir a configuração:

```powershell
Get-DhcpServerv4Scope
Get-DhcpServerv4OptionValue -ScopeId <escopo>
Get-DhcpServerv4Lease -ScopeId <escopo>
```

**Evidências:** tela do escopo com faixa e duração; opções do escopo (003/006/015); status
*Ativo* do escopo.

### 4.3 DNS

1. Adicionar a função **DNS Server**.
2. No console **DNS**, criar a **zona de pesquisa direta** para `empresa.p2.br` (zona primária
   integrada ao AD, caso o servidor seja controlador de domínio).
3. Criar os registros:
   - registro **A** do servidor (`srv-<grupo>.empresa.p2.br` → IP interno);
   - registro **A** (ou **CNAME**) do site do IIS apontando para o servidor.
4. Em **Propriedades do servidor DNS → Encaminhadores**, configurar encaminhadores para a internet,
   permitindo que o cliente resolva nomes externos (inclusive o domínio do Render).
5. Testar no próprio servidor:

```powershell
Resolve-DnsName srv-<grupo>.empresa.p2.br
nslookup www.google.com 127.0.0.1
```

**Evidências:** zona de pesquisa direta criada; registros A do servidor e do site; encaminhadores
configurados; resultado do `nslookup`.

### 4.4 IIS

1. Adicionar a função **Web Server (IIS)** com os recursos padrão.
2. No **Gerenciador do IIS**, criar um site de teste com:
   - caminho físico contendo uma página `index.html` personalizada com o nome da empresa/grupo;
   - **binding** HTTP na porta 80 com o nome interno (ex.: `srv-<grupo>.empresa.p2.br`).
3. Em **Firewall do Windows com Segurança Avançada**, liberar a porta 80 apenas para a rede interna.
4. Testar no servidor em `http://localhost` e em `http://srv-<grupo>.empresa.p2.br`.

**Evidências:** tela de funções com o IIS instalado; site criado com o binding; página do IIS aberta
no navegador.

### 4.5 Checklist do servidor

- [ ] Adaptador interno/Host-Only conectado à rede correta.
- [ ] IPv4 estático definido fora do intervalo de concessões DHCP.
- [ ] Função DHCP instalada e escopo autorizado/ativo.
- [ ] Opções do escopo: máscara, gateway adequado, DNS interno e sufixo DNS.
- [ ] Função DNS instalada e zona de pesquisa direta para o domínio local criada.
- [ ] Registro A do servidor e registros necessários para os serviços internos verificados.
- [ ] Encaminhadores DNS configurados para nomes externos.
- [ ] IIS instalado; site de teste publicado e vinculado ao nome interno.
- [ ] Regras de firewall limitadas aos serviços e redes do laboratório.

## 5. Configuração do Windows Cliente

### 5.1 Placas de rede

1. Na VM do cliente, manter **dois adaptadores**:
   - **Placa 1 — rede interna / Host-Only**, em **Obter um endereço IP automaticamente** e **Obter
     os endereços dos servidores DNS automaticamente**;
   - **Placa 2 — NAT / Bridge**, obtendo IP automaticamente pela rede virtual do hipervisor.
2. Se as duas placas oferecerem rota padrão, ajustar a **métrica da interface** para que a internet
   saia pela placa externa e o domínio interno continue sendo resolvido pelo DNS do servidor.
3. Reiniciar a rede (ou `ipconfig /renew`) para receber a concessão do servidor.

### 5.2 Testes no cliente

```powershell
ipconfig /all
Resolve-DnsName srv-<grupo>.empresa.p2.br
Test-NetConnection srv-<grupo>.empresa.p2.br -Port 80
Test-NetConnection <servico-render> -Port 443
```

- `ipconfig /all` deve mostrar **DHCP habilitado**, o IP concedido na faixa do escopo, o sufixo DNS
  `empresa.p2.br` e o servidor DNS com o IP interno.
- `Resolve-DnsName` deve devolver o IP interno do servidor.
- O navegador deve abrir o site do IIS pelo nome DNS interno.
- O navegador deve abrir a internet e o endpoint `/products` da API no Render.

### 5.3 Checklist do cliente

- [ ] Placa 1 conectada à rede interna e configurada para obter IPv4/DNS via DHCP.
- [ ] Placa 2 conectada em NAT/Bridge para acesso à Internet.
- [ ] `ipconfig /all` confirma concessão DHCP e servidores DNS esperados.
- [ ] Nome do servidor no domínio local resolve para o IP interno.
- [ ] Site IIS acessível pelo nome DNS interno.
- [ ] Internet acessível pela placa externa.
- [ ] Endpoint público `/products` da API no Render acessível pelo navegador.

**Evidências:** configuração das duas placas; `ipconfig /all`; resolução DNS interna; página do IIS;
página JSON da API no Render.

## 6. Testes de validação integrados

| Teste | Comando / ação | Resultado esperado | Evidência |
| --- | --- | --- | --- |
| Concessão DHCP | `ipconfig /all` no cliente | IP, sufixo DNS e servidor DNS concedidos | _preencher_ |
| Resolução interna | `Resolve-DnsName srv-<grupo>.empresa.p2.br` | Responde com o IP interno | _preencher_ |
| Serviço IIS | Navegador em `http://srv-<grupo>.empresa.p2.br` | Página personalizada do IIS | _preencher_ |
| Internet | Navegador em `https://www.google.com` | Página carrega pela placa externa | _preencher_ |
| API no Render | Navegador em `https://<api>/products` | JSON com o catálogo | _preencher_ |
| Integração | Vitrine publicada no GitHub Pages | Catálogo carregado da API Render | _preencher_ |

Registre o resultado, a data e qual VM executou cada teste. Não inclua senhas ou tokens nas
capturas.

## 7. Integração com a aplicação (PSI)

A vitrine e o painel administrativo são estáticos (HTML, CSS e JavaScript puro) e não dependem do
IIS para funcionar. O IIS é utilizado como serviço interno de hospedagem e testes exigido pela
atividade de SSO; a publicação da vitrine é feita pelo **GitHub Pages**, e o catálogo é servido pela
API json-server publicada no **Render**. O endereço da API é configurado em `js/config.js`
(`apiBaseUrl`).

## 8. Exportação e entrega

1. Complete os campos _preencher_ e marque somente o que foi testado.
2. Insira capturas originais, legíveis, com contexto suficiente para identificar VM e etapa.
3. Exporte este relatório preenchido para PDF.
4. Anexe o PDF à Issue de SSO do repositório e registre o link.

> Não publique o PDF até substituir os campos pendentes e anexar evidências reais.
