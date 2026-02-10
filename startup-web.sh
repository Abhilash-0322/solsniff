#!/bin/bash
set -e

echo "=== Starting Solsniff Web ==="
cd /home/site/wwwroot

echo "Installing dependencies..."
npm install --production=false

echo "Building web app..."
npm run build --workspace=@solsniff/web

echo "Starting web server..."
cd apps/web
npm start
