# GetFesta — MVP Fase 1

Marketplace que conecta clientes a fornecedores de festas e eventos (buffets, casas de festa, decoração, animação infantil, etc.), sem cobrar comissão do cliente. Este pacote é o MVP funcional da Fase 1 descrita no plano de marketing: pedido sem login, busca com filtros, cadastro de empresa no plano Leads, página pública de empresa, mensagens de interesse e um painel simples para o fornecedor.

> Deploy em produção: veja [`docs/DEPLOY-LOCAWEB.md`](./docs/DEPLOY-LOCAWEB.md) para o passo a passo de publicação na Locaweb (Node.js + PostgreSQL).

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions) + **React 19** + **TypeScript**
- **PostgreSQL** via driver `pg` (sem ORM — Prisma foi avaliado e descartado neste ambiente por bloqueio de download do engine; ver `AGENTS.md`/decisões técnicas do projeto)
- **Tailwind CSS v4**
- **Zod** para validação de formulários no servidor
- **bcryptjs** para hash de senha e sessão via cookie assinado (HMAC-SHA256) — não há tabela de sessão

## Como rodar localmente

### 1. Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ rodando localmente (ou acessível via `DATABASE_URL`)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo e ajuste se necessário:

```bash
cp .env.example .env
```

Por padrão ele espera um banco chamado `getfesta` em `localhost:5432` com usuário/senha `postgres`/`postgres`. Ajuste `DATABASE_URL` conforme seu ambiente. `SESSION_SECRET` pode ficar com o valor de exemplo em desenvolvimento, mas troque em produção.

### 4. Criar o banco e aplicar o schema

```bash
createdb getfesta
psql -d getfesta -f db/schema.sql
```

O arquivo `db/schema.sql` contém todas as tabelas do domínio (usuários, empresas, pedidos, planos, avaliações, etc.), incluindo a seção 14 (`empresa_avaliacoes_google` — estratégia de cold start de avaliações via Google no lançamento) e a seção 15 (`empresa_eventos` — eventos de visualização de perfil e clique no WhatsApp, usados nos KPIs do painel).

### 5. Popular dados de exemplo (seed)

```bash
npm run seed
```

O seed cria: cidades e bairros da região (Niterói, São Gonçalo, Rio de Janeiro), categorias e categorias profissionais, planos de assinatura, um cliente de teste (`cliente@teste.com` / `teste123`), cinco empresas de exemplo — incluindo uma marcada como **cadastro assistido** (`perfil_reivindicado = false`, com nota vinda do Google), simulando um perfil criado pela GetFesta antes de a empresa reivindicá-lo — banners de destaque e pedidos de exemplo (um deles já concluído, com avaliações).

Todas as fotos são geradas localmente como SVG (data URI), sem depender de nenhum CDN de imagens externo.

### 6. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### 7. Build de produção (opcional)

```bash
npm run build
npm run start -- -p 3100
```

## O que está mockado nesta versão

Nada de integração externa real está ligado ainda — tudo é simulado, conforme combinado para esta primeira rodada:

- **Pagamento (Mercado Pago)**: não implementado; o plano Leads é ativado diretamente no cadastro, sem cobrança.
- **SMS/verificação de telefone**: não implementado.
- **Consulta à Receita Federal (CNPJ)**: não implementado; o CNPJ é apenas validado por formato (dígito verificador) no cadastro.
- **Google Places / avaliações do Google**: a tabela `empresa_avaliacoes_google` existe e é usada para exibir nota "importada do Google" nas empresas com poucas avaliações nativas, mas os dados são inseridos manualmente no seed — não há chamada real à API do Google ainda.

## Estrutura principal

```
app/            rotas (App Router): home, busca, publicar-pedido, empresa/[id], entrar, cadastro/*, meus-pedidos, painel
components/     componentes de UI e formulários client-side
lib/actions/    Server Actions (login, cadastro, pedidos, interesse)
lib/data/       funções de leitura (queries) por domínio
lib/auth.ts     sessão via cookie assinado
lib/contact-filter.ts   detecção e mascaramento de contato (telefone/e-mail) em textos livres
db/schema.sql   schema completo do PostgreSQL
db/seed.ts      dados de exemplo
```

## Regra de negócio central: liberação de contato

Instagram e telefone da empresa só ficam visíveis para o cliente depois que aquela empresa específica manifesta interesse em algum pedido daquele cliente (`pedido_interesses.status = 'contato_liberado'`). É o mesmo evento que libera, do outro lado, o telefone do cliente para a empresa entrar em contato pelo WhatsApp. Antes disso, qualquer tentativa de deixar telefone/e-mail em textos livres (descrição do pedido, etc.) é detectada e mascarada automaticamente.
