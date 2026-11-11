import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against a production build served under a sub-path,
// the same way GitHub Pages serves a project site.
const BASE_PATH = "/scoutlink-oc/";
const PORT = 4173;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    trace: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : {}
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { VITE_BASE_PATH: BASE_PATH }
  }
});
