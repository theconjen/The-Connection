#!/bin/bash
set -euo pipefail

# Convenience script to start the Expo dev server for the new mobile app
APP_DIR="mobile-app/TheConnectionMobile-new"
PORT="8082"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm is not installed. Run 'corepack enable pnpm' first." >&2
  exit 1
fi

if [ ! -d "$APP_DIR" ]; then
  echo "❌ Could not find $APP_DIR. Make sure you're running this from the repo root." >&2
  exit 1
fi

cd "$APP_DIR"

# Ensure dependencies are installed so `pnpm exec expo` can find the CLI
if [ ! -d node_modules ]; then
  echo "📦 Installing mobile app dependencies (pnpm install)..."
  pnpm install
fi

echo "🚀 Starting Expo on port $PORT (clear caches)..."
pnpm exec expo start --clear --port "$PORT"
