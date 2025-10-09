import { test, expect } from "@playwright/test";

const FEED_GLOB = "**/api/feed**"; // allow query string (cursor)
const FEED_RE = /\/api\/feed(\?|$)/;

test("pagination: first page then load more to end-of-feed", async ({ page }) => {
  await page.route(FEED_GLOB, (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.has("cursor")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            { id: "3", title: "Page2-A", body: "B", createdAt: "2025-10-08T12:02:00Z" },
            { id: "4", title: "Page2-B", body: "C", createdAt: "2025-10-08T12:03:00Z" }
          ],
          nextCursor: null
        })
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          { id: "1", title: "Page1-A", body: "X", createdAt: "2025-10-08T12:00:00Z" },
          { id: "2", title: "Page1-B", body: "Y", createdAt: "2025-10-08T12:01:00Z" }
        ],
        nextCursor: "cursor-2"
      })
    });
  });

  await Promise.all([
    page.waitForResponse((r) => FEED_RE.test(r.url()) && r.status() === 200),
    page.goto("/feed")
  ]);

  await expect(page.getByText("Page1-A")).toBeVisible();
  await expect(page.getByText("Page1-B")).toBeVisible();

  // Click the real button and wait for cursor request
  await Promise.all([
    page.waitForResponse((r) => FEED_RE.test(r.url()) && r.url().includes('cursor=') && r.status() === 200),
    page.getByRole('button', { name: /Load more/i }).click()
  ]);

  await expect(page.getByText("Page2-A")).toBeVisible();
  await expect(page.getByText("Page2-B")).toBeVisible();
  await expect(page.getByText(/End of feed/i)).toBeVisible();
});
