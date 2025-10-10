# Testing Conventions

This repo uses Playwright for web E2E tests.

- Use `data-testid` and `page.getByTestId(...)` for all selectors.
- Avoid text-based selectors to keep tests i18n-safe.
- Stub network calls with `installFetchStub` instead of Playwright routing.
- Web tests do not depend on `VITE_API_BASE`.

## Fetch Stub

Use the shared helper:

```ts
import { installFetchStub } from "./utils/fetchStub";
await installFetchStub(page, {
  "/api/feed": (u) => ({ body: { items: [], nextCursor: null } }),
});
```

Return `{ body, status? }` from your route handlers.
