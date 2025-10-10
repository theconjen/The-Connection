# Web E2E testing guide

This app’s Playwright tests are locale-agnostic and fully deterministic by stubbing `fetch` before any page scripts run.

Key rules
- Use data-testid selectors only. See `apps/web/tests/utils/testids.ts`.
- Never assert on literal text that can vary by i18n.
- Install the fetch stub via `installFetchStub(page, routes)` before `page.goto()`.
- Tests should return the paginated feed shape `{ items, nextCursor }` and drive pagination via `nextCursor !== null`.

Fetch stubbing
- Utility: `apps/web/tests/utils/fetchStub.ts`.
- It overrides `window.fetch` in an init script and dispatches to your route handlers provided from the Node test context.
- Matching is prefix-based on `pathname`, e.g. key `/api/feed` matches `/api/feed?cursor=...`.
- It’s robust to absolute URLs because it extracts `pathname + search` and rebuilds a local URL.

Environment
- `playwright.config.ts` sets `VITE_API_BASE=""` when starting the dev server so client `http()` composes relative URLs.
- Tests don’t need `VITE_API_BASE` or any backend; all network is stubbed.

Common pitfalls
- If `Load more` never appears, ensure the first response includes a non-null `nextCursor`.
- If the app makes real requests, ensure `installFetchStub` is called before `page.goto()`.
- If you see i18n flakiness, replace text assertions with test IDs.

Where to look
- UI: `apps/web/src/routes/feed.tsx`
- Test IDs: `apps/web/tests/utils/testids.ts`
- Fetch stub: `apps/web/tests/utils/fetchStub.ts`
- Specs: `apps/web/tests/*.spec.ts`

