# Render Web Service (API)

- **Service type:** Web Service
- **Root directory:** Repository root (contains `server/index.ts` and build scripts)
- **Build command:** `pnpm install --frozen-lockfile && pnpm -w build`
- **Start command:** `node dist-server/index.js`
- **Environment variables:**
  - `NODE_ENV=production`
  - `SESSION_SECRET` (Render Secret)
  - `USE_DB=true` plus the usual database credentials (`DATABASE_URL`, etc.) if running against Postgres
- **Health check path:** `/health`
- **Auto deploy:** Enabled for the `main` branch

The root build script (`pnpm -w build`) runs the Vite client build and compiles the Express server into `dist-server/index.js`, which the start command consumes.
