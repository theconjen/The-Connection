# Environment Configuration Guide

> **Golden rule:** Web builds deployed to Vercel must talk to the API through the `/api/*` rewrite so that cookies remain first-party and session bootstrap succeeds.

This document is the single source of truth for environment variables, rewrites, and platform-specific conventions across local development, staging, production, and native builds. Refer to it before promoting builds or debugging loader/authentication issues.

---

## Core Variables

| Variable | Required | Description | Recommended value(s) |
| --- | --- | --- | --- |
| `SESSION_SECRET` | ✅ | Secret used by `express-session`; must be long and random. | Current deploy secret: `372f79df29a1113a00d5bde03125eddc`. Rotate alongside cache invalidation. |
| `DATABASE_URL` | ✅ (when `USE_DB=true`) | PostgreSQL connection string for the primary database. | Neon DSN: `postgresql://neondb_owner:npg_MfB8mlWiSkN4@ep-hidden-band-adzjfzr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`. |
| `USE_DB` | ✅ | Toggles Postgres session store & migrations. | `true` in deployed environments. |
| `CORS_ALLOWED_ORIGINS` | ✅ | Additional comma-separated origins allowed by CORS. | Include every deployed web/mobile origin beyond the defaults. |
| `APP_DOMAIN` | ✅ | Public host for canonical URLs and emails. | `app.theconnection.app` (prod), `staging.theconnection.app`, etc. |
| `AWS_SES_FROM_EMAIL` | Optional | Override for transactional email sender. | `"The Connection" <noreply@theconnection.app>` |
| `VITE_API_BASE` | ✅ (web) | Frontend API base consumed by Vite/React bundles. | `/api` in prod/preview, `https://dev.api.theconnection.app` in dev. |
| `SHARED_ENV__API_BASE` | ✅ (server/shared) | Mirrors `API_BASE` in `shared/http.ts`. Prefer setting via build tooling. | Same value as `VITE_API_BASE`. |
| `EXPO_PUBLIC_API_BASE` | ✅ (mobile) | Native API base (Capacitor/Expo). | `https://api.theconnection.app` (prod) or env-specific host. |

---

## Environment Files & Templates

### `apps/web/.env.example`
- Template listing required frontend variables.
- Copy to `.env` for local overrides (gitignored).
- **Not used by Vercel**: configure variables in the Vercel dashboard instead.

### `apps/web/.env.development`
- Loaded by `pnpm --filter web dev`.
- Sets `VITE_API_BASE=https://dev.api.theconnection.app` to point at the dev API cluster.

### `.env`, `.env.local`, `.env.production`
- Gitignored for security. Never commit these.
- Suitable for local/staging overrides; keep in sync with the tables above.

---

## Environment Matrices

### Local Development

- Backend: run via `pnpm --filter server dev` (Express) on localhost with relaxed CORS.
- Frontend: `VITE_API_BASE=https://dev.api.theconnection.app` (see `.env.development`).
- Native: `EXPO_PUBLIC_API_BASE=https://dev.api.theconnection.app` (update in Expo/Capacitor configs).
- Optionally add preview/staging hosts to `CORS_ALLOWED_ORIGINS` in `.env.local` for quick testing.

### Vercel Preview & Production

1. **Rewrite** – Ensure `vercel.json` ships with:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://api.theconnection.app/$1" }
     ]
   }
   ```
2. **Frontend variables (Project Settings → Environment Variables):**
   - `VITE_API_BASE=/api`
   - `SHARED_ENV__API_BASE=/api`
   - Any additional build-time secrets (Stripe, Sentry, etc.).
3. **Backend variables:**
   - `SESSION_SECRET`, `DATABASE_URL`, `USE_DB=true`
   - `CORS_ALLOWED_ORIGINS=https://<your-vercel>.vercel.app,https://app.theconnection.app` (+ any custom domains).
4. **Cookie contract** – Session cookie must remain host-only with:
   ```javascript
   {
     secure: true,
     httpOnly: true,
     sameSite: 'none',
     path: '/',
     // no domain attribute
   }
   ```
