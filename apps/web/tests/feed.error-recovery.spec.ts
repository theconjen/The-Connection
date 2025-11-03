import { test, expect } from "@playwright/test";
import { installFetchStub } from "./utils/fetchStub";
import { TID } from "./utils/testids";

test("shows error on second page, recovers on retry", async ({ page }) => {
  await installFetchStub(page, {
  "/feed": (() => {
      let failedOnce = false;
      return (u: URL) => {
        if (!u.searchParams.has('cursor')) {
          return { body: { items: [ { id: '1', title: 'P1', body: 'A', createdAt: '2025-10-09T12:00:00Z' } ], nextCursor: 'cursor-2' } };
        }
        if (!failedOnce) {
          failedOnce = true;
          return { status: 500, body: { message: 'Server Boom' } };
        }
        return { body: { items: [ { id: '2', title: 'P2', body: 'B', createdAt: '2025-10-09T12:01:00Z' } ], nextCursor: null } };
      };
    })()
  });

  await page.goto("/feed");
  await page.getByTestId(TID.lastUpdated).waitFor();
  await page.getByTestId(TID.loadMore).waitFor();

  // trigger load more (expect 500)
  await page.getByTestId(TID.loadMore).click();
  await page.getByTestId(TID.loadMoreError).waitFor();

  // retry works by clicking Load more again
  await page.getByTestId(TID.loadMore).click();
  await page.getByTestId(TID.end).waitFor();
});
