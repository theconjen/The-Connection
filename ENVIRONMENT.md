# Environment Configuration Guide

This document defines the required environment variables and deployment conventions for The Connection across local development, preview (Vercel), staging, and production. Use it as the single source of truth before promoting builds or debugging loader/authentication issues.

## Golden rule

Web builds deployed to Vercel must talk to the API through the `/api/*` rewrite so that cookies remain first-party and session bootstrap succeeds.

## Core variables

| Variable | Required | Description | Recommended value(s) |
| --- | --- | --- | --- |
| `SESSION_SECRET` | ✅ | Secret used by `express-session`; must be long and random. | Unique per environment. |
| `DATABASE_URL` | ✅ (when `USE_DB=true`) | PostgreSQL connection string for the primary database. | Provider DSN (Neon, etc.). |
| `USE_DB` | ✅ | Toggles Postgres session store & migrations. | `true` in deployed environments. |
| `CORS_ALLOWED_ORIGINS` | ✅ | Comma-separated list of additional origins allowed by CORS. | Include preview and custom domains. |
| `APP_DOMAIN` | ✅ | Public host for canonical URLs and emails. | `app.theconnection.app` (prod). |
| `VITE_API_BASE` | ✅ (web) | Frontend API base consumed by Vite. | `/api` in prod/preview; absolute URL in dev. |
| `SHARED_ENV__API_BASE` | ✅ | Mirrors `VITE_API_BASE` for shared client helpers. | Same value as `VITE_API_BASE`. |
| `EXPO_PUBLIC_API_BASE` | ✅ (mobile) | Native API base baked into native bundles. | `https://api.theconnection.app` (prod) or env-specific host. |

## Environment file conventions

- `apps/web/.env.example` documents frontend env vars; copy to local `.env` for development (gitignored).
- `.env`, `.env.local`, `.env.production` are gitignored and used only for local/staging overrides.

## Vercel preview & production

1. Ensure `vercel.json` rewrites `/api/(.*)` → `https://api.theconnection.app/$1`.
2. Set `VITE_API_BASE=/api` and `SHARED_ENV__API_BASE=/api` in Vercel Project Settings for both Preview and Production.
3. Ensure `SESSION_SECRET`, `DATABASE_URL`, and any provider secrets (Stripe, AWS) are configured in Vercel.

### Cookie contract

Backend session cookie (`sessionId`) must be host-only (no `Domain=`), `Secure`, `HttpOnly`, and `SameSite=None` so it works through the `/api` proxy.

## Local development

- Backend: run `pnpm --filter server dev` (Express).
- Frontend: use `apps/web/.env.development` — set `VITE_API_BASE` to your dev host (e.g., `https://dev.api.theconnection.app`).
- Native: set `EXPO_PUBLIC_API_BASE` in Expo/EAS profiles for dev builds.

## Native (iOS / Expo)

- Use absolute API hosts in native bundles (`EXPO_PUBLIC_API_BASE`).
- Add your dev host or tunnel origin to `CORS_ALLOWED_ORIGINS` when testing local APIs from devices.

## Troubleshooting

- If `/api/*` returns HTML, verify `VITE_API_BASE` and the Vercel rewrite.
- For 401/403 on `/api/me`, check cookies in DevTools and ensure `CORS_ALLOWED_ORIGINS` includes the origin.

_Last updated: November 4, 2025_
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
| `EXPO_PUBLIC_API_BASE` | ✅ (mobile) | Native API base (Expo). | `https://api.theconnection.app` (prod), env-specific host in other channels. |
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
  })();
  ```
  Expect **HTTP 200 + `application/json`** on `/api/health` and either **200 JSON** or **401 JSON** on `/api/me`.

### Native (iOS / Expo)

- API base is always the absolute host (`https://api.theconnection.app` or dev/staging counterpart).
- Ensure the API DNS name resolves for the device/simulator.
- Add your Expo dev origin (LAN IP or tunnel host) to `CORS_ALLOWED_ORIGINS` when testing against local APIs.
- Rebuild native bundle after changing `EXPO_PUBLIC_API_BASE` or shared env.

