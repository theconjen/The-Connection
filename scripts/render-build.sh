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
  # Run pnpm install and capture full output into a file without using a pipe
  # (so `set -e` doesn't cause an early exit). Save exit code and always
  # print a portion of the log for Render to show.
  /bin/echo "render-build: running pnpm install and writing log to /tmp/pnpm-install.log"
  INSTALL_EXIT=0
  # Use conservative network concurrency and longer fetch timeout to reduce
  # CI flakes (rate limits, memory pressure, network timeouts)
  pnpm install --no-frozen-lockfile --network-concurrency=1 --fetch-timeout=60000 > /tmp/pnpm-install.log 2>&1 || INSTALL_EXIT=$?

  echo "render-build: pnpm install exit code: ${INSTALL_EXIT}"
  echo "render-build: ---- BEGIN /tmp/pnpm-install.log (last 300 lines) ----"
  tail -n 300 /tmp/pnpm-install.log || true
  echo "render-build: ---- END /tmp/pnpm-install.log ----"

  if [ "$INSTALL_EXIT" -ne 0 ]; then
    echo "render-build: pnpm install failed; full log saved at /tmp/pnpm-install.log"
    exit $INSTALL_EXIT
  fi
}

echo "render-build: running pnpm run build"
pnpm run build

echo "render-build: done"
