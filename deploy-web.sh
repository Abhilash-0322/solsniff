#!/bin/bash
set -e

echo "Installing root dependencies..."
npm install

echo "Building web app..."
npm run build --workspace=@solsniff/web

echo "Deployment complete!"
