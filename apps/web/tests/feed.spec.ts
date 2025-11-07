import { test, expect } from "@playwright/test";
import { installFetchStub } from "./utils/fetchStub";
import { TID } from "./utils/testids";

test("feed renders, refresh works, and error retry path", async ({ page }) => {
  await installFetchStub(page, {
    "/api/feed": (_u, meta) => {
      const mode = meta?.mode ?? 'initial';
      if (mode === 'initial') {
        return { body: { items: [
          { id: '1', title: 'Hello', body: 'World', createdAt: '2025-10-08T12:00:00Z' },
          { id: '2', title: 'Foo', body: 'Bar', createdAt: '2025-10-08T12:01:00Z' },
        ], nextCursor: 'cursor-2' } };
      }
      if (mode === 'error') return { status: 500, body: { message: 'boom' } };
      if (mode === 'retry') return { body: { items: [ { id: '3', title: 'Retry', body: 'OK', createdAt: '2025-10-08T12:02:00Z' } ], nextCursor: null } };
      return { body: { items: [], nextCursor: null } };
    }
  });
  await page.goto("/feed");

  await page.getByTestId(TID.lastUpdated).waitFor();

  // 2) Refresh mocked error
  await page.evaluate(() => { (window as any).__FEED_MODE__ = 'error'; });

  await page.getByTestId(TID.refresh).click();

  await page.getByTestId(TID.initialError).waitFor();

  // 3) Retry mocked success
  await page.evaluate(() => { (window as any).__FEED_MODE__ = 'retry'; });

  await page.getByTestId(TID.tryAgain).click();

  await page.getByTestId(TID.lastUpdated).waitFor();
});