5. **Verification checklist** – Run in the deployed site’s console after each deploy:
   ```js
   (async () => {
     const health = await fetch('/api/health', { credentials: 'include' });
     console.log('health', health.status, health.headers.get('content-type'));
     console.log('health body', await health.text());

     const me = await fetch('/api/me', { credentials: 'include' });
     console.log('me', me.status, me.headers.get('content-type'));
     console.log('me body preview', (await me.text()).slice(0, 180));
   })();
   ```
   Expect **HTTP 200 + JSON** on `/api/health` and either **200 JSON** or **401 JSON** on `/api/me`.

### Native (iOS / Expo / Capacitor)

- API base is the absolute production (or env-specific) host, e.g. `https://api.theconnection.app`.
- Ensure DNS resolves on the device/simulator.
- CORS allowlist must include `capacitor://localhost` and any Expo origins.
- Rebuild native bundle after adjusting `EXPO_PUBLIC_API_BASE` or shared env values.

---

## Backend CORS Configuration

The backend (`server/cors.ts`) automatically permits:

1. Built-in origins:
   - `capacitor://localhost`
   - `https://app.theconnection.app`
2. Any origin matching `https://*.vercel.app`
3. Additional origins supplied via `CORS_ALLOWED_ORIGINS` (comma-separated).

Example:
```bash
export CORS_ALLOWED_ORIGINS="https://custom-domain.com,https://staging.example.com"
```

Implementation snippet:
```ts
const VERCEL_PATTERN = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
// Origin check automatically allows built-ins, *.vercel.app, and any extra configured domains
```

---

## Cookie Behaviour

Session cookies (see `server/app.ts` / `server/index.ts`) are configured as:

```js
cookie: {
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  secure: true,
  httpOnly: true,
  sameSite: 'none',
  path: '/',
  // No domain attribute → host-only cookie compatible with Vercel proxying
}
```

Removing the `domain` attribute keeps cookies first-party when the frontend talks to the API through the `/api` rewrite.

---

## Email Delivery Providers

| Variable | Required | Description | Production guidance |
| --- | --- | --- | --- |
| `ENABLE_REAL_EMAIL` | ✅ (prod) | Turns on real sends instead of mock mode. | Set to `true` only after provider credentials are configured. |
| `FORCE_EMAIL_MOCK_MODE` | Optional | Forces mock delivery even if credentials exist (useful for staging). | Leave empty/`false` in production. |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | ✅ (when using SES) | IAM user or SMTP credentials for SES. | Use a restricted IAM user allowed to send mail from the verified domain. |
| `AWS_REGION` | ✅ (SES) | SES region containing the verified identity. | `us-east-1` unless your SES identity lives elsewhere. |
| `AWS_SES_FROM_EMAIL` / `EMAIL_FROM` | ✅ | Verified sender used by transactional mailers. | Format: `"The Connection" <noreply@yourdomain.com>`. |
| `SENDGRID_API_KEY` | ✅ (when using SendGrid) | Auth token for SendGrid’s v3 API. | Create a Restricted API Key with Mail Send rights only. |
| `RESEND_API_KEY` | Optional | Resend API key as an additional provider. | Leave unset unless using Resend. |

The mailer will attempt providers in the order **Resend → SendGrid → AWS SES** as configured and will log when falling back.

---

## Media Storage & Uploads

| Variable | Required | Description | Production guidance |
| --- | --- | --- | --- |
| `GOOGLE_CLOUD_PROJECT_ID` | ✅ | GCP project hosting the storage bucket. | Match the project that owns your service account. |
| `GOOGLE_CLOUD_STORAGE_BUCKET` | ✅ | Primary bucket for uploads/downloads. | Example: `the-connection-media`. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Optional | Path to the JSON service-account key on disk. | Mount via secret volume or Render disk. |
| `GOOGLE_APPLICATION_CREDENTIALS_BASE64` | Optional | Base64-encoded JSON key for environments without writable disks. | Prefer this on Render/Heroku; decode on startup automatically. |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Optional | Comma-separated `/<bucket>/<prefix>` paths to search for public assets. | Defaults to `/<bucket>/public` when `GOOGLE_CLOUD_STORAGE_BUCKET` is set. |
| `PRIVATE_OBJECT_DIR` | Optional | Root directory for private uploads. | Defaults to `/<bucket>/private` when `GOOGLE_CLOUD_STORAGE_BUCKET` is set. |

If neither credential variable is provided, the storage client falls back to the Replit sidecar credentials used for local development.

---

## Error Monitoring

