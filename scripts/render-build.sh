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

echo "render-build: running pnpm install --no-frozen-lockfile (with extra logging)"
{
  echo "render-build: starting pnpm install (logging to /tmp/pnpm-install.log and /tmp/pnpm-install.ndjson)"
  # Run pnpm install and capture full output into files. We attempt both
  # a human-readable log and the ndjson reporter which contains structured
  # event details that often include lifecycle/script stderr not shown in
  # the default install output on some hosts.
  /bin/echo "render-build: running pnpm install and writing logs to /tmp/pnpm-install.log and /tmp/pnpm-install.ndjson"
  INSTALL_EXIT=0
  # Use conservative network concurrency and longer fetch timeout to reduce
  # CI flakes (rate limits, memory pressure, network timeouts)
  # First try the ndjson reporter (structured). Keep PNPM_LOG_LEVEL=debug to surface more info.
  PNPM_LOG_LEVEL=debug pnpm install --no-frozen-lockfile --network-concurrency=1 --fetch-timeout=60000 --reporter=ndjson > /tmp/pnpm-install.ndjson 2>&1 || INSTALL_EXIT=$?
  # Also create a conventional verbose log to capture anything the ndjson reporter misses.
  if [ ${INSTALL_EXIT} -eq 0 ]; then
    # ndjson run succeeded; still save a plain log for convenience
    pnpm install --no-frozen-lockfile --network-concurrency=1 --fetch-timeout=60000 --reporter=ndjson > /tmp/pnpm-install.log 2>&1 || true
  else
    # ndjson run failed; run again with verbose/plain reporter to capture fallback output
    pnpm install --no-frozen-lockfile --network-concurrency=1 --fetch-timeout=60000 --reporter=append-only > /tmp/pnpm-install.log 2>&1 || true
  fi

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

    # If pnpm produced an ndjson report, print parsed error events to help
    # surface lifecycle or script stderr which may not appear in the plain log.
    if [ -s /tmp/pnpm-install.ndjson ]; then
      echo "render-build: /tmp/pnpm-install.ndjson -> present; parsing for errors"
      # Use Node (available on Render) to parse ndjson safely and print
      # events that look like errors or lifecycle failures.
      node - <<'NODECODE' || true
const fs = require('fs');
try {
  const data = fs.readFileSync('/tmp/pnpm-install.ndjson', 'utf8').trim();
  if (!data) { process.exit(0); }
  const lines = data.split('\n');
  for (let i = 0; i < lines.length; i++) {
    try {
      const o = JSON.parse(lines[i]);
      // Print objects that look like errors, lifecycle events, or contain stderr
      const isError = o.level === 'error' || o.event === 'error' || (o.error && o.error.message) || (o.data && /ELIFECYCLE|ERR!|error|Failed/i.test(String(o.data)));
      const isLifecycle = (o.command && /install|postinstall|prepare|build|prepublish/.test(o.command)) || (o.name && /lifecycle/.test(String(o.name)));
      if (isError || isLifecycle) {
        console.log('render-build: NDJSON EVENT --------------------');
        console.log(JSON.stringify(o, null, 2));
      }
    } catch (e) {
      // ignore parse errors for individual lines
    }
  }
  // also print the last 200 ndjson lines for manual inspection
  console.log('render-build: ---- TAIL /tmp/pnpm-install.ndjson (200 lines) ----');
  const tail = lines.slice(-200).join('\n');
  console.log(tail);
  console.log('render-build: ---- END TAIL ndjson ----');
} catch (err) {
  // if reading fails, print a notice
  console.error('render-build: failed to read /tmp/pnpm-install.ndjson:', err && err.message);
}
NODECODE
    else
      echo "render-build: /tmp/pnpm-install.ndjson -> MISSING or empty"
    fi

    exit $INSTALL_EXIT
  fi
}

echo "render-build: running pnpm run build"
pnpm run build

echo "render-build: done"
