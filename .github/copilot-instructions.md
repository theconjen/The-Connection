# The Connection – Copilot Guide

## 🧭 Architecture snapshot
- Monorepo managed by `pnpm` (Node 22) with packages `server`, `client`, `apps/web`, `shared`, and `mobile-app`.
- Backend runs from `server/index.ts` (Express 5) and `registerRoutes` which mounts feature-gated routers from `server/routes/**`; real-time chat uses Socket.IO on the same HTTP server.
- Data access goes through `server/storage.ts` which selects `DbStorage` (Drizzle + Neon) when `USE_DB=true`, otherwise falls back to `MemStorage`; keep both implementations in sync.
- Shared contracts live under `shared/`: `schema.ts` (Drizzle tables + Zod insert types), `app-schema.ts` (API payloads), and `services/*` (client-side fetch helpers).
- Web clients: legacy web app under `client/` built via root `vite.config.ts`, and the newer `apps/web/` app that reuses `shared` modules and Capacitor-friendly APIs; both rely on `shared/http`.

## ⚙️ Environment & config
- Read `ENVIRONMENT.md` for canonical env matrix; critical vars are `DATABASE_URL`, `USE_DB`, `SESSION_SECRET`, `VITE_API_BASE=/api`, `SHARED_ENV__API_BASE`.
- `server/db.ts` will throw if `DATABASE_URL` is missing; set `USE_DB=false` to run against the in-memory store.
- Feature availability is toggled via `shared/features.ts` (mirrored JS export for runtime); update when exposing new modules.
- Email sends route through `server/email.ts` and default to mock mode unless `ENABLE_REAL_EMAIL=true` and AWS keys are provided.

## 🛠️ Everyday workflows
- Install deps with `pnpm install`.
- Start the API locally with `USE_DB=true DATABASE_URL=… pnpm exec tsx server/index.ts`; migrations (`runAllMigrations`) run automatically when the DB is enabled.
- Launch the `client/` frontend via `pnpm exec vite --config vite.config.ts`; the `apps/web/` app runs with `pnpm --filter web dev`.
- Build artifacts with `pnpm run build` (calls `scripts/build-web.mjs` + `scripts/build-server.mjs`) or individually with `build:web` / `build:server`.
- Generate new Drizzle SQL via `pnpm dlx drizzle-kit generate` and commit both `migrations/` and `server/migrations/*` helpers.

## ✅ Testing expectations
- API contract tests live in `tests/api/*`; run them with `pnpm run test:api` (they bootstrap the lightweight `server/test-app.ts` and stub storage expectations).
- Web E2E tests are Playwright-based under `apps/web/tests/`; run with `pnpm --filter web test:e2e`. Always stub network using `installFetchStub` and assert via `data-testid` (see `apps/web/TESTING.md`).
- Shared code is type-checked via `pnpm exec tsc -p tsconfig.json --noEmit` when you need stricter validation (CI falls back to this if `build:check` is absent).

## 🧩 Implementation patterns
- When adding endpoints, wire them in `server/routes.ts` (respect feature flags) and expose typed helpers in `shared/services/*`; update `shared/app-schema.ts` for any payload changes and keep Vitest tests in sync.
- Server logic should delegate persistence to methods on `storage`; extend both `DbStorage` and `MemStorage` to retain parity when `USE_DB=false`.
- Frontend code should compose URLs via `shared/http.http()` or `apps/web/src/lib/api.ts` to preserve cookie handling and avoid double `/api` prefixes.
- Socket features expect clients to emit `join_room`, `new_message`, `send_dm`, etc.; reuse the authentication guard that checks `socket.handshake.auth.userId`.
- Use the shadcn/Tailwind design tokens in `client/src/components/ui` and keep new components colocated under `client/src/components` or `apps/web/src/components`, exporting from existing barrel files when possible.

## 🚨 Gotchas
- CORS defaults only allow known origins; add preview domains via `CORS_ALLOWED_ORIGINS` before testing new hosts.
- The feed must return `{ items, nextCursor }`: `tests/api/feed.pagination.test.ts` will fail if you regress to the legacy array shape.
- `shared-env` is resolved differently per app (see `apps/web/vite.config.ts`); ensure new environments re-export `API_BASE`.
- Email/test logs can flood the console—leave mock mode enabled in dev unless you truly need AWS SES.
- Update both `dist-server/` builds and deployment manifests if you alter entrypoints or bundle outputs.