| Variable | Scope | Description | Production guidance |
| --- | --- | --- | --- |
| `SENTRY_DSN` | Server | Enables API error reporting. | Set the project DSN and optionally `SENTRY_TRACES_SAMPLE_RATE` for traces. |
| `SENTRY_TRACES_SAMPLE_RATE` | Server | Sample rate for tracing (0.0–1.0). | Start with `0.1` in production. |
| `VITE_SENTRY_DSN` | Web | Frontend DSN for the Vite bundle. | Mirror the same DSN or a frontend-specific project. |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | Web | Trace sampling for browser spans. | Keep low (e.g., `0.05`) to control volume. |

Ensure both server and web bundles receive their respective DSNs so runtime exceptions surface in Sentry.

---

## Native & Shared HTTP Configuration

- Web API base (`WEB_API`) defaults to `import.meta.env.VITE_API_BASE`.
- Native API base (`NATIVE_API`) is always the absolute host (see `apps/web/src/lib/api.ts`).
- Shared callers should reference `shared/http.ts`, which in turn reads `SHARED_ENV__API_BASE`.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| Loader hangs, `/api/health` returns HTML | Frontend bypassing rewrite, hitting wrong domain. | Ensure `VITE_API_BASE=/api`, redeploy, clear cache/service worker. |
| `/api/me` 401/403 unexpectedly | Cookie not included or CORS blocked. | Check request headers, confirm `CORS_ALLOWED_ORIGINS`, ensure `credentials: 'include'` and cookie settings above. |
| Native app requests fail | Missing Capacitor/Expo origin in allowlist or wrong API base. | Add origin via `CORS_ALLOWED_ORIGINS`, verify `EXPO_PUBLIC_API_BASE`, rebuild native bundle. |

---

## Deployment Readiness: What’s Already Wired vs. What You Must Provide

- **Email providers (Resend → SendGrid → SES)**
  - *Already wired*: Provider auto-selection and fallbacks are implemented in `server/email.ts`, controlled by `ENABLE_REAL_EMAIL` / `FORCE_EMAIL_MOCK_MODE` and the provider API keys. Resend and SendGrid clients initialize when their keys are present; SES uses AWS creds when available.
  - *You must provide*: A verified sender (`EMAIL_FROM`/`AWS_SES_FROM_EMAIL`) plus at least one provider key (`RESEND_API_KEY`, `SENDGRID_API_KEY`, or `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` + `AWS_REGION`). Set `ENABLE_REAL_EMAIL=true` in production once credentials are live.

- **Media uploads (Google Cloud Storage)**
  - *Already wired*: `server/objectStorage.ts` consumes either `GOOGLE_APPLICATION_CREDENTIALS_BASE64` or `GOOGLE_APPLICATION_CREDENTIALS` and defaults public/private prefixes to `/GOOGLE_CLOUD_STORAGE_BUCKET/{public|private}`. It also falls back to the Replit sidecar creds for local dev.
  - *You must provide*: A storage bucket (`GOOGLE_CLOUD_STORAGE_BUCKET`), project ID (`GOOGLE_CLOUD_PROJECT_ID`), and either a service-account key (path or base64) or platform IAM binding. Override `PUBLIC_OBJECT_SEARCH_PATHS` / `PRIVATE_OBJECT_DIR` if you need custom prefixes.

- **Error monitoring (Sentry)**
  - *Already wired*: The server initializes `@sentry/node` when `SENTRY_DSN` is set, and the web bundle bootstraps `@sentry/react` when `VITE_SENTRY_DSN` is defined.
  - *You must provide*: DSNs and sampling rates for each surface: `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`, `VITE_SENTRY_DSN`, and `VITE_SENTRY_TRACES_SAMPLE_RATE` in their respective environments.

---

## Testing Recipes

```js
// Test API rewrite from browser console
(async () => {
  const r = await fetch('/api/health', { credentials: 'include' });
  console.log('Status:', r.status);
  console.log('Content-Type:', r.headers.get('content-type'));
  console.log('Body:', await r.text());
})();
```

```js
// Test authenticated request (after login)
(async () => {
  const r = await fetch('/api/me', { credentials: 'include' });
  console.log('Status:', r.status);
  console.log('Body:', await r.json());
})();
```

---

## Deployment Checklist

### Vercel Web
- [x] `vercel.json` contains `/api/(.*)` rewrite
- [x] Environment variables configured (`VITE_API_BASE=/api`, `SHARED_ENV__API_BASE=/api`, secrets)
- [x] Backend CORS covers `*.vercel.app` and custom domains
- [ ] Deployment verified with console health/me snippet

