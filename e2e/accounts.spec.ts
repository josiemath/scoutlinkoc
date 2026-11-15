import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mockSupabase, signIn } from "./support/mock-supabase";

// These run against the build configured with a (mocked) Supabase project,
// so the real supabase-js client, session storage and routing are exercised.

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`);
  expect(summary).toEqual([]);
}

test("signed-out visitors are sent to sign in and returned afterwards", async ({ page }) => {
  await mockSupabase(page);
  await page.goto("./#/settings");
  await expect(page).toHaveURL(/#\/login\?next=%2Fsettings$/);
  await page.getByLabel("Email").fill("alice@example.org");
  await page.getByLabel("Password", { exact: true }).fill("correct horse battery");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  await expect(page).toHaveURL(/#\/settings$/);
});

test("a wrong password gets a clear message", async ({ page }) => {
  await mockSupabase(page);
  await page.goto("./#/login");
  await page.getByLabel("Email").fill("alice@example.org");
  await page.getByLabel("Password", { exact: true }).fill("not the password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator("#login-error")).toBeFocused();
  await expect(page.locator("#login-error")).toContainText("That email and password don't match an account.");
});

test("the session survives a reload, and signing out ends it", async ({ page, isMobile }) => {
  await mockSupabase(page);
  await signIn(page);
  await expect(page.getByRole("heading", { level: 1, name: "Hi, Alice Rivera" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Hi, Alice Rivera" })).toBeVisible();

  await page.getByRole("button", { name: "Account menu for Alice Rivera" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/#\/$/);
  if (!isMobile) await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
  await page.goto("./#/dashboard");
  await expect(page).toHaveURL(/#\/login\?next=%2Fdashboard$/);
});

test("a new volunteer requests verification", async ({ page }) => {
  const supabase = await mockSupabase(page);
  await signIn(page, "#/login?next=%2Fonboarding");
  await expect(page.getByRole("heading", { level: 1, name: "Ask to be verified" })).toBeVisible();
  await page.getByRole("radio", { name: /Troop leader/ }).check();
  await page.getByLabel("Service unit", { exact: true }).selectOption({ label: "North OC Service Unit (fictional)" });
  await page.getByLabel("Troop", { exact: true }).selectOption({ label: "Troop 404" });
  await page.getByRole("checkbox", { name: /I agree to the current Terms/ }).check();
  await page.getByRole("button", { name: "Send verification request" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Hi, Alice Rivera" })).toBeVisible();
  await expect(page.getByText("Your request is waiting for review")).toBeVisible();
  const call = supabase.rpcCalls.find((c) => c.name === "submit_onboarding");
  expect(call?.body).toMatchObject({ p_requested_role: "troop_leader", p_troop_id: "7e000000-0000-4000-8000-000000000404" });
});

test("only administrators see the verification queue", async ({ page }) => {
  const supabase = await mockSupabase(page, { state: "active" });
  await signIn(page, "#/login?next=%2Fadmin%2Fverifications");
  await expect(page.getByRole("heading", { level: 1, name: "You can't open this page" })).toBeVisible();
  expect(supabase.rpcCalls.some((c) => c.name === "admin_list_verification_requests")).toBe(false);
});

test("the contact form sends through the database", async ({ page }) => {
  const supabase = await mockSupabase(page);
  await page.goto("./#/contact");
  await page.getByLabel("Your name").fill("Dana R.");
  await page.getByLabel("Email").fill("dana@example.org");
  await page.getByLabel("Topic").selectOption("pilot");
  await page.getByLabel("Message").fill("We'd like to talk about a pilot in our service unit.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("#contact-sent")).toBeFocused();
  expect(supabase.rpcCalls.find((c) => c.name === "submit_contact_message")?.body).toMatchObject({ p_topic: "pilot", p_website: "" });
});

for (const theme of ["light", "dark"] as const) {
  test.describe(`signed-in pages are accessible (${theme} theme)`, () => {
    const pages = [
      { path: "#/dashboard", heading: "Hi, Alice Rivera", account: {} },
      { path: "#/onboarding", heading: "Ask to be verified", account: {} },
      { path: "#/profile", heading: "Profile", account: { state: "active" as const } },
      { path: "#/settings", heading: "Settings", account: {} },
      { path: "#/admin/verifications", heading: "Verification requests", account: { state: "active" as const, admin: true } },
      { path: "#/dashboard", heading: "Hi, Alice Rivera", account: { state: "suspended" as const } }
    ];
    for (const { path, heading, account } of pages) {
      test(`${path} (${account.state ?? "pending"}${"admin" in account ? ", admin" : ""})`, async ({ page }) => {
        await page.addInitScript((value) => window.localStorage.setItem("scoutlink-theme", value), theme);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await mockSupabase(page, account);
        await signIn(page, `#/login?next=${encodeURIComponent(path.slice(1))}`);
        await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
        await expectNoAxeViolations(page);
      });
    }
  });
}

test("account pages fit small screens without sideways scrolling", async ({ page }) => {
  await mockSupabase(page, { state: "active", admin: true });
  await signIn(page, "#/login?next=%2Fadmin%2Fverifications");
  await expect(page.getByRole("heading", { level: 2, name: "Bea Nguyen" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
