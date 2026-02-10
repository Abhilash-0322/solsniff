#!/bin/bash
set -e

echo "Installing root dependencies..."
npm install

echo "Building packages..."
npm run build --workspace=@solsniff/shared-types
npm run build --workspace=@solsniff/config
npm run build --workspace=@solsniff/database
npm run build --workspace=@solsniff/data-collectors
npm run build --workspace=@solsniff/ai-engine

echo "Generating Prisma Client..."
npm run db:generate

echo "Building API..."
npm run build --workspace=@solsniff/api

echo "Deployment complete!"
