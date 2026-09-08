# Debian-based (not Alpine) — Prisma's query/migration engines have a history
# of musl/openssl compatibility issues on Alpine that aren't worth debugging
# on a server this project can't reach directly.
FROM node:22-bookworm-slim

WORKDIR /app

# Sem isto o Prisma avisa "failed to detect the libssl/openssl version to use"
# em toda execução de CLI (migrate/seed), poluindo o log do container.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# prisma.config.ts reads DATABASE_URL just to load the config — `prisma
# generate` never actually connects. This placeholder is only for the build;
# docker-compose supplies the real DATABASE_URL at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate
RUN npm run build

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p storage/attachments \
  && chown -R nextjs:nodejs /app

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Set only now — must stay unset for `npm ci`/`npm run build` above, otherwise
# devDependencies (typescript, tailwindcss, ...) needed to build wouldn't install.
ENV NODE_ENV=production

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
