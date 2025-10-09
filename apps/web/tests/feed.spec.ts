import { test, expect } from "@playwright/test";

const FEED_GLOB = "**/api/feed";
const FEED_RE = /\/api\/feed(\?|$)/;

test("feed renders, refresh works, and error retry path", async ({ page }) => {
  // 1) Initial load mocked success
  await page.route(FEED_GLOB, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "1", title: "Hello", body: "World", createdAt: "2025-10-08T12:00:00Z" },
        { id: "2", title: "Foo", body: "Bar", createdAt: "2025-10-08T12:01:00Z" },
      ]),
    })
  );
    await Promise.all([
      page.waitForResponse((resp) => FEED_RE.test(resp.url()) && resp.status() === 200),
      page.goto("/feed"),
    ]);
  await page.goto("/feed");

  // Skeletons visible, then content (Last updated implies data load)
  await expect(page.getByText(/Last updated/i)).toBeVisible();
  await expect(page.getByText("Hello")).toBeVisible();

  // 2) Refresh mocked error
  await page.unroute(FEED_GLOB);
  await page.route(FEED_GLOB, (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "boom" }),
    })
  );

  await Promise.all([
    page.waitForResponse((resp) => FEED_RE.test(resp.url()) && resp.status() === 500),
    page.getByRole("button", { name: /Refresh/i }).click(),
  ]);

  await expect(page.getByText(/Failed to load feed/i)).toBeVisible();
  await expect(page.getByText(/boom/i)).toBeVisible();

  // 3) Retry mocked success
  await page.unroute(FEED_GLOB);
  await page.route(FEED_GLOB, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "3", title: "Retry", body: "OK", createdAt: "2025-10-08T12:02:00Z" },
      ]),
    })
  );

  await Promise.all([
    page.waitForResponse((resp) => FEED_RE.test(resp.url()) && resp.status() === 200),
    page.getByText(/Try again/i).click(),
  ]);

  await expect(page.getByText("Retry")).toBeVisible();
});
