#!/usr/bin/env bash
set -euo pipefail

# Render build helper (idempotent)
# - ensures pnpm@10.19.0 is available (installs if missing or different)
# - runs install and build with the same flags used on Render

DESIRED_PNPM="10.19.0"

echo "render-build: checking pnpm..."
# Print Node/pnpm environment information to aid diagnosis when CI fails
echo "render-build: node -> $(node -v 2>/dev/null || echo 'node_missing')"
echo "render-build: pnpm -> $(pnpm -v 2>/dev/null || echo 'pnpm_missing')"
echo "render-build: npm  -> $(npm -v 2>/dev/null || echo 'npm_missing')"
echo "render-build: COREPACK -> $(corepack -v 2>/dev/null || echo 'corepack_missing')"
# Print package.json engine requirement if available
if [ -f package.json ]; then
  REQ_NODE=$(node -e "try{console.log(require('./package.json').engines && require('./package.json').engines.node||'') }catch(e){process.exit(0)}" 2>/dev/null || true)
  echo "render-build: package.json engines.node -> ${REQ_NODE:-MISSING}"
fi
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

  # Persist the exit code to a file so external shells (Render) can inspect it
  echo "${INSTALL_EXIT}" > /tmp/pnpm-install.exitcode || true

  echo "render-build: pnpm install exit code: ${INSTALL_EXIT}"
  echo "render-build: ---- BEGIN /tmp/pnpm-install.log (head) ----"
  head -n 200 /tmp/pnpm-install.log || true
  echo "render-build: ---- END /tmp/pnpm-install.log (head) ----"
  echo "render-build: ---- BEGIN /tmp/pnpm-install.log (tail) ----"
  tail -n 300 /tmp/pnpm-install.log || true
  echo "render-build: ---- END /tmp/pnpm-install.log (tail) ----"

  if [ "$INSTALL_EXIT" -ne 0 ]; then
    echo "render-build: pnpm install failed; full log saved at /tmp/pnpm-install.log"
    echo "render-build: /tmp/pnpm-install.exitcode -> $(cat /tmp/pnpm-install.exitcode 2>/dev/null || echo 'MISSING')"
    echo "render-build: /tmp/pnpm-install.log lines -> $(wc -l < /tmp/pnpm-install.log 2>/dev/null || echo '0')"

    echo "render-build: Searching for error markers in /tmp/pnpm-install.log"
    # Print grep results with line numbers (first 200 matches shown)
    grep -n -E "ELIFECYCLE|ERR!|\berror\b|Failed" /tmp/pnpm-install.log | sed -n '1,200p' || true

    # For each matching line, print a window of context (30 lines before/after)
    # This avoids relying on non-portable sed arithmetic on some hosts.
    grep -n -E "ELIFECYCLE|ERR!|\berror\b|Failed" /tmp/pnpm-install.log | cut -d: -f1 | uniq | while read -r LN; do
      if [ -z "${LN}" ]; then
        continue
      fi
      START=$((LN - 30))
      if [ ${START} -lt 1 ]; then
        START=1
      fi
      END=$((LN + 30))
      echo "render-build: ---- CONTEXT around line ${LN} (lines ${START}-${END}) ----"
      sed -n "${START},${END}p" /tmp/pnpm-install.log || true
      echo "render-build: ---- END CONTEXT ${LN} ----"
    done

    echo "render-build: ---- FULL /tmp/pnpm-install.log (tail 2000 lines) ----"
    tail -n 2000 /tmp/pnpm-install.log || true
    echo "render-build: ---- END FULL LOG (tail) ----"

    exit $INSTALL_EXIT
  fi
}

echo "render-build: running pnpm run build"
pnpm run build

echo "render-build: done"
