Local development notes

By default the server runs in an in-memory mode (no persistent DB) unless you set USE_DB=true and provide DATABASE_URL.

Start backend (in-memory):

pnpm exec tsx server/index.ts

Start Vite dev (web):

cd apps/web
pnpm exec vite

Vite dev server proxies /api to http://localhost:3000 so frontend requests to /api/* will reach the backend.

To run with a real DB:

USE_DB=true DATABASE_URL="postgres://user:pass@host:5432/db" pnpm exec tsx server/index.ts

Notes
- We applied temporary pnpm.overrides to pin patched transitive deps (undici, esbuild, js-yaml). The overrides are in the root `package.json` and recorded in `pnpm-lock.yaml`.
- Before merging, consider upgrading the direct dependents so we can remove the overrides.
