import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["", "#/about", "#/features", "#/how-it-works", "#/safety", "#/contact", "#/privacy-policy", "#/terms", "#/login", "#/signup", "#/forgot-password", "#/reset-password", "#/404"];

// Automated WCAG 2.2 A/AA checks with axe. They catch a large share of issues
// (contrast, labels, landmarks, ARIA) but don't replace manual testing.
for (const theme of ["light", "dark"] as const) {
  test.describe(`accessibility (${theme} theme)`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => window.localStorage.setItem("scoutlink-theme", value), theme);
    });

    for (const route of ROUTES) {
      test(`${route || "home"} has no detectable WCAG A/AA violations`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(`./${route}`);
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`);
        expect(summary).toEqual([]);
      });
    }
  });
}

test("form errors are announced and linked to their fields", async ({ page }) => {
  await page.goto("./#/signup");
  await page.getByRole("button", { name: "Create account" }).click();
  const email = page.getByLabel("Email");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  const describedBy = await email.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  const messageId = describedBy!.split(" ").find((id) => id.endsWith("-message"));
  await expect(page.locator(`[id="${messageId}"]`)).toHaveText("Enter your email address.");
});
