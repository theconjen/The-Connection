#!/usr/bin/env bash
set -euo pipefail

# Render build helper (idempotent)
# - ensures pnpm@10.19.0 is available (installs if missing or different)
# - runs install and build with the same flags used on Render

DESIRED_PNPM="10.19.0"

echo "render-build: checking pnpm..."
if command -v pnpm >/dev/null 2>&1; then
  CUR=$(pnpm -v || true)
  echo "render-build: pnpm ${CUR} found; using existing pnpm (will not attempt global install on Render)"
  # On Render the global npm install frequently fails with EEXIST when a pnpm
  # binary is already present. To avoid noisy failures and permission issues,
  # prefer the existing pnpm binary. If you need a different pnpm version,
  # update the environment image or change the build image used by Render.
else
  echo "render-build: pnpm not found; installing pnpm@${DESIRED_PNPM}"
  npm i -g pnpm@"${DESIRED_PNPM}"
fi

echo "render-build: running pnpm install --no-frozen-lockfile"
pnpm install --no-frozen-lockfile

echo "render-build: running pnpm run build"
pnpm run build

echo "render-build: done"
