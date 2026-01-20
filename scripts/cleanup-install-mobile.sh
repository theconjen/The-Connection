#!/usr/bin/env bash
set -euo pipefail

# Cleanup and install script for The-Connection
# - Stops common node/Expo/Metro processes
# - Moves problematic package dir to /tmp backup
# - Cleans pnpm caches and runs workspace install
# - Adds expo-notifications and expo-device into mobile package
# Logs are written to /tmp/cleanup-install-mobile-<ts>.log

TS=$(date +%s)
LOG="/tmp/cleanup-install-mobile-${TS}.log"
echo "Log: $LOG"
exec > >(tee -a "$LOG") 2>&1

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
echo "Root: $ROOT_DIR"
cd "$ROOT_DIR"

echo "1) Stopping common processes (expo, metro, react-native, node)"
pkill -f "expo" || true
pkill -f "metro" || true
pkill -f "react-native" || true
pkill -f "node" || true

echo "2) Listing processes that might be holding node_modules (first 80 lines)"
if command -v lsof >/dev/null 2>&1; then
  lsof +D "$ROOT_DIR/node_modules" 2>/dev/null | head -n 80 || true
else
  echo "lsof not available; skipping listing"
fi

BACKUP_BASE="/tmp/cleanup-backup-${TS}"
mkdir -p "$BACKUP_BASE"

PROBLEM_DIR="$ROOT_DIR/node_modules/@smithy/middleware-content-length"
if [ -d "$PROBLEM_DIR" ]; then
  echo "3) Moving problematic dir to backup: $PROBLEM_DIR -> $BACKUP_BASE"
  mv "$PROBLEM_DIR" "$BACKUP_BASE/" || sudo mv "$PROBLEM_DIR" "$BACKUP_BASE/"
  echo "moved. backup contents:"; ls -la "$BACKUP_BASE" || true
else
  echo "3) Problem dir not present: $PROBLEM_DIR"
fi

MOBILE_NODE_MODULES="$ROOT_DIR/mobile-app/TheConnectionMobile-new/node_modules"
if [ -d "$MOBILE_NODE_MODULES" ]; then
  echo "4) Moving mobile node_modules to backup (may free locks): $MOBILE_NODE_MODULES -> $BACKUP_BASE"
  mv "$MOBILE_NODE_MODULES" "$BACKUP_BASE/" || sudo mv "$MOBILE_NODE_MODULES" "$BACKUP_BASE/"
fi

echo "5) Cleaning pnpm store and cache"
pnpm store prune || true
pnpm cache clean --all || true

echo "6) Running workspace pnpm install (this may take several minutes)"
pnpm install --reporter ndjson > "/tmp/pnpm-install-${TS}.ndjson" 2>&1 || {
  echo "pnpm install failed. See /tmp/pnpm-install-${TS}.ndjson for details"
  tail -n 200 "/tmp/pnpm-install-${TS}.ndjson" || true
  exit 1
}

echo "7) Adding Expo native modules into mobile package (skip Husky to avoid lifecycle issues)"
export HUSKY=0
pnpm --filter ./mobile-app/TheConnectionMobile-new add expo-notifications@~0.32.15 expo-device@~8.0.10 > "/tmp/pnpm-add-mobile-${TS}.log" 2>&1 || {
  echo "pnpm add failed. See /tmp/pnpm-add-mobile-${TS}.log for details"
  tail -n 200 "/tmp/pnpm-add-mobile-${TS}.log" || true
  exit 1
}

echo "SUCCESS: Expo native modules added. See logs:"
echo "  /tmp/pnpm-install-${TS}.ndjson"
echo "  /tmp/pnpm-add-mobile-${TS}.log"
echo "Backup of moved dirs: $BACKUP_BASE"

echo "You can now run the mobile dev server:" 
echo "  cd mobile-app/TheConnectionMobile-new && npx expo start"

exit 0
