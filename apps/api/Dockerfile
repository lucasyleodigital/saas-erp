FROM node:20-alpine AS base
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# Build packages
FROM deps AS packages
WORKDIR /app
COPY packages/ ./packages/
RUN cd packages/types && pnpm build
RUN cd packages/database && pnpm build

# Generate Prisma client
COPY packages/database/prisma ./packages/database/prisma/
RUN cd packages/database && npx prisma generate

# Build API
FROM packages AS builder
WORKDIR /app
COPY apps/api/ ./apps/api/
COPY tsconfig.json ./
RUN cd apps/api && pnpm build

# Production image
FROM node:20-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "apps/api/dist/apps/api/src/main.js"]
