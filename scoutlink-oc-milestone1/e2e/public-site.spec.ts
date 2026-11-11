import { expect, test, type Page } from "@playwright/test";

const PUBLIC_ROUTES: [path: string, heading: RegExp][] = [
  ["", /Connecting Troops\./],
  ["#/about", /About ScoutLink OC/],
  ["#/features", /^Features$/],
  ["#/how-it-works", /How it works/],
  ["#/safety", /Safety and privacy/],
  ["#/contact", /^Contact$/],
  ["#/privacy-policy", /Privacy policy/],
  ["#/terms", /Terms of use/],
  ["#/login", /Sign in/],
  ["#/signup", /Request access/],
  ["#/forgot-password", /Forgot your password/],
  ["#/reset-password", /Choose a new password/],
  ["#/404", /This trail doesn't lead anywhere/]
];

/** Collects console errors (including Content-Security-Policy violations) and uncaught exceptions. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test.describe("public site", () => {
  test("visitor opens the homepage", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("./");
    await expect(page).toHaveTitle("ScoutLink OC");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Connecting Troops.");
    await expect(page.getByRole("link", { name: /Explore ScoutLink OC/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Learn How It Works" })).toBeVisible();
    await expect(page.getByTestId("independence-notice")).toContainText(
      "Independent ScoutLink OC demonstration. Not an official Girl Scouts of Orange County service unless separately authorized."
    );
    expect(errors).toEqual([]);
  });

  for (const [path, heading] of PUBLIC_ROUTES) {
    test(`loads ${path || "home"} directly, survives a reload and fits the screen`, async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto(`./${path}`);
      await expect(page.getByRole("heading", { level: 1 }).filter({ hasText: heading }).first()).toBeVisible();
      await page.reload();
      await expect(page.getByRole("heading", { level: 1 }).filter({ hasText: heading }).first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "page should not scroll sideways").toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test("unknown addresses show the not-found page", async ({ page }) => {
    await page.goto("./#/explore/does-not-exist");
    await expect(page.getByRole("heading", { level: 1, name: /This trail doesn't lead anywhere/ })).toBeVisible();
    await page.getByRole("link", { name: "Back to the home page" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Connecting Troops.");
  });

  test("GitHub Pages fallback page redirects path URLs into the app", async ({ request }) => {
    const response = await request.get("404.html");
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain('var base = "/scoutlink-oc/"');
    expect(body).toContain('base + "#/" + path');
  });

  test("the color theme can be switched and is remembered", async ({ page }) => {
    await page.goto("./");
    await page.getByRole("button", { name: /Color theme/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("feature deep links scroll to their section", async ({ page }) => {
    await page.goto("./");
    await page.getByRole("link", { name: "How events work" }).click();
    await expect(page).toHaveURL(/#\/features#events$/);
    await expect(page.getByRole("heading", { level: 2, name: "Events and calendars" })).toBeInViewport();
  });

  test("sign-in validates input and never pretends to sign in", async ({ page }) => {
    await page.goto("./#/login");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("Enter your email address.")).toBeVisible();
    await page.getByLabel("Email").fill("leader@example.org");
    await page.getByLabel("Password", { exact: true }).fill("correct horse battery");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator("#login-closed-notice")).toBeFocused();
    await expect(page).toHaveURL(/#\/login$/);
  });

  test("keyboard users can skip straight to the content", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard navigation is checked on desktop.");
    await page.goto("./");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });
});

test.describe("navigation", () => {
  test("desktop header links reach every section", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop navigation only.");
    await page.goto("./");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const [label, heading] of [
      ["About", /About ScoutLink OC/],
      ["Features", /^Features$/],
      ["How it works", /How it works/],
      ["Safety", /Safety and privacy/],
      ["Contact", /^Contact$/]
    ] as const) {
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    }
  });

  test("mobile menu opens, navigates and closes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile navigation only.");
    await page.goto("./");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog");
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Safety" }).click();
    await expect(menu).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Safety and privacy");
  });

  test("footer links reach the legal pages", async ({ page }) => {
    await page.goto("./");
    const footer = page.getByRole("contentinfo");
    await footer.getByRole("link", { name: "Privacy" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy policy");
    await expect(page.getByText("Draft template, not in effect")).toBeVisible();
    await page.getByRole("contentinfo").getByRole("link", { name: "Terms" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of use");
  });
});
