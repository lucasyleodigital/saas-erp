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

# Copy workspace config and package manifests so pnpm can install correctly
COPY --from=api-builder /app/package.json        ./package.json
COPY --from=api-builder /app/pnpm-lock.yaml      ./pnpm-lock.yaml
COPY --from=api-builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=api-builder /app/packages/types/package.json    ./packages/types/package.json
COPY --from=api-builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=api-builder /app/apps/api/package.json          ./apps/api/package.json

# Install production dependencies — lets pnpm recreate its symlink structure natively
RUN pnpm install --prod --frozen-lockfile

# Copy built artifacts on top
COPY --from=api-builder /app/packages            ./packages
COPY --from=api-builder /app/apps/api/dist       ./apps/api/dist

# Re-generate Prisma client so it is available in the production node_modules
COPY --from=api-builder /app/packages/database/prisma ./packages/database/prisma
RUN cd packages/database && npx prisma generate

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "apps/api/dist/apps/api/src/main.js"]
