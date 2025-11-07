# Render Web Service (API)

- **Service type:** Web Service
- **Root directory:** Repository root (contains `server/index.ts` and build scripts)
- **Build command:** `corepack enable && corepack prepare pnpm@10.19.0 --activate && (pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile) && pnpm -w build`
- **Start command:** `node dist-server/index.cjs`
- **Environment variables:**
  - `NODE_ENV=production`
  - `SESSION_SECRET=372f79df29a1113a00d5bde03125eddc` (provide via Render Secret)
  - `DATABASE_URL=postgresql://neondb_owner:npg_MfB8mlWiSkN4@ep-hidden-band-adzjfzr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
  - `USE_DB=true` (Postgres-enabled deploy)
- **Health check path:** `/health`
- **Auto deploy:** Enabled for the `main` branch

The root build script (`pnpm -w build`) runs the Vite client build and compiles the Express server into `dist-server/index.cjs`, which the start command consumes.

## Connecting a New Render Service

Use the repository root `render.yaml` blueprint to provision a fresh service (or sync configuration with an existing one):

```bash
render blueprint deploy
```

This blueprint sets up a Node web service named `the-connection-api` pointed at the `main` branch of this repository. Double-check and adjust the following after deployment:

- **Environment variables** – `SESSION_SECRET` remains a Render secret; `DATABASE_URL` is pre-populated in the blueprint with the Neon connection string above. Provide any additional secrets through the dashboard as needed.
- **Database/Redis attachments** – update the blueprint or dashboard to link managed databases and populate `DATABASE_URL` / `REDIS_URL` as needed.
- **Region / plan** – defaults to the `starter` plan in the `oregon` region; tweak these fields in `render.yaml` if you need a different configuration.

After the first deployment, confirm the `/health` endpoint returns `{"status":"ok"}` to verify connectivity.

## Environment Variables Reference

The service relies on the same configuration described in [`ENVIRONMENT.md`](../ENVIRONMENT.md). Render should include at least the following keys:

| Key | Required on Render | Purpose | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | ✅ | Enables production-only branches (secure cookies, CORS restrictions). | Set to `production` (already in blueprint). |
| `USE_DB` | ✅ | Turns on Postgres migrations and session storage. | Keep `true` unless intentionally running stateless. |
| `SESSION_SECRET` | ✅ | Signs Express sessions. | Generate a long random value and store as a Render Secret. |
| `DATABASE_URL` | ✅ (when `USE_DB=true`) | Postgres connection string for Neon/Render or another managed DB. | Blueprint defaults to `postgresql://neondb_owner:npg_MfB8mlWiSkN4@ep-hidden-band-adzjfzr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`. |
| `CORS_ALLOWED_ORIGINS` | ✅ | Allows deployed web/native origins beyond the defaults. | Include every site or mobile origin that should reach the API (comma separated). |
| `APP_DOMAIN` | ✅ | Controls canonical URLs and outbound email links. | Match the public host Render serves (e.g. `api.theconnection.app`). |
| `REDIS_URL` | Optional | Allows wiring up a managed Redis instance. | Blueprint declares the key; safe to leave empty until redis is used. |
| `COOKIE_SECURE` | Optional | Force-disable secure cookies. | Leave unset (defaults to `true`). Only override for debugging on plain HTTP. |
| `ADMIN_NOTIFICATION_EMAIL` | Optional | Target inbox for admin alert emails. | Falls back to the default sender if omitted. |
| `JWT_SECRET` | Optional (recommended) | Secret used for JWT helpers. | Defaults to `'dev-secret'`; set a unique value in production. |
| `SENTRY_DSN` / `SENTRY_TRACES_SAMPLE_RATE` | Optional | Enable Sentry error and trace reporting. | Provide DSN+sampling rate if observability is desired. |
| `ENABLE_REAL_EMAIL` | Optional | Switch between mock and real SES email delivery. | Set to `true` *and* supply `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, plus (optionally) `AWS_SES_FROM_EMAIL`. |
| `PUBLIC_OBJECT_SEARCH_PATHS` / `PRIVATE_OBJECT_DIR` | Optional (feature-gated) | Configure object storage locations used by media uploads. | Required only if the object storage routes are active; each value is a Google Cloud Storage path. |

Render automatically injects `PORT`, so you do **not** need to set it manually. For a complete inventory (including mobile/web variables), see the core table in [`ENVIRONMENT.md`](../ENVIRONMENT.md).
