import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PUBLIC_PATHS } from "@/app/routes";
import { INDEPENDENCE_NOTICE } from "@/lib/site";
import { renderRoute } from "./test-utils";

const EXPECTED_HEADINGS: Record<(typeof PUBLIC_PATHS)[number], RegExp> = {
  "/": /Connecting Troops\./,
  "/about": /About ScoutLink OC/,
  "/features": /^Features$/,
  "/how-it-works": /How it works/,
  "/safety": /Safety and privacy/,
  "/contact": /^Contact$/,
  "/privacy-policy": /Privacy policy/,
  "/terms": /Terms of use/,
  "/login": /Sign in/,
  "/signup": /Request access/,
  "/forgot-password": /Forgot your password/,
  "/reset-password": /Choose a new password/,
  "/404": /This trail doesn't lead anywhere/
};

describe("public routes", () => {
  it.each(PUBLIC_PATHS)("renders %s with a page heading", async (path) => {
    renderRoute(path);
    const headings = await screen.findAllByRole("heading", { level: 1 }, { timeout: 5000 });
    expect(headings.some((heading) => EXPECTED_HEADINGS[path].test(heading.textContent ?? ""))).toBe(true);
  });

  it("shows the not-found page for unknown addresses", async () => {
    renderRoute("/explore/this-does-not-exist");
    expect(await screen.findByRole("heading", { level: 1, name: /This trail doesn't lead anywhere/ })).toBeInTheDocument();
  });

  it("shows the independence notice in the footer", async () => {
    renderRoute("/");
    expect(await screen.findByTestId("independence-notice")).toHaveTextContent(INDEPENDENCE_NOTICE);
  });

  it("sets a page title", async () => {
    renderRoute("/safety");
    await waitFor(() => expect(document.title).toBe("Safety and privacy | ScoutLink OC"));
  });

  it("marks legal pages as drafts that aren't in effect", async () => {
    renderRoute("/terms");
    expect(await screen.findByText("Draft template, not in effect")).toBeInTheDocument();
  });

  it("never shows a featured activity it doesn't have", async () => {
    renderRoute("/");
    expect(await screen.findByText("No public activities are listed yet")).toBeInTheDocument();
  });
});
