# Portal de Processos - Labplan

Central interna de conhecimento (FAQ corporativo) da Labplan. Colaboradores pesquisam
dúvidas sobre processos internos organizados por setor; administradores gerenciam
usuários, setores, perguntas/respostas e um fluxo de sugestões.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript — frontend e backend
  (Server Actions) em um único projeto.
- [Prisma](https://www.prisma.io) 7 + PostgreSQL 16, com busca combinando full-text
  search (`tsvector`) e similaridade por trigramas (`pg_trgm`).
- [NextAuth (Auth.js) v5](https://authjs.dev) com Credentials provider, sessão JWT e
  senhas com `bcryptjs`.
- Tailwind CSS v4 + kit de componentes próprio (`src/components/ui/`) no estilo shadcn.
- [Tiptap](https://tiptap.dev) para o editor de respostas (rich text).
- [Vitest](https://vitest.dev) (unitário/componente) e [Playwright](https://playwright.dev) (e2e).

## Pré-requisitos

- [Node.js](https://nodejs.org) 20 LTS ou superior.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) com o backend WSL2
  habilitado (Windows) — necessário para rodar o PostgreSQL local via Docker Compose.

No Windows, se o WSL2 ainda não estiver habilitado:

```bash
wsl --install --no-distribution
```

Esse comando precisa rodar em um PowerShell/Terminal **como Administrador**, e o Windows
precisa ser reiniciado depois.

## Instalação e configuração

```bash
git clone https://github.com/VictorRiosssss/faq-lab.git
cd faq-lab
npm install
cp .env.example .env
```

Preencha o `.env` gerado:

- `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` —
  credenciais do Postgres local (os valores padrão do `.env.example` já funcionam com o
  `docker-compose.yml`).
- `NEXTAUTH_SECRET` — gere um valor aleatório, por exemplo:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- `NEXTAUTH_URL` — `http://localhost:3000` em desenvolvimento.
- `SEED_ADMIN_LOGIN`, `SEED_ADMIN_NAME`, `SEED_ADMIN_PASSWORD` — usados pelo seed para
  criar o administrador inicial. Se `SEED_ADMIN_PASSWORD` ficar em branco, uma senha
  aleatória é gerada e impressa **uma única vez** no console ao rodar o seed — anote-a e
  troque-a depois pelo próprio Portal (`/perfil`).

## Inicialização do banco de dados

```bash
docker compose up -d
npx prisma migrate dev
```

O comando acima cria as tabelas base. A busca full-text (colunas `tsvector`, extensão
`pg_trgm`) depende de uma migration SQL manual, porque o Prisma não modela `tsvector`
nativamente:

```bash
npx prisma migrate dev --create-only --name fulltext_search
```

Edite o arquivo gerado em `prisma/migrations/<timestamp>_fulltext_search/migration.sql`
com o SQL de `pg_trgm`/`unaccent`/`tsvector` (ver seção "Busca" abaixo ou o plano em
`.claude/plans/`), depois aplique:

```bash
npx prisma migrate dev
```

Por fim, popule os dados iniciais (setores, perguntas de exemplo e o admin):

```bash
npx prisma db seed
```

## Execução local

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Faça login com o usuário
administrador criado pelo seed.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento (Turbopack). |
| `npm run build` | Build de produção. |
| `npm run start` | Roda o build de produção. |
| `npm run lint` | ESLint. |
| `npx tsc --noEmit` | Checagem de tipos. |
| `npx vitest run` | Testes unitários e de componente. |
| `npx playwright test` | Testes end-to-end (requer `npm run dev` e um banco de teste — ver abaixo). |
| `npx prisma studio` | Explorador visual do banco. |

## Testes

- **Unitários/componente** (`tests/unit/`, `tests/component/`): não dependem de banco de
  dados; rodam com `npx vitest run`.
- **End-to-end** (`tests/e2e/`): usam Playwright contra uma instância real da aplicação
  (o `webServer` do `playwright.config.ts` roda `next build && next start` — build de
  produção, não `next dev`, para evitar timeouts causados pela compilação sob demanda do
  Turbopack). Antes de rodar, aponte `DATABASE_URL` para um banco **descartável** de teste
  — o `globalSetup` (`tests/e2e/global-setup.ts`) apaga todas as tabelas mutáveis e recria
  os usuários de teste (`tests/fixtures/test-users.ts`) e um setor/pergunta seed a cada
  execução. **Nunca rode contra o banco de desenvolvimento/produção.**

  Um jeito simples de ter esse banco: criar um segundo database no mesmo Postgres local
  (não precisa de outro container):
  ```bash
  docker exec -e PGPASSWORD=labplan code-postgres-1 psql -U labplan -d labplan_db -c "CREATE DATABASE labplan_test;"
  ```
  Depois aplique as migrations nele e rode a suíte apontando para ele (PowerShell):
  ```powershell
  $env:DATABASE_URL = "postgresql://labplan:labplan@127.0.0.1:5432/labplan_test"
  npx prisma migrate deploy
  npx playwright test
  ```

## Arquitetura

- `prisma/schema.prisma` — modelos: `User`, `Sector`, `Question`, `Suggestion`,
  `SearchLog`, `QuestionView`, `AuditLog`.
- `src/server/auth/` — configuração do NextAuth (Credentials + JWT), helpers
  `requireSession()`/`requireAdmin()` usados em toda Server Action.
- `src/server/actions/` — toda a lógica de negócio como Server Actions, organizadas por
  domínio (não por rota), com validação Zod (`src/server/validation/`) e checagem de
  permissão no servidor — nunca apenas no cliente.
- `src/server/db/queries/` — consultas SQL cruas (`$queryRaw`) usadas para a busca
  full-text + trigram e para as agregações do dashboard.
- `src/proxy.ts` — proteção de rotas por papel (roda em runtime Node.js no Next 16, por
  isso pode consultar o Postgres para revalidar se o usuário segue ativo).
- `src/components/` — organizados por domínio (`auth/`, `home/`, `search/`, `question/`,
  `users/`, `sectors/`, `suggestions/`, `dashboard/`, `layout/`) mais um kit de UI próprio
  em `ui/`.

## Segurança

- Senhas com hash `bcryptjs` (nunca texto puro).
- Sessão JWT com `maxAge` de 8h; o callback `jwt` reconsulta `isActive` no banco a cada
  refresh do token, então uma desativação de usuário derruba o acesso sem esperar a
  sessão expirar por completo.
- Toda Server Action que muta dados chama `requireAdmin()`/`requireSession()` no servidor
  — a proteção de rotas em `src/proxy.ts` é defesa em profundidade, não a única barreira.
- Rate limiting no login (`src/lib/rate-limit.ts`): 5 tentativas por login a cada 5
  minutos (em memória — suficiente para uma instância única; um deployment com múltiplas
  instâncias precisaria de um store compartilhado, ex. Redis).
- Respostas ricas (Tiptap) passam por sanitização HTML (`isomorphic-dompurify`,
  `src/lib/sanitize.ts`) com lista branca de tags/atributos antes de ir para o banco.
- `npm audit` reporta 4 vulnerabilidades "high" em `mysql2`/`deepmerge-ts` — são
  dependências transitivas da ferramenta de CLI do Prisma (usadas genericamente para
  suportar múltiplos bancos), não código que roda em produção. `npm audit fix --force`
  rebaixaria o Prisma para uma versão anterior à migração para os driver adapters do
  Prisma 7 — risco aceito e documentado, não corrigido automaticamente.

## Produção

Duas formas de fazer deploy com Docker: **Coolify** (se você já usa/vai usar Coolify no seu
servidor) ou uma **VPS pura** com Docker Compose + Caddy próprio, sem nenhum painel. São
alternativos — use só um dos dois.

### Opção A — Coolify

Coolify já roda seu próprio proxy reverso (Traefik) cuidando de domínio/HTTPS, e gerencia
variáveis de ambiente pela própria interface (não lê um `.env` do repositório). Por isso
existe um compose dedicado, `docker-compose.yaml` (na raiz do repo — nome exigido pelo
Coolify; **não confundir com `docker-compose.yml`**, esse é só o Postgres do ambiente de
desenvolvimento local), sem Caddy e sem publicar portas no host — só o essencial (Postgres
+ app) para o Coolify orquestrar por cima.

1. No Coolify, crie um novo recurso do tipo **Docker Compose**, apontando para este
   repositório Git — ele detecta o `docker-compose.yaml` da raiz automaticamente (não o
   `docker-compose.prod.yml`, que é da Opção B).
2. **Senha do banco e segredo de sessão são gerados automaticamente.** O compose usa as
   *magic variables* do Coolify (`SERVICE_PASSWORD_POSTGRES` e `SERVICE_BASE64_64_NEXTAUTH`):
   ele cria os valores no primeiro deploy, guarda, e mostra na aba de variáveis do recurso.
   Não precisa preencher nada para o stack subir.
3. A única variável que **você precisa preencher** na aba de variáveis do Coolify é a
   `NEXTAUTH_URL` — a URL pública completa, com `https://` e o mesmo domínio do passo 4
   (ex.: `https://processos.suaempresa.com.br`). Sem ela o login não redireciona certo.

   Opcionais (todas têm padrão no compose): `POSTGRES_USER`/`POSTGRES_DB`
   (`labplan`/`labplan_db`), `SEED_ADMIN_LOGIN`/`SEED_ADMIN_NAME` (`admin`/`Administrador`)
   e `SEED_ADMIN_PASSWORD` — essa última, se ficar em branco, faz o seed gerar uma senha
   aleatória e imprimir **uma única vez** nos logs do serviço `app` (aba **Logs** do Coolify).
4. Configure o domínio do serviço `app` na aba de domínios do recurso (Coolify cuida do
   certificado HTTPS sozinho). O `app` escuta na porta `3000` — se o Coolify pedir uma
   porta explícita no domínio, use `:3000`.
5. Deploy. O `docker-entrypoint.sh` aplica as migrations e garante o usuário admin antes de
   iniciar o Next.js, exatamente como na opção B abaixo.

**Se o deploy falhar com `dependency failed to start: container postgres-... is unhealthy`**
logo no primeiro segundo (sem esperar o healthcheck): é o Postgres morrendo ao subir. Veja
os logs do container `postgres` — se aparecer *"Database is uninitialized and superuser
password is not specified"*, a senha chegou vazia. Confira na aba de variáveis do Coolify
se `SERVICE_PASSWORD_POSTGRES` foi gerada; se a sua versão do Coolify não suportar magic
variables (precisa de v4.0.0-beta.411+), crie essa variável manualmente lá com uma senha
forte.

**Atenção ao trocar a senha do Postgres depois do primeiro deploy**: o volume `pgdata` já
foi inicializado com a senha antiga, e mudar a variável não altera a senha dentro do banco
— a aplicação passa a falhar na autenticação. Nesse caso, troque a senha no próprio banco
(`ALTER USER labplan WITH PASSWORD '...'`) em vez de só mudar a variável.

### Opção B — VPS pura (Docker Compose + Caddy, sem painel)

Requer uma VPS/servidor Linux com [Docker](https://docs.docker.com/engine/install/) e
[Docker Compose](https://docs.docker.com/compose/install/) instalados, e um domínio (ou
subdomínio) com o registro DNS tipo **A** apontando para o IP do servidor — o proxy
reverso (Caddy) usa isso para emitir o certificado HTTPS automaticamente (Let's Encrypt),
então o DNS precisa estar propagado *antes* de subir o `caddy`.

Arquivos envolvidos: `Dockerfile` (build da aplicação), `docker-compose.prod.yml`
(Postgres + app + Caddy), `Caddyfile` (proxy reverso/HTTPS), `docker-entrypoint.sh`
(roda migrations + seed do admin antes de iniciar o servidor).

1. **No servidor**, clone o repositório e entre na pasta:
   ```bash
   git clone <url-do-seu-repositorio> labplan
   cd labplan
   ```

2. **Configure o ambiente**:
   ```bash
   cp .env.production.example .env
   ```
   Edite o `.env` e preencha:
   - `POSTGRES_PASSWORD` — uma senha forte (o `docker-compose.prod.yml` monta a
     `DATABASE_URL` automaticamente a partir de `POSTGRES_USER`/`POSTGRES_PASSWORD`/
     `POSTGRES_DB` — não defina `DATABASE_URL` manualmente aqui).
   - `NEXTAUTH_SECRET` — gere com `openssl rand -base64 32`.
   - `NEXTAUTH_URL` e `DOMAIN` — seu domínio real, com `https://` na `NEXTAUTH_URL`.
   - `SEED_ADMIN_PASSWORD` — defina uma senha conhecida, ou deixe em branco para o
     container gerar uma aleatória (aparece uma única vez nos logs do container `app` —
     ver passo 4).
   - `SEED_SAMPLE_DATA` — deixe `false`. Isso existe para o ambiente de desenvolvimento
     local (cria setores/perguntas fictícios com anexos de teste); nunca deve ir para uma
     instância real.

3. **Suba o stack**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
   Isso builda a imagem da aplicação, sobe o Postgres, aplica as migrations, garante que o
   usuário admin existe e inicia o Next.js — tudo automaticamente via
   `docker-entrypoint.sh`. O Caddy sobe por último e obtém o certificado HTTPS do domínio
   configurado.

4. **Confira os logs** (a senha do admin, se gerada automaticamente, aparece aqui na
   primeira execução):
   ```bash
   docker compose -f docker-compose.prod.yml logs app
   ```

5. Acesse `https://seu-dominio.com.br`, faça login com o admin e troque a senha pela tela
   de perfil.

**Persistência**: os dados do Postgres (`pgdata`) e os arquivos anexados
(`attachments`) ficam em volumes Docker nomeados — sobrevivem a
`docker compose down` (sem `-v`) e a rebuilds da imagem da aplicação.

**Atualizar para uma nova versão**:
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```
O `docker-entrypoint.sh` roda `prisma migrate deploy` a cada start — novas migrations do
repositório são aplicadas automaticamente.

**Portas expostas**: só a `caddy` publica portas no host (`80`/`443`). O Postgres e a
aplicação Next.js ficam acessíveis apenas pela rede interna do Docker — não são
alcançáveis diretamente de fora do servidor, mesmo sem firewall.

### Sem Docker (rodando `next start` diretamente)

Se preferir não usar Docker, é possível rodar como qualquer app Next.js:

```bash
npm ci
npx prisma generate
npm run build
npx prisma migrate deploy
npx prisma db seed   # com SEED_SAMPLE_DATA=false no ambiente
npm run start
```

Configure as mesmas variáveis do `.env.production.example` no ambiente do processo, use
um gerenciador de processo (`pm2`, `systemd`) para manter o `npm run start` no ar e
reiniciar em caso de queda, e configure você mesmo um proxy reverso com HTTPS (Nginx,
Caddy, etc.) na frente da porta `3000`.
