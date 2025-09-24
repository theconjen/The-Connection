#!/bin/bash

# Production deployment script for DigitalOcean
# Handles memory constraints and proper build setup

set -e

echo "Starting production deployment..."

# Set memory limit for Node.js processes
export NODE_OPTIONS="--max-old-space-size=512"

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/ dist-server/

# Install production dependencies only
echo "Installing production dependencies..."
npm ci --production

# Install dev dependencies needed for build
echo "Installing build dependencies..."
npm install --no-save vite @vitejs/plugin-react vite-plugin-pwa esbuild tsx

# Build client first (less memory intensive)
echo "Building client..."
npm run build 2>&1 | head -n 100  # Limit output to prevent memory issues

# Create server build directory
mkdir -p dist-server

# Build server with memory constraints
echo "Building server..."
NODE_OPTIONS="--max-old-space-size=512" npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --format=esm \
  --outfile=dist-server/index.js \
  --external:vite \
  --external:@vitejs/plugin-react \
  --external:vite-plugin-pwa \
  --define:process.env.USE_DB='"true"'

# Create vite.js shim for production
echo "Creating vite production shim..."
cat > dist-server/vite.js << 'EOF'
export function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite() {
  return null;
}

export function serveStatic(app) {
  const express = require('express');
  const path = require('path');
  app.use(express.static(path.join(process.cwd(), 'dist/public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));
  });
}
EOF

# Ensure shared schema is available
echo "Compiling shared schema..."
mkdir -p dist-server/shared
npx esbuild shared/schema.ts --format=esm --outfile=dist-server/shared/schema.js

echo "Build complete!"
echo "To start the application:"
echo "NODE_ENV=production USE_DB=true PORT=5000 node -r tsconfig-paths/register dist-server/index.js"
