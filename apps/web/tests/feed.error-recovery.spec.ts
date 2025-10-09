import { test, expect } from "@playwright/test";
const FEED_RE = /\/api\/feed(\?|$)/;

test("shows error on second page, recovers on retry", async ({ page }) => {
  const failedOnceForCursor = new Set<string>();

  await page.route(FEED_RE, (route) => {
    const url = new URL(route.request().url());
    const cursor = url.searchParams.get("cursor");

    if (!cursor) {
      // page 1 success
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            { id: "1", title: "Page1-A", body: "x", createdAt: "2025-10-09T12:00:00Z" },
          ],
          nextCursor: "cursor-2",
        }),
      });
    }

    if (!failedOnceForCursor.has(cursor)) {
      // First attempt for this cursor fails with 500
      failedOnceForCursor.add(cursor);
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Server Boom" }),
      });
    }

    // retry success
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          { id: "2", title: "Page2-A", body: "y", createdAt: "2025-10-09T12:01:00Z" },
        ],
        nextCursor: null,
      }),
    });
  });

  await Promise.all([
    page.waitForResponse((r) => FEED_RE.test(r.url()) && r.status() === 200),
    page.goto("/feed"),
  ]);

  await expect(page.getByText("Page1-A")).toBeVisible();

  // trigger load more (expect 500)
  await Promise.all([
    page.waitForResponse((r) => FEED_RE.test(r.url()) && r.url().includes("cursor=") && r.status() === 500),
    page.getByRole("button", { name: /Load more/i }).click(),
  ]);
  await expect(page.getByText(/Failed to load/i)).toBeVisible();

  // retry works by clicking Load more again
  await Promise.all([
    page.waitForResponse((r) => FEED_RE.test(r.url()) && r.url().includes("cursor=") && r.status() === 200),
    page.getByRole("button", { name: /Load more/i }).click(),
  ]);

  await expect(page.getByText("Page2-A")).toBeVisible();
  await expect(page.getByText(/End of feed/i)).toBeVisible();
});
