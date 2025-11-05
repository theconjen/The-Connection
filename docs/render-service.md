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

## Connecting a New Render Service

Use the repository root `render.yaml` blueprint to provision a fresh service (or sync configuration with an existing one):

```bash
render blueprint deploy
```

This blueprint sets up a Node web service named `the-connection-api` pointed at the `main` branch of this repository. Double-check and adjust the following after deployment:

- **Environment variables** – `SESSION_SECRET`, `DATABASE_URL`, and any other secrets are declared with `sync: false`, so Render will prompt you to provide values in the dashboard.
- **Database/Redis attachments** – update the blueprint or dashboard to link managed databases and populate `DATABASE_URL` / `REDIS_URL` as needed.
- **Region / plan** – defaults to the `starter` plan in the `oregon` region; tweak these fields in `render.yaml` if you need a different configuration.

After the first deployment, confirm the `/health` endpoint returns `{"status":"ok"}` to verify connectivity.