### Backend API
- [x] `SESSION_SECRET`, `DATABASE_URL`, `USE_DB=true`
- [x] Cookie settings match proxy requirements
- [ ] Optional: extend `CORS_ALLOWED_ORIGINS` for extra domains

### Native Apps
- [x] `EXPO_PUBLIC_API_BASE` set to correct absolute host
- [x] `capacitor://localhost` included in CORS
- [ ] Rebuild native clients after env changes

### Local Development
- [x] `.env.development` points to dev API server
- [x] Backend dev mode allows all origins

---

_Last updated: November 4, 2025_# Environment Configuration Guide

<<<<<<< HEAD
This document explains how environment variables are configured across different deployment targets.

## Overview

The Connection app uses different API endpoints depending on the deployment environment:

- **Local Development**: Direct connection to local or dev API server
- **Vercel Production/Preview**: Uses proxy via `/api` path with rewrites
- **Native iOS/Android**: Direct connection to production API

## Environment Files

### `apps/web/.env.example`
- Template file showing required environment variables
- Copy to `.env` for local overrides (gitignored)
- **Not used by Vercel** - set variables in Vercel dashboard instead

### `apps/web/.env.development`
- Used during local development (`npm run dev`)
- Sets `VITE_API_BASE=https://dev.api.theconnection.app` to connect to dev API

### `.env` files (gitignored)
- `.env`, `.env.local`, `.env.production` are all gitignored for security
- These files should NOT be committed to the repository
- For Vercel deployments, set environment variables in the Vercel dashboard

## Vercel Deployment

### How It Works

1. **Frontend Build**: Vite builds the app with `VITE_API_BASE=/api`
2. **API Requests**: Browser makes requests to `/api/health`, `/api/me`, etc.
3. **Vercel Rewrite**: `vercel.json` rewrites `/api/*` → `https://api.theconnection.app/*`
4. **Backend Response**: Express server responds with JSON

### Required Configuration

