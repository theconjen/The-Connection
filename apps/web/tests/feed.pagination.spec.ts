import { test, expect } from "@playwright/test";
import { installFetchStub } from "./utils/fetchStub";
import { TID } from "./utils/testids";

test("pagination: first page then load more to end-of-feed", async ({ page }) => {
  await installFetchStub(page, {
  "/feed": (u) => {
      if (u.searchParams.has('cursor')) {
        return { body: { items: [
          { id: '3', title: 'Page2-A', body: 'B', createdAt: '2025-10-08T12:02:00Z' },
          { id: '4', title: 'Page2-B', body: 'C', createdAt: '2025-10-08T12:03:00Z' },
        ], nextCursor: null } };
      }
      return { body: { items: [
        { id: '1', title: 'Page1-A', body: 'X', createdAt: '2025-10-08T12:00:00Z' },
        { id: '2', title: 'Page1-B', body: 'Y', createdAt: '2025-10-08T12:01:00Z' },
      ], nextCursor: 'cursor-2' } };
    }
  });

  await page.goto("/feed");
  await page.getByTestId(TID.lastUpdated).waitFor();
  await page.getByTestId(TID.loadMore).waitFor();

  // Click the real button and wait for items from next page
  await page.getByTestId(TID.loadMore).click();

  await page.getByTestId(TID.end).waitFor();
});
