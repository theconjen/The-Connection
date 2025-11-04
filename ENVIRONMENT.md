# Environment Configuration Guide

This document explains how environment variables are configured across different deployment targets.

## Overview

The Connection app uses different API endpoints depending on the deployment environment:

- **Local Development**: Direct connection to local or dev API server
- **Vercel Production/Preview**: Uses proxy via `/api` path with rewrites
- **Native iOS/Android**: Direct connection to production API

## Environment Files

### Root `.env`
- Used for production Vercel deployments
- Sets `VITE_API_BASE=/api` to enable Vercel proxy rewrites

### `apps/web/.env.development`
- Used during local development
- Sets `VITE_API_BASE=https://dev.api.theconnection.app` to connect to dev API

### `apps/web/.env.production`
- Used during production builds (including Vercel)
- Ensures `VITE_API_BASE=/api` for proxy functionality

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
Set these in your Vercel project settings:

- `VITE_API_BASE=/api` (for production and preview deployments)
- For the API server, set:
  - `CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://app.theconnection.app`

### Vercel Preview Deployments

Each PR creates a preview deployment with a unique URL like:
`https://the-connection-git-branch-username.vercel.app`

To allow CORS for preview deployments, the backend should:
1. Allow all Vercel preview domains via pattern matching, OR
2. Set `CORS_ALLOWED_ORIGINS` to include preview URLs (comma-separated)

The backend already supports wildcarding in development mode and respects the `CORS_ALLOWED_ORIGINS` environment variable.

## Backend CORS Configuration

The server at `server/cors.ts` supports:

```typescript
// Built-in allowed origins
const BUILT_IN_ALLOWED = [
  "capacitor://localhost",        // iOS/Android native
  "https://app.theconnection.app", // Production web
];

// Additional origins from environment
// Set this in your backend deployment (e.g., Railway, Heroku, etc.)
process.env.CORS_ALLOWED_ORIGINS = "https://your-vercel.vercel.app,https://staging.app.com"
```

### Setting CORS_ALLOWED_ORIGINS

For your API server deployment (wherever Express runs):
```bash
# Single origin
export CORS_ALLOWED_ORIGINS="https://the-connection-git-main-username.vercel.app"

# Multiple origins (comma-separated, no spaces)
export CORS_ALLOWED_ORIGINS="https://preview1.vercel.app,https://preview2.vercel.app"
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
- [x] Root `.env` has `VITE_API_BASE=/api`
- [x] `apps/web/.env.production` has `VITE_API_BASE=/api`
- [ ] Vercel environment variables include `VITE_API_BASE=/api`
- [ ] Backend `CORS_ALLOWED_ORIGINS` includes Vercel deployment URL(s)

**For Native App:**
- [x] `apps/web/src/lib/api.ts` uses direct API URL for native
- [x] Backend CORS includes `capacitor://localhost`

**For Local Development:**
- [x] `apps/web/.env.development` points to dev API server
- [x] Backend runs in dev mode (allows all origins)
