# Environment Configuration Guide

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
Set `CORS_ALLOWED_ORIGINS` to include your Vercel deployment URL(s):
- For single deployment: `https://your-app.vercel.app`
- For multiple: `https://your-app.vercel.app,https://staging.example.com`

**Note**: The backend CORS configuration now automatically allows all `*.vercel.app` domains in production, so you may not need to set `CORS_ALLOWED_ORIGINS` unless you have custom domains or additional origins.

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
