#!/bin/sh
set -e

echo "[start] Running prisma db push..."
cd /app/packages/database
npx prisma db push --accept-data-loss
echo "[start] DB schema synced."

echo "[start] Starting API..."
cd /app
exec node apps/api/dist/apps/api/src/main.js