---

## Operational tips

- Keep `.env.production` consistent with the values above if you generate artefacts locally before deploying.
- Rotate `SESSION_SECRET` in tandem with cache invalidation to avoid stale sessions.
- When adding a new surface (e.g., beta mobile build), update `CORS_ALLOWED_ORIGINS` and re-deploy the API so cookies/CORS continue to succeed.
- If `/api/*` ever returns HTML, double-check the rewrite and `VITE_API_BASE`. This is the primary root cause of loader hangs.

---

_Last updated: November 4, 2025_
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
| `EXPO_PUBLIC_API_BASE` | ✅ (mobile) | Native API base (Expo). | `https://api.theconnection.app` (prod) or env-specific host. |

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
- Native: `EXPO_PUBLIC_API_BASE=https://dev.api.theconnection.app` (update in Expo configs).
- Optionally add preview/staging hosts to `CORS_ALLOWED_ORIGINS` in `.env.local` for quick testing.

### Vercel Preview & Production

1. **Rewrite** – Ensure `vercel.json` ships with:
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
  | `EXPO_PUBLIC_API_BASE` | ✅ (mobile) | Native API base (Expo). | `https://api.theconnection.app` (prod), env-specific host in other channels. |
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
     })();
     ```
     Expect **HTTP 200 + `application/json`** on `/api/health` and either **200 JSON** or **401 JSON** on `/api/me`.

  ### Native (iOS / Expo)

  - API base is always the absolute host (`https://api.theconnection.app` or dev/staging counterpart).
  - Ensure the API DNS name resolves for the device/simulator.
  - Add your Expo dev origin (LAN IP or tunnel host) to `CORS_ALLOWED_ORIGINS` when testing against local APIs.
  - Rebuild native bundle after changing `EXPO_PUBLIC_API_BASE` or shared env.

  ---

  ## Operational tips

  - Keep `.env.production` consistent with the values above if you generate artefacts locally before deploying.
  - Rotate `SESSION_SECRET` in tandem with cache invalidation to avoid stale sessions.
  - When adding a new surface (e.g., beta mobile build), update `CORS_ALLOWED_ORIGINS` and re-deploy the API so cookies/CORS continue to succeed.
  - If `/api/*` ever returns HTML, double-check the rewrite and `VITE_API_BASE`. This is the primary root cause of loader hangs.

  ---

  _Last updated: November 4, 2025_
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

For iOS/Android (Expo), the app reads `EXPO_PUBLIC_API_BASE` from the Expo config/eas profile so the API host is baked into the bundle.

- Point production builds at `https://api.theconnection.app` (default in `eas.json`).
- For development builds, set the variable to your LAN IP or tunnel hostname so physical devices can reach your local API.
- Add that origin to `CORS_ALLOWED_ORIGINS` when testing against non-production hosts.

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
| `EXPO_PUBLIC_API_BASE` | ✅ (mobile) | Native API base (Expo). | `https://api.theconnection.app` (prod), env-specific host in other channels. |
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
- Add your Expo dev origin (LAN IP or tunnel host) to `CORS_ALLOWED_ORIGINS` when testing against local APIs.
- Rebuild native bundle after changing `EXPO_PUBLIC_API_BASE` or shared env.

---

## Operational tips

- Keep `.env.production` consistent with the values above if you generate artefacts locally before deploying.
- Rotate `SESSION_SECRET` in tandem with cache invalidation to avoid stale sessions.
- When adding a new surface (e.g., beta mobile build), update `CORS_ALLOWED_ORIGINS` and re-deploy the API so cookies/CORS continue to succeed.
- If `/api/*` ever returns HTML, double-check the rewrite and `VITE_API_BASE`. This is the primary root cause of loader hangs.

---

_Last updated: November 4, 2025_
 
