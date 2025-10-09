import { test, expect } from "@playwright/test";

const FEED_RE = /\/api\/feed(\?|$)/;
const FEED_GLOB = "**/api/feed**";

test("pagination: first page then load more to end-of-feed", async ({ page }) => {
  page.on('console', (msg) => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
  await page.addInitScript(() => {
    const origFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (/\/api\/feed(\?|$)/.test(url)) {
        if (url.includes('cursor=')) {
          return new Response(JSON.stringify({
            items: [
              { id: '3', title: 'Page2-A', body: 'B', createdAt: '2025-10-08T12:02:00Z' },
              { id: '4', title: 'Page2-B', body: 'C', createdAt: '2025-10-08T12:03:00Z' }
            ],
            nextCursor: null
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({
          items: [
            { id: '1', title: 'Page1-A', body: 'X', createdAt: '2025-10-08T12:00:00Z' },
            { id: '2', title: 'Page1-B', body: 'Y', createdAt: '2025-10-08T12:01:00Z' }
          ],
          nextCursor: 'cursor-2'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return origFetch(input as any, init);
    };
  });

  await page.goto("/feed");

  await expect(page.getByText("Page1-A")).toBeVisible();
  await expect(page.getByText("Page1-B")).toBeVisible();

  // Click the real button and wait for items from next page
  await page.getByTestId('feed-load-more').click();

  await expect(page.getByText("Page2-A")).toBeVisible();
  await expect(page.getByText("Page2-B")).toBeVisible();
  await expect(page.getByTestId('feed-end')).toBeVisible();
});
