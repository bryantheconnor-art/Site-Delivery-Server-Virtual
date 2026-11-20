# Roteiro de evidências — SSO

> **Versão completa deste roteiro:** [`relatorio-sso.md`](./relatorio-sso.md), também gerado em PDF em
> [`relatorio-sso.pdf`](./relatorio-sso.pdf). Este arquivo mantém o resumo original; use o relatório
> completo como documento principal da entrega.

---

**Projeto Integrado:** Sistema de Gestão de Catálogo e Estoque de Delivery
**Disciplinas:** Servidores e Sistemas Operacionais (SSO) & Programação de Sítios Internet (PSI)
**FATEC São Roque**

Este relatório descreve o passo a passo da configuração do ambiente de laboratório (rede interna,
DHCP, DNS, IIS e testes no cliente) e deve ser acompanhado das capturas de tela do ambiente real.

> **Campos marcados como _preencher_ devem ser substituídos pelos valores obtidos nas VMs antes da
> exportação para PDF.** Nenhuma configuração abaixo é afirmada como executada: ela descreve o
> roteiro seguido no laboratório e precisa ser comprovada pelas evidências.

## 1. Identificação do laboratório

| Item | Valor |
| --- | --- |
| Grupo/empresa | _preencher_ |
| Domínio local | _preencher_ (sufixo `empresa.p2.br`) |
| Windows Server (versão) | _preencher_ |
| Windows Cliente (versão) | _preencher_ |
| Rede interna (Host-Only) e faixa | _preencher_ |
| IP estático do servidor | _preencher_ |
| Escopo DHCP (início, fim, máscara, exclusões) | _preencher_ |
| URL da API no Render testada | _preencher_ |

Sugestão de convenção de nomes usada nas capturas: servidor `srv-<grupo>.empresa.p2.br` e cliente
`cli-<grupo>.empresa.p2.br`. Personalizar o nome da empresa nas telas facilita a identificação das
evidências do grupo.

## 2. Desenho da arquitetura

```text
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  Windows Server              │        │  Windows Cliente             │
│  Rede interna / Host-Only    │◄──────►│  Placa 1: rede interna       │
│  IP estático (ex.: 192.168.x.10) │    │  IP via DHCP + DNS interno   │
│  DHCP · DNS · IIS            │        │  Placa 2: NAT / Bridge       │
└──────────────────────────────┘        └──────────────┬───────────────┘
                                                       │ Internet
                                                       ▼
                                          API json-server hospedada no Render
```

O cliente precisa de duas placas: a interna (Host-Only) para obter IP do servidor e resolver o
domínio `.empresa.p2.br`, e a externa (NAT/Bridge) para alcançar a internet e consumir a API no
Render, que é servida por HTTPS.

## 3. Configuração do Windows Server

### 3.1 IP estático na rede interna

1. Abrir **Configurações de Rede** → adaptador da rede interna → **Propriedades** → **IPv4**.
2. Definir IP estático **fora do intervalo de concessão do DHCP**, máscara da rede interna e,
   quando aplicável, gateway e DNS apontando para o próprio servidor.
3. Nomear o computador com o padrão do grupo e reiniciar.

### 3.2 Instalação do DHCP

1. **Gerenciador do Servidor** → **Adicionar funções e recursos** → função **DHCP Server**.
2. Após a instalação, **Completar configuração do DHCP**: criar grupo de segurança e autorizar o
   servidor no Active Directory (ou executar `Add-DhcpServerInDC`).
3. No console **DHCP**, criar um **escopo** com:
   - faixa de IPs (início e fim) coerente com a rede interna;
   - máscara de sub-rede;
   - exclusões para o IP do servidor e endereços reservados;
   - duração da concessão adequada ao laboratório.
4. Configurar as **opções do escopo**:
   - **003 Router** (gateway da rede interna, se houver);
   - **006 DNS Servers** com o IP interno do servidor;
   - **015 DNS Domain Name** com o domínio local (`empresa.p2.br`).
5. **Autorizar** e **ativar** o escopo.

Comandos úteis para conferir:

```powershell
Get-DhcpServerv4Scope
Get-DhcpServerv4OptionValue -ScopeId <escopo>
Get-DhcpServerv4Lease -ScopeId <escopo>
```

### 3.3 Instalação e configuração do DNS

1. Adicionar a função **DNS Server**.
2. No console **DNS**, criar **zona de pesquisa direta** para `empresa.p2.br` (zona primária
   integrada ao AD, se o servidor for controlador de domínio).
3. Criar os registros necessários:
   - registro **A** do servidor (`srv-<grupo>.empresa.p2.br` → IP interno);
   - registro **A** (ou **CNAME**) do site IIS, apontando para o servidor.
