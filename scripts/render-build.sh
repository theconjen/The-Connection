#!/usr/bin/env bash
set -euo pipefail

# Render build helper (idempotent)
# - ensures pnpm@10.19.0 is available (installs if missing or different)
# - runs install and build with the same flags used on Render

DESIRED_PNPM="10.19.0"

echo "render-build: checking pnpm..."
if command -v pnpm >/dev/null 2>&1; then
  CUR=$(pnpm -v || true)
  if [ "${CUR}" != "${DESIRED_PNPM}" ]; then
    echo "render-build: pnpm ${CUR} found, attempting to install ${DESIRED_PNPM} (will continue with existing pnpm on failure)"
    if npm i -g pnpm@"${DESIRED_PNPM}"; then
      echo "render-build: installed pnpm@${DESIRED_PNPM}"
    else
      echo "render-build: npm install pnpm failed; continuing with pnpm ${CUR}"
    fi
  else
    echo "render-build: pnpm ${DESIRED_PNPM} already installed"
  fi
else
  echo "render-build: pnpm not found; installing pnpm@${DESIRED_PNPM}"
  npm i -g pnpm@"${DESIRED_PNPM}"
fi

echo "render-build: running pnpm install --no-frozen-lockfile"
pnpm install --no-frozen-lockfile

echo "render-build: running pnpm run build"
pnpm run build

echo "render-build: done"
