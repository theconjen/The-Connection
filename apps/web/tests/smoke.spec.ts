import { test, expect } from "@playwright/test";

const ENV = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const EXPECTED_API_BASE = ENV.SMOKE_API_BASE ?? "https://api.theconnection.app/api";
const HEALTH_ENDPOINT = `${EXPECTED_API_BASE}/health`;

test("home renders + API healthy", async ({ page, request }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Connection/i);

  const apiBase = await page.evaluate(() => (window as any).__API_BASE);
  expect(apiBase).toBe(EXPECTED_API_BASE);

  const response = await request.get(HEALTH_ENDPOINT);
  expect(response.ok()).toBeTruthy();
});
