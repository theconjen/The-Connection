import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:5173", locale: "en-US" },
  webServer: {
    // __dirname is not available in ESM; use process.cwd() which will be apps/web
    cwd: process.cwd(),
    command: "npm run dev",
    url: "http://localhost:5173",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
