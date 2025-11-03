import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? process.env.SMOKE_BASE_URL ?? "https://www.theconnection.app";
const shouldStartWebServer = /^https?:\/\/(localhost|127(?:\.[0-9]+){0,2})(?::\d+)?/i.test(baseURL);

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL,
    locale: process.env.PLAYWRIGHT_TEST_LOCALE || "en-US",
  },
  webServer: shouldStartWebServer
    ? {
        cwd: process.cwd(),
        command: "pnpm run dev",
        url: baseURL,
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
        env: { VITE_API_HOST: "http://localhost:5000/api" },
      }
    : undefined,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
