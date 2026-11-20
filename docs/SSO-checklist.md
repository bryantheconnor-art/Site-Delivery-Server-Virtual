# Roteiro de evidências — SSO

Este roteiro organiza a entrega de infraestrutura. Ele não comprova configurações: preencha os campos e anexe capturas feitas nas VMs reais antes de exportar o relatório para PDF.

## Identificação do laboratório

- Grupo/empresa: **preencher**
- Domínio local: **preencher** (sufixo previsto: `empresa.p2.br`)
- Windows Server e versão: **preencher**
- Windows Cliente e versão: **preencher**
- Rede interna/Host-Only e faixa: **preencher**
- IP estático do servidor: **preencher**
- Escopo DHCP (início, fim, máscara e exclusões): **preencher**
- URL da API Render testada: **preencher**

## Windows Server

- [ ] Adaptador interno/Host-Only conectado à rede correta.
- [ ] IPv4 estático definido fora do intervalo de concessões DHCP.
- [ ] Função DHCP instalada e escopo autorizado/ativo.
- [ ] Opções do escopo: máscara, gateway adequado, DNS interno e sufixo DNS.
- [ ] Função DNS instalada e zona de pesquisa direta para o domínio local criada.
- [ ] Registro A do servidor e registros necessários para os serviços internos verificados.
- [ ] Encaminhadores DNS configurados para nomes externos.
- [ ] IIS instalado; site de teste publicado e vinculado ao nome interno.
- [ ] Regras de firewall limitadas aos serviços e redes do laboratório.

**Evidências a inserir no PDF:** IPv4 do servidor; escopo e opções DHCP; zona/registro DNS; site e vínculo do IIS; teste local no navegador.

## Windows Cliente

- [ ] Placa 1 conectada à rede interna e configurada para obter IPv4/DNS via DHCP.
- [ ] Placa 2 conectada em NAT/Bridge para acesso à Internet.
- [ ] `ipconfig /all` confirma concessão DHCP e servidores DNS esperados.
- [ ] Nome do servidor no domínio local resolve para o IP interno.
- [ ] Site IIS acessível pelo nome DNS interno.
- [ ] Internet acessível pela placa externa.
- [ ] Endpoint público `/products` da API Render acessível pelo navegador.

**Evidências a inserir no PDF:** configuração das duas placas; `ipconfig /all`; resolução DNS interna; página do IIS; página JSON do Render.

## Testes sugeridos no Cliente

Substitua os nomes e endereços pelos valores registrados acima:

```powershell
ipconfig /all
Resolve-DnsName <servidor>.<dominio-local>
Test-NetConnection <servidor>.<dominio-local> -Port 80
Test-NetConnection <servico-render> -Port 443
```

Registre o resultado, a data e qual VM executou cada teste. Não inclua senhas ou tokens nas capturas.

## Exportação e entrega

1. Complete os campos e marque somente o que foi testado.
2. Insira capturas originais, legíveis, com contexto suficiente para identificar VM e etapa.
3. Exporte este roteiro preenchido para PDF.
4. Anexe o PDF à Issue de SSO do repositório e registre o link.

Não publique o PDF até substituir os campos pendentes e anexar evidências reais.
