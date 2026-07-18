#!/bin/sh

echo "[start] Running prisma db push..."
cd /app/packages/database
npx prisma db push --accept-data-loss 2>&1 && echo "[start] DB schema synced." || echo "[start] Warning: prisma db push exited non-zero, continuing anyway..."

echo "[start] Starting API..."
cd /app
exec node apps/api/dist/apps/api/src/main.js
