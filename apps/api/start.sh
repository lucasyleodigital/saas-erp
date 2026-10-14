#!/bin/sh

echo "[start] Running prisma db push..."
cd /app/packages/database
npx prisma db push --accept-data-loss 2>&1 && echo "[start] DB schema synced." || echo "[start] Warning: prisma db push exited non-zero, continuing anyway..."

# Las tablas nuevas que crea db push nacen sin RLS: Supabase las expondría por su API REST
echo "[start] Enabling RLS on new tables..."
npx prisma db execute --file enable-rls.sql --schema prisma/schema.prisma 2>&1 && echo "[start] RLS OK." || echo "[start] Warning: enable-rls.sql failed, continuing anyway..."

echo "[start] Starting API..."
cd /app
exec node apps/api/dist/apps/api/src/main.js
