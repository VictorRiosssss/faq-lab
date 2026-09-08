@AGENTS.md

# Portal de Processos - Labplan

Central interna de conhecimento (FAQ corporativo) da Labplan. Colaboradores pesquisam
dúvidas sobre processos internos organizados por setor; administradores gerenciam
usuários, setores, perguntas/respostas e um fluxo de sugestões. Ver o plano completo em
`C:\Users\Victor Gabriel Rios\.claude\plans\deep-painting-pretzel.md`.

## Checkpoint — 2026-09-08g (deploy Coolify: 3 bugs reais corrigidos em produção)

Continuação direta do checkpoint anterior — a primeira tentativa de deploy no Coolify do
usuário (site real: `npi.labplan.com.br`, projeto Coolify "Nivus - CRM Labplan Franquias")
passou por três problemas reais, todos encontrados só porque o usuário estava rodando de
verdade contra a instância dele (eu não tenho acesso a ela — cada correção foi validada
localmente com Docker antes de mandar, mas a confirmação final sempre veio do log real que
o usuário colou):

1. **Nome de arquivo**: Coolify exige exatamente `docker-compose.yaml` na raiz do repo pra
   auto-detectar — `docker-compose.coolify.yml` e depois `docker-compose.coolify.yaml`
   (extensão certa, nome errado) não foram reconhecidos. Renomeado para
   `docker-compose.yaml` na raiz. **Atenção**: o repo agora tem `docker-compose.yml`
   (Postgres do dev local) e `docker-compose.yaml` (stack completa do Coolify) — nomes
   quase idênticos, propósitos diferentes, documentado no README pra não confundir.
