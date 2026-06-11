FROM node:20-alpine AS base
RUN npm install -g pnpm@10

# ── Install all dependencies ──────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json    ./packages/types/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json          ./apps/api/
RUN pnpm install --frozen-lockfile

# ── Build packages/types ──────────────────────────────────────────────────────
FROM deps AS types-builder
WORKDIR /app
COPY packages/types/ ./packages/types/
RUN cd packages/types && pnpm build

# ── Build packages/database + Prisma client ───────────────────────────────────
FROM types-builder AS db-builder
WORKDIR /app
COPY packages/database/ ./packages/database/
RUN cd packages/database && npx prisma generate && pnpm build

# ── Build NestJS API ──────────────────────────────────────────────────────────
FROM db-builder AS api-builder
WORKDIR /app
COPY apps/api/ ./apps/api/
RUN cd apps/api && pnpm build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN npm install -g pnpm@10
WORKDIR /app

COPY --from=api-builder /app/node_modules        ./node_modules
COPY --from=api-builder /app/packages            ./packages
COPY --from=api-builder /app/apps/api/dist       ./apps/api/dist
COPY --from=api-builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=api-builder /app/package.json        ./package.json
COPY --from=api-builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "apps/api/dist/apps/api/src/main.js"]
