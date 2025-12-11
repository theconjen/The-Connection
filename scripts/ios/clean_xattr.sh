#!/usr/bin/env bash
# Clean extended attributes and resource forks that can break codesign
set -euo pipefail

ROOT_PATH="${1:-ios}"

echo "Running xattr cleanup under $ROOT_PATH"

# Try recursive xattr clear first
if command -v xattr >/dev/null 2>&1; then
  echo "Clearing extended attributes with xattr -rc"
  xattr -rc "$ROOT_PATH" || true
fi

# macOS sometimes keeps resource forks in ._ files; dot_clean can merge them
if command -v dot_clean >/dev/null 2>&1; then
  echo "Running dot_clean to merge resource forks"
  dot_clean "$ROOT_PATH" || true
fi

# As a final fallback try copying without resource forks (cp -X) into a temp dir
TMP_DIR="$(mktemp -d)"
echo "Copying to temp dir to remove resource forks: $TMP_DIR"
if cp -X -R "$ROOT_PATH/" "$TMP_DIR/" 2>/dev/null; then
  echo "Copy succeeded, moving back"
  rsync -a --delete "$TMP_DIR/" "$ROOT_PATH/"
fi

echo "xattr cleanup complete"