4. Em **Propriedades do servidor DNS → Encaminhadores**, configurar encaminhadores para a internet,
   permitindo que o cliente resolva nomes externos (como o domínio do Render).
5. Testar localmente:

```powershell
Resolve-DnsName srv-<grupo>.empresa.p2.br
nslookup www.google.com 127.0.0.1
```

### 3.4 Instalação e configuração do IIS

1. Adicionar a função **Web Server (IIS)** com os recursos padrão.
2. Em **Gerenciador do IIS**, criar um site de teste:
   - caminho físico com uma página `index.html` personalizada com o nome da empresa/grupo;
   - **binding** HTTP na porta 80 com o nome interno (ex.: `srv-<grupo>.empresa.p2.br`).
3. Em **Regras de Firewall do Windows**, liberar a porta 80 apenas para a rede interna.
4. Testar no próprio servidor: `http://localhost` e `http://srv-<grupo>.empresa.p2.br`.

### 3.5 Checklist do servidor

- [ ] Adaptador interno/Host-Only conectado à rede correta.
- [ ] IPv4 estático definido fora do intervalo de concessões DHCP.
- [ ] Função DHCP instalada e escopo autorizado/ativo.
- [ ] Opções do escopo: máscara, gateway adequado, DNS interno e sufixo DNS.
- [ ] Função DNS instalada e zona de pesquisa direta para o domínio local criada.
- [ ] Registro A do servidor e registros necessários para os serviços internos verificados.
- [ ] Encaminhadores DNS configurados para nomes externos.
- [ ] IIS instalado; site de teste publicado e vinculado ao nome interno.
- [ ] Regras de firewall limitadas aos serviços e redes do laboratório.

**Evidências a inserir no PDF:** IPv4 do servidor; escopo e opções DHCP; zona/registro DNS; site e
vínculo do IIS; teste local no navegador.

## 4. Configuração do Windows Cliente

1. **Placa 1 (rede interna / Host-Only):** manter **Obter um endereço IP automaticamente** e
   **Obter os endereços dos servidores DNS automaticamente**.
2. **Placa 2 (NAT / Bridge):** obter IP automaticamente pela rede virtual do hipervisor, garantindo
   acesso à internet. Se as duas placas oferecerem rota padrão, conferir a métrica da interface para
   que a internet saia pela placa externa e o domínio interno seja resolvido pela placa interna.
3. Testar:

```powershell
ipconfig /all
Resolve-DnsName srv-<grupo>.empresa.p2.br
Test-NetConnection srv-<grupo>.empresa.p2.br -Port 80
Test-NetConnection <servico-render> -Port 443
```

### 4.1 Checklist do cliente

- [ ] Placa 1 conectada à rede interna e configurada para obter IPv4/DNS via DHCP.
- [ ] Placa 2 conectada em NAT/Bridge para acesso à Internet.
- [ ] `ipconfig /all` confirma concessão DHCP e servidores DNS esperados.
- [ ] Nome do servidor no domínio local resolve para o IP interno.
- [ ] Site IIS acessível pelo nome DNS interno.
- [ ] Internet acessível pela placa externa.
- [ ] Endpoint público `/products` da API no Render acessível pelo navegador.

**Evidências a inserir no PDF:** configuração das duas placas; `ipconfig /all`; resolução DNS
interna; página do IIS; página JSON da API no Render.

## 5. Testes de validação integrados

| Teste | Comando / ação | Resultado esperado | Evidência |
| --- | --- | --- | --- |
| Concessão DHCP | `ipconfig /all` no cliente | IP, gateway e DNS concedidos pelo servidor | _preencher_ |
| Resolução interna | `Resolve-DnsName srv-<grupo>.empresa.p2.br` | Responde com o IP interno | _preencher_ |
| Serviço IIS | Navegador em `http://srv-<grupo>.empresa.p2.br` | Página personalizada do IIS | _preencher_ |
| Internet | Navegador em `https://www.google.com` | Página carrega pela placa externa | _preencher_ |
| API no Render | Navegador em `https://<api>/products` | JSON com o catálogo | _preencher_ |
| Integração | Vitrine publicada no GitHub Pages | Catálogo carregado da API Render | _preencher_ |

Registre o resultado, a data e qual VM executou cada teste. Não inclua senhas ou tokens nas
capturas.

## 6. Exportação e entrega

1. Complete os campos _preencher_ e marque somente o que foi testado.
2. Insira capturas originais, legíveis, com contexto suficiente para identificar VM e etapa.
3. Exporte este relatório preenchido para PDF.
4. Anexe o PDF à Issue de SSO do repositório e registre o link.

> Não publique o PDF até substituir os campos pendentes e anexar evidências reais.
