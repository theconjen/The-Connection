#!/usr/bin/env bash
set -euo pipefail

# Sync selected image assets from public-like folders into the mobile app's assets/web folder
# Usage: bash ./scripts/sync-web-assets.sh [SOURCE_DIR]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_PUBLIC_DIR="$(cd "$APP_DIR/../../web/public" && pwd)" || true
ROOT_PUBLIC_DIR="$(cd "$APP_DIR/../../public" && pwd)" || true
CLIENT_ASSETS_DIR="$(cd "$APP_DIR/../../client/src/assets" && pwd)" || true
TARGET_DIR="$APP_DIR/assets/web"

mkdir -p "$TARGET_DIR"

sync_from() {
  local SRC="$1"
  if [ -d "$SRC" ]; then
    rsync -av --delete \
      --include='*/' \
      --include='*.png' --include='*.jpg' --include='*.jpeg' --include='*.webp' --include='*.gif' --include='*.svg' \
      --exclude='*' \
      "$SRC/" "$TARGET_DIR/"
    echo "Synced: $SRC -> $TARGET_DIR"
  fi
}

if [ "${1:-}" != "" ]; then
  if [ -d "$1" ]; then
    sync_from "$1"
    exit 0
  else
    echo "Source directory does not exist: $1" >&2
    exit 1
  fi
fi

# Default: sync from known locations if they exist
sync_from "$WEB_PUBLIC_DIR"
sync_from "$ROOT_PUBLIC_DIR"
sync_from "$CLIENT_ASSETS_DIR"

if [ -z "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]; then
  echo "No assets found to sync." >&2
fi
