import { describe, expect, it } from "vitest";
import { captureAuthRedirect, getPendingAuthRedirect, parseAuthRedirect, safeNextPath, setPendingAuthRedirect } from "@/lib/auth-redirect";
import { friendlyError } from "@/lib/errors";

describe("safeNextPath", () => {
  it.each(["/dashboard", "/settings", "/admin/verifications?status=approved"])("allows app path %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each([
    "//evil.example",
    "https://evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/javascript:alert(1)",
    "dashboard",
    "/auth/callback",
    "/ spaced",
    "",
    null
  ])("rejects %s", (path) => {
    expect(safeNextPath(path)).toBe("/dashboard");
  });
});

describe("parseAuthRedirect", () => {
  it("reads a PKCE code and destination", () => {
    expect(parseAuthRedirect(new URL("https://x.test/scoutlinkoc/?next=%2Fonboarding&code=abc"))).toEqual({
      code: "abc",
      error: null,
      next: "/onboarding"
    });
  });

  it("prefers the specific error code", () => {
    const url = new URL("https://x.test/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid");
    expect(parseAuthRedirect(url)).toMatchObject({ code: null, error: "otp_expired" });
  });

  it("reads errors Supabase puts in the hash", () => {
    expect(parseAuthRedirect(new URL("https://x.test/#error=access_denied&error_code=otp_expired"))?.error).toBe("otp_expired");
  });

  it("ignores ordinary page loads and app routes", () => {
    expect(parseAuthRedirect(new URL("https://x.test/scoutlinkoc/#/about"))).toBeNull();
  });

  it("refuses to continue to another site", () => {
    expect(parseAuthRedirect(new URL("https://x.test/?code=abc&next=https://evil.example"))?.next).toBe("/dashboard");
  });
});

describe("captureAuthRedirect", () => {
  it("moves the code out of the address bar and routes to the callback page", () => {
    setPendingAuthRedirect(null);
    window.history.replaceState(null, "", "/scoutlinkoc/?next=%2Fonboarding&code=abc");
    captureAuthRedirect();
    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("#/auth/callback");
    expect(getPendingAuthRedirect()).toEqual({ code: "abc", error: null, next: "/onboarding" });
    window.history.replaceState(null, "", "/");
    setPendingAuthRedirect(null);
  });
});

describe("friendlyError", () => {
  it("maps Supabase Auth codes", () => {
    expect(friendlyError({ code: "over_email_send_rate_limit", message: "email rate limit exceeded" })).toMatch(/Too many emails/);
  });

  it("maps database function codes carried in the message", () => {
    expect(friendlyError({ code: "P0001", message: "cannot_review_own_request" })).toBe(
      "Another administrator has to review your own request."
    );
  });

  it("maps permission errors", () => {
    expect(friendlyError({ code: "42501", message: "permission denied for table profiles" })).toBe(
      "You don't have permission to see or change this."
    );
  });

  it("recognizes network failures", () => {
    expect(friendlyError(new TypeError("Failed to fetch"))).toMatch(/Check your internet connection/);
  });

  it("never shows unknown server text", () => {
    const message = friendlyError({ code: "XX000", message: 'relation "private.settings" does not exist' });
    expect(message).not.toMatch(/private|relation/);
    expect(message).toMatch(/Something went wrong/);
  });
});
