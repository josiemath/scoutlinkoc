import { defineConfig, devices } from "@playwright/test";
import { MOCK_SUPABASE_URL } from "./e2e/support/mock-supabase.ts";

// End-to-end tests run against production builds served under a sub-path,
// the same way GitHub Pages serves a project site:
// - port 4173: built without Supabase (accounts closed), for the public site
// - port 4174: built against a mock Supabase API that e2e/support/mock-supabase.ts
//   answers inside the browser, for sign-in and account pages
const BASE_PATH = "/scoutlink-oc/";
const PORT = 4173;
const ACCOUNTS_PORT = 4174;
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
    { name: "desktop", testIgnore: /accounts\.spec/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", testIgnore: /accounts\.spec/, use: { ...devices["Pixel 7"] } },
    {
      name: "accounts-desktop",
      testMatch: /accounts\.spec/,
      use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${ACCOUNTS_PORT}${BASE_PATH}` }
    },
    {
      name: "accounts-mobile",
      testMatch: /accounts\.spec/,
      use: { ...devices["Pixel 7"], baseURL: `http://localhost:${ACCOUNTS_PORT}${BASE_PATH}` }
    }
  ],
  webServer: [
    {
      command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}${BASE_PATH}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { VITE_BASE_PATH: BASE_PATH }
    },
    {
      command: `npx vite build --outDir dist-e2e-accounts && npx vite preview --outDir dist-e2e-accounts --port ${ACCOUNTS_PORT} --strictPort`,
      url: `http://localhost:${ACCOUNTS_PORT}${BASE_PATH}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      // A publishable-style placeholder: the mock accepts any key, and secret keys are refused by the build.
      env: { VITE_BASE_PATH: BASE_PATH, VITE_SUPABASE_URL: MOCK_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_e2e_placeholder" }
    }
  ]
});
