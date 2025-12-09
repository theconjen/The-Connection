#!/bin/bash

# Production deployment script for DigitalOcean
# Handles memory constraints and proper build setup

set -euo pipefail

echo "Starting production deployment..."

# Set memory limit for Node.js processes
export NODE_OPTIONS="--max-old-space-size=512"

# Ensure pnpm is available
corepack enable > /dev/null 2>&1 || true
corepack prepare pnpm@10.16.1 --activate

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/ dist-server/

# Install workspace dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build client first (less memory intensive)
echo "Building client..."
pnpm run build:client 2>&1 | head -n 200

# Create server build directory
mkdir -p dist-server

# Build server with memory constraints
echo "Building server..."
NODE_OPTIONS="--max-old-space-size=512" pnpm run build:server

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
pnpm exec esbuild shared/schema.ts --format=esm --outfile=dist-server/shared/schema.js

echo "Build complete!"
echo "To start the application:"
echo "NODE_ENV=production USE_DB=true PORT=5000 node dist-server/index.cjs"
