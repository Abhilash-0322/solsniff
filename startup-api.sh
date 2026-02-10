#!/bin/bash
set -e

echo "=== Starting Solsniff API ==="
cd /home/site/wwwroot

echo "Installing dependencies..."
npm install --production=false

echo "Generating Prisma Client..."
cd packages/database
npx prisma generate
cd ../..

echo "Building shared packages..."
npm run build --workspace=@solsniff/shared-types || true
npm run build --workspace=@solsniff/config || true
npm run build --workspace=@solsniff/database || true
npm run build --workspace=@solsniff/data-collectors || true
npm run build --workspace=@solsniff/ai-engine || true

echo "Building API..."
npm run build --workspace=@solsniff/api

echo "Starting API server..."
cd apps/api
PORT=${PORT:-8080} node dist/index.js