#### vercel.json (already configured)
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://api.theconnection.app/$1" }
  ]
}
```

#### Environment Variables in Vercel Dashboard

**CRITICAL**: Set these in your Vercel project settings (Project Settings > Environment Variables):

**For the Web App (Frontend):**
- Variable: `VITE_API_BASE`
- Value: `/api`
- Environments: Production, Preview (check both)

This tells Vite to build the frontend to make API requests to `/api/*`, which Vercel will then proxy to the backend via the rewrite rule.

**For the API Server (Backend - wherever Express runs):**

The backend CORS configuration now automatically allows all `*.vercel.app` domains, so no additional configuration is needed for Vercel deployments.

If you need to allow **additional custom domains** (staging environments, custom domains, etc.), set the `CORS_ALLOWED_ORIGINS` environment variable:
- For single domain: `https://custom-domain.com`
- For multiple: `https://staging.example.com,https://custom-domain.com`

### Vercel Preview Deployments

Each PR creates a preview deployment with a unique URL like:
`https://the-connection-git-branch-username.vercel.app`

**Good News**: The backend CORS configuration has been updated to automatically allow all `*.vercel.app` domains, so preview deployments will work without additional configuration.

If you need to allow additional origins (custom domains, staging environments, etc.), set the `CORS_ALLOWED_ORIGINS` environment variable on your backend deployment.

## Backend CORS Configuration

The server at `server/cors.ts` now supports:

1. **Built-in allowed origins**:
   - `capacitor://localhost` - iOS/Android native apps
   - `https://app.theconnection.app` - Production web app

2. **Automatic Vercel domain support**:
   - Any origin matching `https://*.vercel.app` is automatically allowed
   - This includes all preview and production deployments on Vercel

3. **Custom origins via environment variable**:
   ```bash
   # Set this on your backend deployment if needed
   export CORS_ALLOWED_ORIGINS="https://custom-domain.com,https://staging.example.com"
   ```

### Implementation

```typescript
// Pattern for Vercel deployments (server/cors.ts)
const VERCEL_PATTERN = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

// CORS origin check automatically allows:
// - Built-in origins (capacitor, production)
// - Any *.vercel.app domain
// - Additional origins from CORS_ALLOWED_ORIGINS env var
```

## Cookie Configuration

The backend sets session cookies with these attributes (see `server/app.ts` and `server/index.ts`):

```javascript
cookie: {
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  secure: true,                      // HTTPS only
  httpOnly: true,                    // No client-side JS access
  sameSite: 'none',                  // Allow cross-site (needed for proxy)
  path: '/',                         // Available on all paths
  // NO Domain= attribute (host-only cookie)
}
```

### Why No Domain Attribute?

Setting `domain` would make the cookie available to subdomains, but with the Vercel proxy approach:
- Frontend: `your-app.vercel.app`
- Backend: `api.theconnection.app` (proxied via `/api`)

Using **host-only cookies** (no `domain`) ensures the cookie is scoped correctly for the proxy setup.

## Native App Configuration

For iOS/Android (Capacitor), the app uses direct API connection:

```typescript
// apps/web/src/lib/api.ts
const NATIVE_API = "https://api.theconnection.app";
export const API_BASE = Capacitor.isNativePlatform() ? NATIVE_API : WEB_API;
```

The backend must include `capacitor://localhost` in CORS allowed origins (already configured).

## Troubleshooting

### Issue: Loader hangs, `/api/health` returns HTML

**Cause**: Frontend is making requests to wrong domain, bypassing Vercel rewrite.

**Solution**:
1. Verify `VITE_API_BASE=/api` in Vercel environment variables
2. Redeploy to apply new environment variable
3. Clear browser cache and service worker

### Issue: 401/403 errors on `/api/me`

**Cause**: Cookie not being sent or CORS blocking requests.

**Solution**:
1. Check browser DevTools → Network → Request Headers for `Cookie: sessionId=...`
2. Verify `CORS_ALLOWED_ORIGINS` includes your Vercel deployment URL
3. Ensure backend has `credentials: true` in CORS config (already set)
4. Check that cookie attributes include `sameSite: 'none'` and `secure: true`

### Issue: Works on web, fails on iOS

**Cause**: Native app needs different CORS origin.

**Solution**:
1. Ensure `capacitor://localhost` is in CORS allowed origins (already set)
2. Rebuild native app: `npx cap copy ios && npx cap sync ios`
3. Test API directly: Use Safari Web Inspector → select simulator → check Network tab

## Testing Configuration

To test if your configuration is correct:

### 1. Test API Rewrite (Browser Console)
```javascript
// On your Vercel deployment
(async () => {
  const r = await fetch('/api/health', { credentials: 'include' });
  console.log('Status:', r.status);
  console.log('Content-Type:', r.headers.get('content-type'));
  console.log('Body:', await r.text());
})();
```

Expected output:
- Status: `200`
- Content-Type: `application/json`
- Body: `{"ok":true}` (or similar JSON)

### 2. Test Authentication
```javascript
// After logging in
(async () => {
  const r = await fetch('/api/me', { credentials: 'include' });
  console.log('Status:', r.status);
  console.log('Body:', await r.json());
})();
```

Expected: Status `200` with user JSON or `401` if not logged in (but still JSON response).

## Summary Checklist

**For Vercel Web Deployment:**
- [x] `vercel.json` has rewrite rule for `/api/*`
- [x] `apps/web/.env.example` documents required variables
- [x] Backend CORS automatically allows `*.vercel.app` domains
- [ ] Set `VITE_API_BASE=/api` in Vercel environment variables (Project Settings)
- [ ] Deploy to Vercel and test with console snippet (see Testing Configuration below)

**For Backend API Server:**
- [x] CORS configuration allows Vercel domains automatically
- [x] Cookie settings are correct (secure, httpOnly, sameSite: none, no Domain)
- [ ] Optional: Set `CORS_ALLOWED_ORIGINS` for additional custom domains

**For Native App:**
- [x] `apps/web/src/lib/api.ts` uses direct API URL for native
- [x] Backend CORS includes `capacitor://localhost`

**For Local Development:**
- [x] `apps/web/.env.development` points to dev API server
- [x] Backend runs in dev mode (allows all origins)
=======
This document defines the required environment variables and deployment conventions for The Connection across local development, staging, and production. Use it as the single source of truth before promoting builds or debugging loader issues.

> **Golden rule:** Web builds deployed to Vercel must talk to the API through the `/api/*` rewrite so that cookies remain first-party and session bootstrap succeeds.

---

## Core variables

| Variable | Required | Description | Recommended value(s) |
| --- | --- | --- | --- |
| `SESSION_SECRET` | ✅ | Secret used by `express-session`; must be long and random. | Unique per environment. |
| `DATABASE_URL` | ✅ (when `USE_DB=true`) | PostgreSQL connection string for the primary database. | Neon/Render/Cloud provider DSN. |
| `USE_DB` | ✅ | Toggles Postgres session store & migrations. | `true` in deployed environments. |
| `CORS_ALLOWED_ORIGINS` | ✅ | Additional comma-separated origins allowed by CORS. | Include every deployed web/mobile origin. |
| `APP_DOMAIN` | ✅ | Public host for canonical URLs and emails. | `app.theconnection.app` (prod), `staging.theconnection.app`, etc. |
| `AWS_SES_FROM_EMAIL` | Optional | Override for transactional email sender. | `"The Connection" <noreply@theconnection.app>` |
| `VITE_API_BASE` | ✅ (web) | Frontend API base consumed by Vite/React bundles. | `/api` in prod, `https://dev.api.theconnection.app` in dev. |
| `EXPO_PUBLIC_API_BASE` | ✅ (mobile) | Native API base (Capacitor/Expo). | `https://api.theconnection.app` (prod), env-specific host in other channels. |
| `SHARED_ENV__API_BASE` | ✅ (server/shared) | Mirrors `API_BASE` in `shared/http.ts`. Prefer setting via build tooling. | Same as `VITE_API_BASE`. |

---

## Environment matrices

### Local development

- API runs from `pnpm --filter server dev` (or equivalent) on `https://localhost` behind the dev proxy.
- `VITE_API_BASE=https://dev.api.theconnection.app` (see `apps/web/.env.development`).
- `EXPO_PUBLIC_API_BASE=https://dev.api.theconnection.app` (set in `apps/mobile/eas.json`).
- Add any preview/staging hosts to `CORS_ALLOWED_ORIGINS` via `.env.local` for quick testing.

### Vercel preview & production

1. **Rewrite** – Ensure `vercel.json` is packaged with the build so `/api/(.*)` forwards to `https://api.theconnection.app/$1`.
2. **Environment variables** – In Vercel Project Settings → Environment Variables:
   - `VITE_API_BASE=/api`
   - `SHARED_ENV__API_BASE=/api`
   - `SESSION_SECRET`, `DATABASE_URL`, `USE_DB=true`, `CORS_ALLOWED_ORIGINS=https://<your-vercel>.vercel.app,https://app.theconnection.app`
   - Any other secrets (Stripe, AWS) as needed.
3. **Cookie contract** – Backend session cookie (`sessionId`) must remain host-only, `Secure`, `HttpOnly`, `SameSite=None`, `Path=/`. No `Domain=` attribute to keep it first-party through the proxy.
4. **Verification checklist** (run in the deployed site’s console after each deploy):
   ```js
   (async () => {
     const health = await fetch('/api/health', { credentials: 'include' });
     console.log('health', health.status, health.headers.get('content-type'));
     console.log('health body', await health.text());

     const me = await fetch('/api/me', { credentials: 'include' });
     console.log('me', me.status, me.headers.get('content-type'));
     console.log('me body preview', (await me.text()).slice(0, 180));
   })();
   ```
   Expect **HTTP 200 + `application/json`** on `/api/health` and either **200 JSON** or **401 JSON** on `/api/me`.

### Native (iOS / Expo)

- API base is always the absolute host (`https://api.theconnection.app` or dev/staging counterpart).
- Ensure the API DNS name resolves for the device/simulator.
- CORS allowlist must include `capacitor://localhost` and any Capacitor/Expo origins.
- Rebuild native bundle after changing `EXPO_PUBLIC_API_BASE` or shared env.

---

## Operational tips

- Keep `.env.production` consistent with the values above if you generate artefacts locally before deploying.
- Rotate `SESSION_SECRET` in tandem with cache invalidation to avoid stale sessions.
- When adding a new surface (e.g., beta mobile build), update `CORS_ALLOWED_ORIGINS` and re-deploy the API so cookies/CORS continue to succeed.
- If `/api/*` ever returns HTML, double-check the rewrite and `VITE_API_BASE`. This is the primary root cause of loader hangs.

---

_Last updated: November 4, 2025_
>>>>>>> 4fa3eeb (Fix TypeScript errors and update schemas)
