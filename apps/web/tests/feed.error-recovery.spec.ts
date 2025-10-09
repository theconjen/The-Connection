import { test, expect } from "@playwright/test";
const FEED_RE = /\/api\/feed(\?|$)/;

test("shows error on second page, recovers on retry", async ({ page }) => {
  page.on('console', (msg) => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
  await page.addInitScript(() => {
    const origFetch = window.fetch.bind(window);
    let failedOnce = false;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (/\/api\/feed(\?|$)/.test(url)) {
        if (!url.includes('cursor=')) {
          return new Response(JSON.stringify({
            items: [ { id: '1', title: 'Page1-A', body: 'x', createdAt: '2025-10-09T12:00:00Z' } ],
            nextCursor: 'cursor-2'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (!failedOnce) {
          failedOnce = true;
          return new Response(JSON.stringify({ message: 'Server Boom' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({
          items: [ { id: '2', title: 'Page2-A', body: 'y', createdAt: '2025-10-09T12:01:00Z' } ],
          nextCursor: null
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return origFetch(input as any, init);
    };
  });

  await page.goto("/feed");

  await expect(page.getByText("Page1-A")).toBeVisible();

  // trigger load more (expect 500)
  await page.getByTestId('feed-load-more').click();
  await expect(page.getByTestId('feed-load-more-error')).toBeVisible();

  // retry works by clicking Load more again
  await page.getByTestId('feed-load-more').click();

  await expect(page.getByText("Page2-A")).toBeVisible();
  await expect(page.getByText(/End of feed/i)).toBeVisible();
});
