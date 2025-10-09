import { test, expect } from "@playwright/test";

const FEED_GLOB = "**/api/feed**";
const FEED_RE = /\/api\/feed(\?|$)/;

test("feed renders, refresh works, and error retry path", async ({ page }) => {
  page.on('console', (msg) => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
  page.on('request', (req) => { if (/\/api\/feed/.test(req.url())) console.log('REQUEST:', req.url()); });
  page.on('response', async (res) => { if (/\/api\/feed/.test(res.url())) console.log('RESPONSE:', res.status(), res.url()); });
    // Install a deterministic fetch stub for /api/feed
    await page.addInitScript(() => {
      // @ts-ignore
      window.__FEED_MOCK__ = { mode: 'initial' };
      const origFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (/\/api\/feed(\?|$)/.test(url)) {
          // @ts-ignore
          const mode = window.__FEED_MOCK__?.mode;
          if (mode === 'initial') {
            return new Response(JSON.stringify([
              { id: '1', title: 'Hello', body: 'World', createdAt: '2025-10-08T12:00:00Z' },
              { id: '2', title: 'Foo', body: 'Bar', createdAt: '2025-10-08T12:01:00Z' },
            ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          if (mode === 'error') {
            return new Response(JSON.stringify({ error: 'boom' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
          }
          if (mode === 'retry') {
            return new Response(JSON.stringify([
              { id: '3', title: 'Retry', body: 'OK', createdAt: '2025-10-08T12:02:00Z' },
            ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        }
        return origFetch(input as any, init);
      };
    });
  await page.goto("/feed");

  // Skeletons visible, then content (Last updated implies data load)
  await expect(page.getByTestId('feed-last-updated')).toBeVisible();
  await expect(page.getByText("Hello")).toBeVisible();

  // 2) Refresh mocked error
    await page.evaluate(() => { (window as any).__FEED_MOCK__.mode = 'error'; });

  await page.getByTestId('feed-refresh').click();

  await expect(page.getByTestId('feed-initial-error')).toBeVisible();
  await expect(page.getByText(/boom/i)).toBeVisible();

  // 3) Retry mocked success
    await page.evaluate(() => { (window as any).__FEED_MOCK__.mode = 'retry'; });

  await page.getByTestId('feed-try-again').click();

  await expect(page.getByText("Retry")).toBeVisible();
});