2. **Postgres morrendo instantaneamente** (`dependency failed to start: ... is unhealthy`,
   no mesmo segundo do start — não é timeout de healthcheck, é o container saindo
   imediatamente): `POSTGRES_PASSWORD` chegava vazia porque o Coolify não lê `.env` do
   repositório em deployments de Docker Compose, e a variável nunca tinha sido preenchida
   na aba de variáveis dele. Reproduzido localmente (`docker run` com
   `POSTGRES_PASSWORD=` vazio → mesmo erro exato, "Database is uninitialized and superuser
   password is not specified") antes de mexer no compose, pra confirmar o diagnóstico.
   Corrigido trocando `POSTGRES_PASSWORD`/`NEXTAUTH_SECRET` pelas *magic variables* do
   Coolify (`SERVICE_PASSWORD_POSTGRES`/`SERVICE_BASE64_64_NEXTAUTH`) — ele gera e persiste
   sozinho, sem depender do usuário preencher nada na aba de variáveis. Adicionado também
   `start_period: 30s` no healthcheck (o `initdb` do primeiro boot num volume vazio não
   pode contar contra as tentativas).
3. **Bug do seed que já estava sinalizado numa task separada virou um problema real**: o
   usuário não anotou a senha do admin gerada automaticamente, e o container que a criou
   já não existia mais (log rotacionado/container recriado) — senha irrecuperável pelo
   histórico. `upsertAdminUser()` (`prisma/seed.ts`) reescrito: `SEED_ADMIN_PASSWORD`,
   quando definida, agora **sempre redefine a senha** (create OU update), em vez de só
   valer na criação e mentir no log depois disso. Vira o mecanismo oficial de recuperação
   de acesso em produção — já que o `docker-entrypoint.sh` roda o seed a cada start do
   container, redefinir a variável no Coolify + redeploy é o caminho. Testado localmente
   ponta a ponta com um container Docker de verdade (não só teste unitário): sem senha
   explícita e admin já existe → hash inalterado e log não mente; senha explícita definida
   → senha antiga para de funcionar, nova funciona; reset repetido com senha diferente →
   funciona de novo. A task `task_e1a376e8` (sinalizada num checkpoint anterior sobre esse
   mesmo bug) pode ser descartada — resolvida aqui, não como tarefa separada.
   - **Efeito colateral bom**: também instalado `openssl` na imagem Docker
     (`node:22-bookworm-slim` não vem com ele) — o Prisma imprimia um aviso de
     "failed to detect the libssl/openssl version" a cada start do container, poluindo o
     log bem na hora em que o usuário mais precisava dele limpo pra debugar.
- **Ainda sem deploy 100% confirmado bem-sucedido no fechamento deste checkpoint** — o
  usuário estava no meio da tentativa com as correções mais recentes quando a sessão foi
  compactada. Próximo passo ao retomar: confirmar com o usuário se o login em
  `npi.labplan.com.br` já funciona com a senha definida via `SEED_ADMIN_PASSWORD`.

## Checkpoint — 2026-09-08f (deploy real: primeiro commit/push, e adaptação pra Coolify)

Depois do checkpoint anterior (deploy Docker validado localmente), duas coisas
aconteceram na tentativa de deploy real do usuário:

- **Primeiro commit/push do projeto inteiro**: o repositório nunca tinha sido commitado
  (zero commits, apesar do remote `origin` já apontar para
  `github.com/VictorRiosssss/faq-lab.git` configurado desde o início da sessão). Sem
  identidade git configurada (nem local nem global) — configurei `user.name`/`user.email`
  só neste repositório (`git config` sem `--global`). Revisei o `git status` antes de
  `add -A` pra confirmar que nenhum `.env` real seria commitado (só `.env.example` e
  `.env.production.example`, que já eram exceções no `.gitignore`). Adicionado
  `.gitattributes` (`*.sh text eol=lf`) pra garantir que `docker-entrypoint.sh` nunca vá
  pro servidor Linux com quebra de linha CRLF do Windows (isso quebraria o script com um
  erro de "bad interpreter" impossível de debugar remotamente). `.claude/scheduled_tasks.lock`
  (estado de runtime da sessão, não config de projeto) adicionado ao `.gitignore`.
- **Deploy no Coolify falhou** ("erro no banco de dados"). Causa provável, confirmada
  contra a documentação oficial do Coolify (`coolify.io/docs/knowledge-base/docker/compose`,
  via WebSearch/WebFetch nesta sessão — não dá pra testar contra o Coolify real do
  usuário):
  1. O `docker-compose.prod.yml` original sobe um Caddy próprio publicando `80`/`443` no
     host — o Coolify já roda seu próprio proxy (Traefik) nessas portas; publicar as
     mesmas portas de novo é o tipo de conflito que quebra o deploy.
  2. O serviço `app` usava `env_file: - .env` pra pegar as credenciais — Coolify não lê um
     `.env` do repositório em deployments de "Docker Compose"; ele detecta as variáveis do
     bloco `environment:` do próprio compose e deixa o usuário preenchê-las pela interface
     dele. Com `env_file` apontando pra um arquivo que não existe no contexto do Coolify, o
     container provavelmente subia sem `DATABASE_URL` nenhuma.
  - **Correção**: novo arquivo `docker-compose.coolify.yml` (não substitui o
    `docker-compose.prod.yml` — são dois caminhos alternativos, documentados como "Opção A"
    e "Opção B" no README). Sem Caddy, sem publicar porta nenhuma no host (`expose: "3000"`
    só na rede interna do Docker, que é o que o Traefik do Coolify enxerga). Credenciais
    via `environment: DATABASE_URL: postgresql://...@postgres:5432/...` com sintaxe
    `${VAR}`/`${VAR:-default}` direto no compose, pro Coolify detectar e mostrar na aba de
    variáveis dele — exatamente o pedido do usuário ("já configurar as credenciais no
    compose"). Postgres continua no mesmo compose (`depends_on` + `condition:
    service_healthy`), como já era.
  - **Não testado contra Coolify de verdade** (sem acesso à instância do usuário) — só
    validado com `docker compose config` localmente (sintaxe + interpolação de variáveis
    corretas). README explica o que conferir se ainda der erro (checar se
    `POSTGRES_PASSWORD` ficou vazio na aba de variáveis do Coolify — nesse caso a
    `DATABASE_URL` interpolada fica com senha vazia e a conexão falha do mesmo jeito).
  - Commitado e enviado (`git push`) a pedido explícito do usuário, que escolheu entre
    "commit + push" vs "copiar arquivo direto" via pergunta de esclarecimento.

## Checkpoint — 2026-09-08e (HUD de anexos, refino visual, deploy Docker pronto)

Sequência de pedidos: HUD de pré-visualização de anexo, ajuste de ícone, refino visual
(módulo 8) e — o item grande desta sessão — deixar o projeto pronto para hospedar numa
VPS própria com Docker.

- **HUD de pré-visualização** (`src/components/question/attachment-list.tsx`): clicar num
  anexo (imagem, linha de arquivo) abre um overlay em tela cheia em vez de navegar/baixar
  direto — imagem/PDF/texto renderizam inline (`<img>`/`<iframe>`), tipos sem preview
  (Word/Excel) mostram aviso + botão de baixar. Cabeçalho fixo com nome/tamanho do arquivo
  e dois botões: "Baixar" (usa atributo `download` no `<a>`, força download real mesmo com
  o arquivo sendo servido `inline`) e "Voltar" (ícone `ArrowLeft`, não `X` — pedido
  explícito do usuário). Fecha com o botão, Esc, ou clique fora do conteúdo.
- **Refino visual (módulo 8)**: a maior parte do design system já estava madura de sessões
  anteriores (hover/focus/transition já presentes em Button, Table, sector-card,
  question-row). Focado nas partes mais novas que não tinham recebido atenção de design:
  sidebar do admin (hover de fundo em itens inativos, antes só mudava cor do texto), cards
  de imagem/linhas de arquivo em `attachment-list.tsx` (cursor-pointer, anel de foco,
  hover de borda/fundo — antes tinha zero feedback visual de "isso é clicável"), entrada em
  fade no HUD (`animate-in fade-in-0`, reaproveitando a mesma classe já usada em
  `dialog.tsx`).
- **Deploy Docker para produção — testado de ponta a ponta neste ambiente antes de
  entregar** (não apenas escrito, rodei `docker build` + `docker compose up` de verdade
  contra um Postgres real, migrations, seed e HTTP request):
  - Novos arquivos: `Dockerfile`, `docker-entrypoint.sh`, `docker-compose.prod.yml`,
    `Caddyfile`, `.env.production.example`, `.dockerignore`. Seção nova no `README.md`
    ("Produção (deploy com Docker num servidor próprio)").
  - **Bug real encontrado só testando**: `prisma.config.ts` chama `env("DATABASE_URL")` ao
    carregar — isso falha (`PrismaConfigEnvError`) mesmo para `prisma generate`, que nunca
    conecta de fato no banco. Corrigido com um `DATABASE_URL` placeholder via `ENV` no
    Dockerfile, só para as etapas de build (`prisma generate`/`next build`); o valor real
    de produção sobrescreve isso em runtime via `docker-compose.prod.yml`.
  - **Outro problema real encontrado testando**: `next build` tentava pré-renderizar `/` e
    `/admin` (e todas as rotas do grupo `(colaborador)`/`(admin)`), batendo no
    `DATABASE_URL` placeholder do build e imprimindo erros assustadores
    (`Can't reach database server`) — inofensivo (as rotas já caíam para dinâmicas no
    resultado final), mas poluía o log de build a ponto de parecer quebrado. Corrigido
    com `export const dynamic = "force-dynamic"` nos dois `layout.tsx` (`(colaborador)` e
    `(admin)`) em vez de espalhar em cada `page.tsx` — cascata para todas as rotas do
    grupo. Build local voltou a ficar 100% limpo depois disso.
  - **Imagem Debian, não Alpine** (`node:22-bookworm-slim`): Prisma tem histórico de
    problemas de compatibilidade musl/openssl em Alpine com os engines de
    migration/query; não dava pra testar isso na VPS real do usuário, então preferi a
    imagem mais "chata" mas comprovadamente compatível.
  - **`docker-entrypoint.sh` roda `prisma migrate deploy` + `prisma db seed` a cada start**
    do container `app` — idempotente (upsert do admin não sobrescreve senha em usuário já
    existente — ver bug do seed abaixo), então é seguro rodar em todo restart/redeploy.
  - **Dado de exemplo do seed não pode ir para produção**: o seed cria 4 perguntas fictícias
    com anexos de teste (uma delas literalmente uma foto de recibo enviada pelo usuário
    nesta sessão). `prisma/seed.ts` agora tem uma flag `SEED_SAMPLE_DATA` — por padrão
    `true` em dev (`NODE_ENV !== "production"`) e `false` em produção; em produção só o
    usuário admin é criado, setores/perguntas ficam para o admin cadastrar de verdade pela
    UI. Testado: rodando com `NODE_ENV=production` sem a env var setada, confirmei via
    query direta no Postgres do teste — 1 usuário, 0 setores, 0 perguntas.
  - **Rede/portas**: só o serviço `caddy` publica portas no host (80/443); Postgres e a
    aplicação Next.js ficam só na rede interna do Docker Compose, inacessíveis de fora do
    servidor mesmo sem firewall. Caddy faz HTTPS automático (Let's Encrypt) a partir da
    variável `DOMAIN`.
  - **Erro operacional cometido e corrigido na hora**: ao testar o compose de produção
    localmente, escrevi por engano um `.env` de teste que **sobrescreveu o `.env` de
    desenvolvimento real** (que tinha `DATABASE_URL` do Postgres local, usado pelo servidor
    de dev rodando). Percebido e corrigido no mesmo turno — `.env` de dev reconstruído com
    os valores documentados (`127.0.0.1`, credenciais padrão do `docker-compose.yml`);
    único dado não recuperável foi o `NEXTAUTH_SECRET` antigo (nunca foi logado em lugar
    nenhum), gerado um novo — efeito colateral: sessões antigas invalidadas (precisa logar
    de novo), nenhuma perda de dado. Testes de compose de produção subsequentes usaram um
    arquivo `.env.dockertest` + projeto Docker Compose separado (`-p labplan-dockertest`)
    para nunca mais colidir com o `.env` real. **Lição**: ao testar infra de deploy que lê
    `.env`, sempre usar um nome de arquivo/projeto isolado do ambiente de dev real.
  - Verificado depois de tudo: `tsc`, `eslint`, `vitest run` (34/34), `npm run build` —
    limpos. Login local re-testado manualmente depois da restauração do `.env` (funcionou).
- **Pendência para uma próxima sessão**: os testes e2e (Playwright) não foram
  re-executados desde a adição do modelo `Attachment` — o banco `labplan_test` está com a
  migration desatualizada, e não existe cobertura e2e para anexos/HUD ainda. Continua
  sendo o maior risco de regressão silenciosa (ver checkpoint anterior).

## Checkpoint — 2026-09-08d (bug: anexo de imagem real falhava silenciosamente)

Usuário reportou "Não estou conseguindo anexar imagens nas respostas". Bug real, só
aparecia com arquivos de tamanho realista — meus testes anteriores usavam arquivos de
teste minúsculos (bytes/poucos KB) e nunca bateram nesse limite.

- **Causa**: Server Actions do Next.js limitam o corpo da requisição a **1MB por padrão**
  (`experimental.serverActions.bodySizeLimit`, não configurado). `uploadAttachments()` é
  uma Server Action que recebe os arquivos via `FormData`; qualquer imagem real (a maioria
  das fotos/prints passa de 1MB) estourava esse limite do próprio framework, antes mesmo de
  chegar na validação de 10MB/8-arquivos da aplicação — falha silenciosa do lado do Next,
  não um erro visível óbvio.
- **Correção**: `next.config.ts` agora define
  `experimental.serverActions.bodySizeLimit = MAX_ATTACHMENT_SIZE_BYTES *
  MAX_ATTACHMENTS_PER_QUESTION + 1MB de folga` (importado de `src/lib/attachments.ts`,
  fonte única da verdade — evita o limite do Next e o limite da aplicação divergirem no
  futuro). **Mudança em `next.config.ts` exige reiniciar o servidor de dev** — não recarrega
  sozinho como mudança de código de página.
- Testado no navegador: upload de um arquivo de 3MB (antes do fix, era exatamente esse tipo
  de arquivo que falhava) — salvou com sucesso, persistiu, veio 200 nas duas requisições
  (update da pergunta + upload do anexo).

## Checkpoint — 2026-09-08c (anexos nas respostas, dashboard sem janela de 30 dias, nome do software)

Três pedidos do usuário nesta sessão, todos implementados e verificados (`tsc`, `eslint`,
`vitest run` 34/34, `npm run build`, e QA manual no navegador contra Postgres real):

- **Anexos nas respostas** ("Preciso de anexos nas respostas"): admin pode anexar arquivos
  (PDF, Word, Excel, CSV, texto, imagem — até 10MB por arquivo, 8 por pergunta) ao editar/
  criar uma pergunta; colaboradores veem e baixam os anexos na página pública da pergunta.
  - Modelo `Attachment` novo no Prisma (`questionId` FK cascade, `uploadedById` FK,
    `storedName` único gerado por UUID — nunca deriva do nome original do arquivo, evita
    path traversal/colisão). Migration `..._attachments` — precisou da mesma correção
    manual de sempre (Prisma confunde o diff da coluna `searchVector`/`Unsupported` e gera
    `DROP INDEX`/`ALTER COLUMN DROP DEFAULT` espúrios quando qualquer outro campo do schema
    muda; removidos à mão do `migration.sql` antes de aplicar).
  - Arquivos ficam em `storage/attachments/` (fora de `public/`, fora do git —
    `.gitignore` atualizado), nunca servidos estaticamente. Único acesso é
    `src/app/api/attachments/[id]/route.ts`, um Route Handler autenticado
    (`requireSession()`) que faz stream do arquivo com `Content-Disposition: attachment`.
  - `uploadAttachments`/`deleteAttachment` (`src/server/actions/questions.actions.ts`)
    exigem `requireAdmin()` — só admin cria/apaga anexo; download é liberado para qualquer
    usuário autenticado (admin ou colaborador).
  - **Armadilha descoberta**: depois de rodar a migration, `npx tsc` continuou acusando
    `Property 'attachment' does not exist on type 'PrismaClient'` — o client gerado
    (`src/generated/prisma/`) não é regenerado automaticamente só por rodar a migration;
    precisa de `npx prisma generate` explícito depois de qualquer mudança de schema.
  - Testado ponta a ponta no navegador contra o Postgres real: upload (via simulação de
    `input[type=file]` com `DataTransfer`, já que a automação do navegador não tem um
    gesto nativo de escolher arquivo do SO), o arquivo aparece na lista, persiste após
    salvar, aparece na página pública da pergunta, download retorna 200 com o
    `Content-Disposition`/corpo corretos, exclusão funciona (o `confirm()` nativo do
    `attachment-delete-button.tsx` precisou ser testado com `window.confirm` sobrescrito,
    já que a automação cancela dialogs nativos por padrão — não é um bug do app).
- **Dashboard "Visão geral" sem janela de 30 dias** ("A visão geral está para os últimos
  30 dias, tire isso, deixe a visão geral de todos os tempos"): `getDashboardStats()`
  (`src/server/db/queries/stats.queries.ts`) não recebe mais `windowDays` e não filtra mais
  por `createdAt` nas agregações de busca/visualização — agora é sempre "desde o início".
  `src/app/(admin)/admin/page.tsx` mostra "Todos os períodos" em vez de "Últimos N dias".
  A página `/admin/configuracoes` teve o card "Dashboard" (que exibia o valor da janela)
  removido, já que não existe mais janela a configurar.
  **Importante**: `getPopularQuestions()` (seção "Perguntas frequentes" da home) continua
  usando janela de 30 dias (`DASHBOARD_DEFAULT_WINDOW_DAYS`, em `src/lib/constants.ts`) —
  o pedido do usuário foi especificamente sobre a "Visão geral" do admin, não sobre a home
  pública; não mexi nessa segunda janela.
- **Nome do software**: o usuário definiu o nome oficial como "Navegador de Processos
  Internos" (o nome "Portal de Processos" era um placeholder de desenvolvimento). Trocado
  em `src/app/layout.tsx` (title/template padrão do `<head>`), no subtítulo abaixo da logo
  em `src/app/(public)/login/page.tsx`, e no texto do modal de sugestão
  (`src/components/search/suggestion-modal.tsx`). A logo em si continua sendo só a
  wordmark "LABPLAN" (nome da empresa, fonte Arual) — o nome do software é o subtítulo/
  título da aba, não a logo.
- **Dados de exemplo dos anexos do seed**: as 4 perguntas do seed (`prisma/seed.ts`) agora
  têm 2 anexos cada — uma imagem PNG e um `.txt` com o roteiro detalhado da resposta.
  **Importante, pedido explícito do usuário**: não existe (e não deve ser criado) nenhum
  gerador de imagem/fluxograma no código do produto nem do seed. As 4 imagens são arquivos
  estáticos reais commitados em `prisma/seed/assets/*.png` (cores sólidas simples, só para
  ter bytes de imagem de verdade para testar) — `prisma/seed.ts` apenas lê e copia esses
  arquivos para `storage/attachments/` via `readFile`/`writeFile`, sem nenhuma lógica de
  desenho/encoding. (Uma primeira versão desenhava fluxogramas com caixas numeradas e setas
  via um encoder PNG feito à mão — foi explicitamente descartada a pedido do usuário e
  removida do repositório; não reintroduzir esse padrão.)
- **Pré-visualizador de anexos** ("Quero um bom pré-visualizador nas respostas, precisa
  ficar parecido com um site de respostas"): `src/components/question/attachment-list.tsx`
  agora separa anexos de imagem (`mimeType` começando com `image/`) dos demais — imagens
  aparecem como grade de miniaturas (`<img>` apontando para a rota autenticada, dentro de
  card com borda/radius, abre em nova aba ao clicar), outros arquivos continuam como linha
  com ícone por tipo (PDF/Word → `FileText`, planilha/CSV → `FileSpreadsheet`, resto →
  `Paperclip`). Usado tanto na página pública da pergunta quanto no formulário de edição do
  admin (com o botão de excluir ao lado da miniatura, fora da tag `<a>` para não aninhar
  elementos interativos).

## Checkpoint — 2026-09-08b (redesign completo do frontend — estética Resend/Apple)

O usuário pediu um redesign completo, substituindo o visual da sessão anterior (accent
teal, ícones coloridos, texturas) por uma estética minimalista premium (referência Resend/
Apple): preto/branco/cinza, bordas sutis (#E8E8E8), radius 8-14px, sombra quase nula,
container central de 1140px, tipografia Inter (Arual reservada só para a wordmark
"LABPLAN", sempre maiúscula).

**Nenhuma lógica de negócio, rota, endpoint ou regra de autenticação foi alterada** —
só a camada visual, mais uma pequena adição aditiva (função pública `getPopularQuestions`
para a seção "Perguntas frequentes" da home, que só lê `QuestionView` já existente).

- **Tokens** (`globals.css`): paleta clara/escura reescrita com hex diretos (não oklch),
  tokens de radius nomeados (`--radius-button`/`--radius-input`/`--radius-card` → geram
  utilities `rounded-button`/`rounded-input`/`rounded-card` no Tailwind v4), sombra única
  `--shadow-subtle`. Removida a textura de pontos (`.bg-grid`) e o accent teal/amber.
- **Kit de UI** (`src/components/ui/`): Button (primary preto/branco, secondary
  branco+borda, destructive vermelho só em exclusão), Input/Textarea/Select (radius 10px,
  focus ring discreto), Card (radius 14px), Table, Badge (status com fundo suave +
  texto colorido, sem cores vibrantes).
- **Componentes novos**: `Container`, `Breadcrumb`, `EmptyState`, `SectionHeading`,
  `QuestionRow` (linha clicável reutilizada em setor/busca/home), `HighlightText`
  (destaque de termo buscado nos resultados).
- **Home**: eyebrow "BASE DE CONHECIMENTO" → H1 "Qual a sua dúvida?" (trocado de "Como
  podemos ajudar?" a pedido do usuário) → busca estilo Spotlight com atalho ⌘K (foca o
  campo; funciona em qualquer input focável da página) → "Explore por setor" (cards sem
  ícone/cor, nome+descrição+contagem+seta) → "Perguntas frequentes" (nova seção, usa
  `getPopularQuestions`).
- **Busca**: resultados em lista de linhas (não cards), com termo destacado via
  `HighlightText`; empty state redesenhado ("Nenhum resultado encontrado" — mantém o botão
  "Enviar sugestão", a funcionalidade de sugestão não foi removida).
- **Setor/Pergunta**: breadcrumb "Processos / {setor}", páginas de setor com lista de
  linhas clicáveis (`SectorQuestionList`, com filtro client-side quando >5 perguntas),
  página de pergunta com badge+H1+"Atualizado em DD/MM/AAAA"+divisor+prose estreito (760px).
- **Admin**: sidebar sem ícones com item ativo discreto (fundo cinza claro), título
  "Dashboard" renomeado para "Visão geral" (rota `/admin` inalterada), stat cards sem
  ícones coloridos.
- **Logo**: `src/components/layout/logo.tsx` simplificado — só o wordmark "LABPLAN"
  (sempre maiúsculo) na fonte Arual, sem ícone. Fonte Arual continua carregada via
  `next/font/local` a partir de `src/fonts/Arual.ttf`.
- Vários textos/seletores de teste foram atualizados para bater com a nova cópia (ex.:
  "Nenhum resultado encontrado" em vez de "Não encontramos uma resposta...", H1 novo,
  remoção do botão "Buscar" separado — Enter agora submete) — são mudanças de UI, não de
  regra de negócio.
- Verificado: `tsc`, `eslint`, `vitest run` (34/34), `npm run build` e
  `npx playwright test` (18/18, contra Postgres real) — todos limpos após o redesign.

## Checkpoint — 2026-09-08 (identidade visual: logo, tema escuro, refinamento de design)

Pedido do usuário: logo "Labplan" com fonte específica, tema escuro com toggle, e deixar
o visual do sistema mais rico (estava "muito simples").

- **Fonte da logo**: o usuário pediu a fonte "Arual" — não está no Google Fonts (é uma
  fonte de terceiro, distribuída em sites como dafont/fontriver). O usuário enviou o
  arquivo `Arual.ttf` diretamente (`C:\Users\Victor Gabriel Rios\Downloads\arual (1).zip`),
  que foi extraído para `src/fonts/Arual.ttf` e carregado via `next/font/local` (variável
  `--font-arual`, exposta como `--font-display` no Tailwind). Usada no wordmark "Labplan"
  e nos títulos de página (`font-display`).
- **Tema escuro**: implementado com `next-themes` (`attribute="class"`,
  `defaultTheme="system"`), toggle em `src/components/theme/theme-toggle.tsx` (ícone
  sol/lua no `TopNav`, preferência persistida no navegador). `globals.css` reescrito com
  paleta completa clara+escura em oklch (tokens `--background`, `--card`, `--border` etc.
  já existiam; adicionados `--signal` (accent teal "sinal de laboratório"), `--amber`,
  `--success`/`--warning`/`--danger` com variantes `-soft` para fundos). Ativado via
  `@custom-variant dark (&:where(.dark, .dark *));` no CSS (Tailwind v4).
- **Refinamento visual** ("mais elementos"): ícones lucide-react em todo lugar que fazia
  sentido (sidebar admin com item ativo destacado, cards de setor com ícone+barra de cor
  no topo, stat cards do dashboard com ícone colorido), textura sutil de pontos
  (`.bg-grid`) + glow radial no hero da home e na tela de login, busca com ícone de lupa
  embutido no campo, componente `<Logo />` reutilizável (`src/components/layout/logo.tsx`)
  usado no `TopNav` e no login.
- **Auditoria de dark mode**: todos os componentes/páginas que usavam cores fixas
  (`text-neutral-900`, `bg-white`, `border-neutral-200` etc.) foram convertidos para os
  tokens semânticos (`text-foreground`, `bg-card`, `border-border` etc.) via busca e
  substituição em massa + revisão manual — sem isso o dark mode ficaria quebrado em quase
  toda a aplicação, já que o kit de UI foi construído antes do dark mode existir.
  `prose`/`ProseMirror` (resposta renderizada e editor Tiptap) receberam `dark:prose-invert`
  do plugin Typography.
- Verificado: `tsc`, `eslint`, `vitest run` (34/34) e `npm run build` limpos depois de
  todas as mudanças; conferido visualmente claro/escuro/mobile no navegador embutido
  (home, login, dashboard, formulário com Tiptap, busca).
- **Pendência**: o eslint-disable em `theme-toggle.tsx` (`react-hooks/set-state-in-effect`)
  é intencional — é o padrão oficial do `next-themes` para evitar mismatch de hidratação
  (o tema não é conhecido no servidor); não é um bug a corrigir.

## Checkpoint — 2026-09-07 (banco real conectado, sistema validado ponta a ponta)

O WSL2/Docker foram habilitados nesta sessão. **Pela primeira vez, o sistema rodou contra
um Postgres real** e foi validado de verdade — não apenas por leitura de código. Isso
revelou e corrigiu **vários bugs reais** que não apareciam em typecheck/lint/testes
unitários. Ver seção "Bugs encontrados e corrigidos" abaixo — é a parte mais importante
deste checkpoint.

### Verificado nesta sessão (tudo passando)

- `npx tsc --noEmit` — limpo.
- `npx eslint .` — limpo.
- `npx vitest run` — **34/34 testes unitários/componente passando**.
- `npm run build` — limpo, 17 rotas dinâmicas geradas corretamente.
- **`npx playwright test` — 18/18 testes e2e passando**, rodando de verdade contra um
  Postgres descartável (`labplan_test`, banco separado do dev `labplan_db` no mesmo
  container Docker). Cobre login/logout, proteção de rotas por papel, CRUD de usuários/
  setores/perguntas, busca full-text+trigram (incluindo paráfrase), e o fluxo completo de
  sugestão → aprovação → conversão → busca.
- Validação manual no navegador: login por papel, dashboard com dados agregados reais,
  busca com paráfrase, sugestão → conversão → busca, responsividade mobile.

### Ambiente local

- WSL2 habilitado, Docker Desktop instalado e rodando.
- `docker compose up -d` sobe o Postgres 16 em `127.0.0.1:5432` (container
  `code-postgres-1`).
- Banco de dev: `labplan_db`. Banco de teste descartável usado pelos e2e:
  `labplan_test` (criado manualmente com `CREATE DATABASE labplan_test;` no mesmo
  container — não existe no `docker-compose.yml`, é só mais um DB no mesmo servidor).
- `.env` já populado com credenciais de dev + `NEXTAUTH_SECRET` gerado + admin seed
  (login `admin`, senha impressa uma vez pelo seed — troque-a).
- Migrations aplicadas: `20260907223017_init` e `20260907223034_fulltext_search`.

## Bugs encontrados e corrigidos nesta sessão (todos via teste real, não code review)

1. **Prisma 7 `datasource.url` removido do schema** — conexão agora via
   `prisma.config.ts` + driver adapter (`@prisma/adapter-pg`). Client gerado não tem
   `index.ts`, só `client.ts` — import correto é `.../generated/prisma/client`.
2. **`middleware.ts` → `src/proxy.ts`** (convenção do Next.js 16). Bônus: Proxy roda em
   Node.js por padrão (Middleware antigo rodava em Edge), o que eliminou dois warnings de
   "Node.js module not supported in Edge Runtime" vindos do Prisma no callback `jwt`.
3. **Full-text search: `unaccent()` e `array_to_string()` não são `IMMUTABLE`** —
   Postgres rejeita ambos dentro de uma coluna `GENERATED ALWAYS AS (...) STORED`. Solução
   padrão: funções SQL wrapper declaradas `IMMUTABLE` (`immutable_unaccent`,
   `immutable_array_to_string`) na migration `fulltext_search`. Sem isso a migration falha
   com `ERROR: generation expression is not immutable`.
   - Detalhe extra: a migration `init` já cria `searchVector` como coluna comum (porque
     `Unsupported("tsvector")` no schema Prisma vira uma coluna simples na migration
     base), então a migration `fulltext_search` precisa dar `DROP COLUMN` antes de recriar
     como `GENERATED`.
4. **`localhost` resolvendo para IPv6 quebra a conexão do Prisma com o Postgres no Docker
   Desktop + WSL2** — `Error P1001: Can't reach database server at localhost:5432` mesmo
   com o container saudável e a porta acessível via `Test-NetConnection`. Corrigido
   trocando `localhost` por `127.0.0.1` na `DATABASE_URL` (`.env` e `.env.example`).
5. **Login não redirecionava por papel** — `loginAction` usava `signIn(..., { redirectTo:
   callbackUrl })`, e como o middleware/proxy redireciona usuário não-autenticado para
   `/login?callbackUrl=/`, todo login (inclusive admin) caía na home, nunca no dashboard.
   Corrigido: `signIn(..., { redirect: false })`, depois busca o papel do usuário e decide
   o destino (`/admin` para admin, `/` para colaborador, exceto quando havia um
   `callbackUrl` explícito de deep-link).
6. **Bug crítico: editor Tiptap não salvava a resposta** — `@tiptap/react` v3 não
   re-renderiza o componente a cada transação por padrão (`shouldRerenderOnTransaction`
   não é mais `true` por padrão). O `<input type="hidden" value={editor.getHTML()}>`
   ficava com o valor inicial (vazio) porque o componente nunca re-renderizava depois de
   digitar. Isso afetava **todo** fluxo que usa o editor: criar pergunta, editar pergunta,
   converter sugestão em pergunta oficial — a resposta sempre salvava vazia. Corrigido
   adicionando `onUpdate` que grava o HTML em `useState`, usado no input escondido.
7. **Layout admin quebrado em mobile** — sidebar fixa de 224px sobrava mais da metade de
   uma tela de 375px, cortando os cards do dashboard. Corrigido: sidebar vira uma barra de
   navegação horizontal com scroll (`overflow-x-auto`) abaixo de `md:`, volta a ser
   sidebar vertical a partir de `md:`. `TopNav` também ajustado (nome do usuário escondido
   em telas pequenas, marca abreviada, `flex-wrap` em vez de altura fixa).
8. **Rate-limit de login contava também logins bem-sucedidos** — um único admin
   compartilhado (comum numa ferramenta interna) seria bloqueado após 5 logins corretos em
   5 minutos. Descoberto porque a própria suíte e2e (que loga como admin repetidamente em
   vários arquivos de teste) começou a tomar "Muitas tentativas". Corrigido: `rate-limit.ts`
   agora separa `isRateLimited` (leitura) de `recordFailedAttempt` (só chamado quando a
   senha está errada) e `clearRateLimit` (chamado em todo login bem-sucedido).
9. **NextAuth v5 rejeita todo request em produção (`next start`) com `UntrustedHost`** —
   dev mode (`next dev`) confia em localhost automaticamente, mas produção não, a menos
   que `trustHost: true` esteja no config. Sem isso, login falha silenciosamente em
   qualquer deploy self-hosted (não-Vercel). Adicionado em `auth.config.ts` com comentário
   explicando por quê.
10. Alguns bugs só nos próprios testes e2e (não no app): seletores ambíguos
    (`getByLabel("Pergunta")` batendo também no checkbox "Pergunta ativa";
    `getByRole("alert")`/`getByText` colidindo com o route-announcer de acessibilidade do
    Next.js) e um teste de sugestão que trocava de admin↔colaborador no meio do teste sem
    fazer logout primeiro (o proxy corretamente redireciona `/login` para `/` quando já
    autenticado, então o teste nunca alcançava o formulário de login da segunda conta).

## O que já foi implementado

Módulos 1-7, 9 (testes escritos **e agora executados com sucesso**) e 11 (documentação)
completos e validados contra banco real. Módulo 10 (segurança) parcialmente feito. Módulo
8 (refinamento visual) parcialmente feito — mobile do admin corrigido nesta sessão; falta
uma passada mais fina de polimento visual geral.

- **Autenticação**: NextAuth v5 (Credentials + bcryptjs), sessão JWT, `trustHost: true`,
  `src/proxy.ts` protegendo `/admin/**` por papel (roda em Node.js), toda Server Action
  também revalida `requireAdmin()`/`requireSession()`. Rate limiting no login (5 tentativas
  **falhas** / 5 min, em memória — `src/lib/rate-limit.ts`).
- **Banco**: schema Prisma completo, migration de full-text search (`tsvector`/`pg_trgm`
  com wrappers `IMMUTABLE`) **aplicada e validada** com dados reais.
- **CRUD de usuários/setores/perguntas**: validados manualmente e via e2e — criar, editar,
  ativar/desativar, excluir (com bloqueio de setor com perguntas dependentes).
- **Editor de resposta (Tiptap)**: funcionando corretamente após o fix do bug de
  não-re-renderização.
- **Busca**: full-text + trigram **confirmada funcionando com paráfrase real** (ex.:
  "cliente não quer assinar contrato" encontra "O que fazer quando o cliente não aceita
  assinar o contrato?").
- **Sugestões**: fluxo completo (enviar → aprovar → converter → aparece na busca)
  validado ponta a ponta, manualmente e via e2e.
- **Dashboard**: contadores e agregações confirmados corretos contra dados reais.
- **Testes**: 34 unitários/componente + **18 e2e, todos passando** contra Postgres real.

## Decisões técnicas importantes

(Ver lista de bugs acima para o contexto de várias destas decisões.)

- **Next.js 16 (App Router) + TypeScript**, Server Actions como backend.
- **`src/proxy.ts`** (não `middleware.ts`) — roda em Node.js por padrão no Next 16.
- **Prisma 7.10.0 fixado** (não a `8.0.0-rc.13` "latest"). Conexão via `prisma.config.ts`
  + `@prisma/adapter-pg`. Import do client: `.../generated/prisma/client` (caminho
  relativo, não alias `@/`, porque scripts via `tsx` não resolvem `tsconfig.json`).
- **DATABASE_URL usa `127.0.0.1`, nunca `localhost`** — ver bug #4 acima.
- **Full-text search** precisa de funções `IMMUTABLE` wrapper para `unaccent`/
  `array_to_string` — ver bug #3. SQL de referência completo em
  `prisma/migrations/20260907223034_fulltext_search/migration.sql`.
- **Sessão JWT** no NextAuth — simplicidade (sem tabela de sessão) para uma ferramenta
  interna de baixo volume; `maxAge` de 8h + recheck de `isActive` no callback `jwt`
  (que agora roda em Node.js via Proxy, sem restrição de Edge Runtime).
- **bcryptjs** em vez de `bcrypt` nativo.
- **Tailwind v4** via CSS (`@import`/`@plugin` em `globals.css`).
- **UI própria estilo shadcn** (`src/components/ui/`) construída à mão.
- **e2e do Playwright rodam contra build de produção** (`next build && next start`), não
  `next dev` — Turbopack em modo dev compila rotas sob demanda, e isso estourava o timeout
  padrão de 5s do `expect()` do Playwright na primeira visita a cada rota.
- **`global-setup.ts` do Playwright chama `tsx` como processo filho** (via
  `execFileSync(process.execPath, [tsxCliPath, scriptPath])`) em vez de importar
  `db-reset.ts` diretamente — o loader de TypeScript do próprio Playwright não entende o
  `import.meta.url` que o client gerado do Prisma 7 usa; `tsx` sim.
- **`npm audit`**: 4 vulnerabilidades "high" em `mysql2`/`deepmerge-ts`, dependências
  transitivas da CLI do Prisma (não código de produção). Risco aceito, documentado no
  README, não corrigido (corrigir rebaixaria o Prisma e desfaria a migração para
  driver adapters).

## Estrutura atual do projeto

```
faq-lab/ (raiz = C:\Users\Victor Gabriel Rios\Desktop\CODE)
  docker-compose.yml          # Postgres 16 local (banco "labplan_db")
  .env / .env.example         # DATABASE_URL usa 127.0.0.1, não localhost
  prisma.config.ts
  prisma/
    schema.prisma
    seed.ts
    migrations/
      20260907223017_init/
      20260907223034_fulltext_search/   # com as funções IMMUTABLE wrapper
  components.json
  vitest.config.mts
  playwright.config.ts        # webServer roda build+start; globalSetup via tsx child process
  README.md
  src/
    proxy.ts                  # Node.js runtime, protege /admin por papel
    app/ (public)/(colaborador)/(admin)/api — todos os módulos completos
    server/ (auth/actions/db/validation) — completo
    components/ (ui/ + por domínio) — completo, incluindo fix do Tiptap
    lib/ (rate-limit.ts com API isRateLimited/recordFailedAttempt/clearRateLimit)
    generated/prisma/          # client gerado (gitignored)
  tests/
    unit/ + component/         # 34 testes, todos passando
    e2e/                        # 6 specs, 18 testes, TODOS PASSANDO contra Postgres real
    fixtures/                  # test-users.ts, db-reset.ts, global-setup.ts
```

## O que falta implementar

1. **Módulo 8 — refinamento visual, resto**: mobile do admin já corrigido; falta uma
   passada de polimento geral (espaçamento, hover states, animações discretas) consultando
   a skill `frontend-design` com mais profundidade — o que foi feito nesta sessão foi
   reativo (corrigir quebra visível), não uma passada de design proativa.
2. **Módulo 10 — segurança, itens restantes**: revisão de cookies em produção real com
   HTTPS (o padrão do NextAuth já cobre `secure`/`sameSite`, mas nunca foi testado com
   HTTPS de verdade); auditoria linha a linha das mensagens de erro das Server Actions.
3. **Documentação do banco de teste**: mencionar no README que os e2e esperam um banco
   Postgres separado do dev (ex.: `labplan_test` no mesmo container) e como criá-lo.
4. **Deploy real**: nunca foi testado fora deste ambiente local (Docker Desktop + WSL2).

## Próximos passos exatos (retomar por aqui)

1. Adicionar ao README a criação do banco de teste (`CREATE DATABASE labplan_test;`) e o
   comando para rodar os e2e (`$env:DATABASE_URL=... ; npx playwright test`).
2. Fazer a passada de refinamento visual proativa (módulo 8) com a skill
   `frontend-design`, agora que dá pra ver a aplicação rodando de verdade.
3. Fechar os itens restantes do módulo 10 (segurança).
4. Se for para produção de verdade: testar com HTTPS real e revisar `NEXTAUTH_URL`/cookies.

Nesta sessão: WSL2/Docker habilitados, Postgres real conectado pela primeira vez, **10
bugs reais encontrados e corrigidos** só porque o sistema foi de fato testado (não apenas
lido) — a maioria invisível a typecheck/lint/testes unitários. 18/18 testes e2e passando
contra banco real. Login, busca (com paráfrase), sugestões, dashboard e CRUDs todos
validados manualmente no navegador embutido além dos testes automatizados.
