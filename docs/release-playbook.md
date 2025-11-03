# 🚀 Release Flow (Web + Mobile)

## 0) Pre-flight (shared)

```bash
# 0.1 Type + lint (fail fast)
pnpm exec tsc --noEmit
pnpm -C apps/web lint || true   # if wired

# 0.2 API up?
curl -fsS https://api.theconnection.app/api/health && echo "API healthy"

# 0.3 Confirm client targets prod API
# In browser console (prod web) and iOS WebView inspector:
window.__API_BASE    // → "https://api.theconnection.app/api"
```

**Cookies/CORS (sanity):** API must set `Set-Cookie` with `Secure; SameSite=None; Domain=.theconnection.app`.

---

## 1) Web (Vite)

```bash
# 1.1 Build
pnpm -C apps/web build

# 1.2 Local smoke (optional)
pnpm -C apps/web dlx serve dist -l 5173
open http://localhost:5173
```

**Deploy:** upload `apps/web/dist` to host (Vercel/Netlify/DO).

**SPA fallback:** rewrite `/* → /index.html` (200).

**Post-deploy checks (Chrome DevTools → Network):**

* `index.html` + `assets/*.js` = 200
* All XHR → `https://api.theconnection.app/api/...` (no `www` and no double `/api`)
* Auth route sets cookie: **Secure + SameSite=None + Domain=.theconnection.app**

**Service worker:** DevTools → Application → Service Workers → **Unregister** → Hard reload.

---

## 2) Mobile (Expo)

**Decide path:**

* **OTA only** (JS/config changes):

  ```bash
  npx expo whoami
  eas update --branch main --message "Release: forms typed + unified API helpers"
  ```

* **New native build** (plugins, app.json changes, runtime bump):

  1. In `app.config.*` set `"runtimeVersion": "1.0.2"` (or next).
  2. Build + submit:

     ```bash
     eas build --platform ios --profile production --non-interactive
     eas submit --platform ios --latest
     # (repeat for Android if applicable)
     ```
  3. After users install the new build, you can ship further **OTAs** to `runtimeVersion: 1.0.2`.

**Runtime sanity:** If you change `plugins`, add a new native module, or modify `expo-build-properties`, bump `expo.runtimeVersion` in `app.config.*` before building. No native change? Keep the existing runtime and ship OTA only.

**Device smokes (manual):** open, login/logout, tabs render content, post CRUD, join/leave group, file upload (Uppy Dashboard), scholar/livestreamer forms (valid + invalid), network calls hit prod API, session persists.

---

# 🧪 Lightweight Automated Smokes

## A) Web – Playwright smoke

**File:** `apps/web/tests/smoke.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('home renders + API healthy', async ({ page, request }) => {
  await page.goto('https://www.theconnection.app', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Connection/i);

  // Confirm client base URL is correct
  const apiBase = await page.evaluate(() => (window as any).__API_BASE);
  expect(apiBase).toBe('https://api.theconnection.app/api');

  // API health
  const res = await request.get('https://api.theconnection.app/api/health');
  expect(res.ok()).toBeTruthy();
});
```

**Run locally/CI:**

```bash
pnpm -w dlx playwright install --with-deps
pnpm -w dlx playwright test apps/web/tests/smoke.spec.ts
```

## B) API – simple curl smoke (headers + CORS)

**File:** `scripts/api-smoke.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
URL="https://api.theconnection.app/api/health"
echo "GET $URL"
curl -fsS -H 'Origin: https://www.theconnection.app' -D - "$URL" -o /dev/null | awk 'NR<=20'
echo "OK"
```

Run:

```bash
bash scripts/api-smoke.sh
```

## C) GitHub Actions (runs both on `main`)

**File:** `.github/workflows/smokes.yml`

```yaml
name: Smokes
on:
  push: { branches: [main] }
  workflow_dispatch:
jobs:
  web-api-smokes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Playwright install
        run: npx playwright install --with-deps
      - name: Run web smoke
        run: npx playwright test apps/web/tests/smoke.spec.ts
      - name: API smoke
        run: bash scripts/api-smoke.sh
```

## D) Mobile – minimal boot/nav smoke (optional)

If you want CI device smokes later, add Detox or `@expo/e2e`. For now, keep manual device smokes in the checklist (fastest path to ship).

---

# ⏪ Rollback Handles

## Web

* **Vercel/Netlify/DO:** use “Revert/Roll back to deploy” to the prior artifact → confirm → Vercel auto-purges cache (allow ~60s for full propagation).
* **Manual** (if needed): redeploy prior `dist` tarball kept in build artifacts bucket.

## Mobile – OTA

```bash
# List existing updates and copy the previous updateId
eas update:select --branch main
# Republish last known-good update (pin clients)
eas update --branch main --message "Pin to <updateId>" --republish --runtime-version 1.0.2
```

## Mobile – Native build

* Rebuild last good commit:

  ```bash
  git checkout <good-commit>
  eas build --platform ios --profile production --non-interactive
  eas submit --platform ios --latest
  ```
* Communicate to testers/users if TestFlight re-install is required.

## Post-release monitoring

* Sentry/New Relic: set release tag (e.g., `release/2025-11-03T20:00`) during web build via `SENTRY_RELEASE` and reuse the same tag in the EAS update message.
* Verify dashboards (latency, error rate) stay flat for 30 min.

### Monitoring links

- **Sentry Releases:** https://sentry.io/organizations/the-connection/releases/
- **API Logs (cloud):** <add-log-dashboard-url>
- **CI Smokes:** https://github.com/The-Connection-App/The-Connection/actions/workflows/smokes.yml

## Database/API

* Keep **Drizzle down** migrations ready before any breaking schema change.
* If no schema changes (this release), nothing to roll back server-side—just redeploy previous image.

## Comms (template)

> **Status:** Rolling back **web** to build `<deploy id>` due to auth regression. Expect temporary cache churn while CDN purges. Mobile users are unaffected / OTA pinned to previous update. We’ll re-announce when stable.

---

# ✅ Quick Reference Checklists

**Release**

* [ ] `pnpm release:preflight` passes (`typecheck` + API health).
* [ ] `pnpm release:web` succeeds (build + smokes).
* [ ] SPA fallback verified.
* [ ] `window.__API_BASE === "https://api.theconnection.app/api"` (web + iOS inspector).
* [ ] Auth cookie flags: `Secure; SameSite=None; Domain=.theconnection.app`.
* [ ] Manual smokes pass (auth, feed, posts, uploads, groups, scholar/livestreamer forms).
* [ ] OTA published **or** new native build shipped (if runtime changed).
* [ ] CI smokes green (Playwright + API).
* [ ] Monitoring dashboards show healthy error rate + latency after deploy.

**If “Loading…” persists**

* [ ] Network: 200s for `index.html` + JS chunks (no 404).
* [ ] API URL correct; no `https://www.../api/api/...`.
* [ ] CORS + credentials enabled.
* [ ] Service worker cleared.
* [ ] Expo route modules **default-export** components.

---
