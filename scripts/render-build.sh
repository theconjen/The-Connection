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
{
  echo "render-build: starting pnpm install (logging to /tmp/pnpm-install.log)"
  pnpm install --no-frozen-lockfile 2>&1 | tee /tmp/pnpm-install.log
  INSTALL_EXIT=${PIPESTATUS[0]:-0}
  if [ "$INSTALL_EXIT" -ne 0 ]; then
    echo "render-build: pnpm install failed with exit $INSTALL_EXIT; showing last 200 lines of log:"
    tail -n 200 /tmp/pnpm-install.log || true
    exit $INSTALL_EXIT
  fi
}

echo "render-build: running pnpm run build"
pnpm run build

echo "render-build: done"
