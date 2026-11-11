import { describe, expect, it } from "vitest";
import { isPrivilegedSupabaseKey, parseConfig, UnsafeConfigurationError } from "@/lib/env";

/** Builds an unsigned JWT-shaped string with the given payload (signature is irrelevant here). */
function fakeJwt(payload: Record<string, unknown>) {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

describe("isPrivilegedSupabaseKey", () => {
  it("flags secret keys and service_role JWTs", () => {
    expect(isPrivilegedSupabaseKey("sb_secret_abc123")).toBe(true);
    expect(isPrivilegedSupabaseKey(fakeJwt({ role: "service_role", iss: "supabase" }))).toBe(true);
  });

  it("accepts publishable and anon keys", () => {
    expect(isPrivilegedSupabaseKey("sb_publishable_abc123")).toBe(false);
    expect(isPrivilegedSupabaseKey(fakeJwt({ role: "anon", iss: "supabase" }))).toBe(false);
    expect(isPrivilegedSupabaseKey("not.a.jwt")).toBe(false);
  });
});

describe("parseConfig", () => {
  it("leaves the backend unconfigured when variables are missing or blank", () => {
    expect(parseConfig({}).supabase).toBeNull();
    expect(parseConfig({ VITE_SUPABASE_URL: "https://x.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "  " }).supabase).toBeNull();
  });

  it("returns the Supabase settings when both are present", () => {
    const config = parseConfig({ VITE_SUPABASE_URL: " https://x.supabase.co ", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_123" });
    expect(config.supabase).toEqual({ url: "https://x.supabase.co", publishableKey: "sb_publishable_123" });
  });

  it("refuses to start with a secret key in a browser variable", () => {
    expect(() => parseConfig({ VITE_SUPABASE_URL: "https://x.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_oops" })).toThrow(UnsafeConfigurationError);
  });

  it("rejects a malformed Supabase URL", () => {
    expect(() => parseConfig({ VITE_SUPABASE_URL: "javascript:alert(1)", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_1" })).toThrow(/http\(s\) URL/);
  });

  it("shows the independence notice unless an authorization reference is configured", () => {
    expect(parseConfig({}).authorizationReference).toBeNull();
    expect(parseConfig({ VITE_GSOC_AUTHORIZATION_REF: "GSOC-2027-001" }).authorizationReference).toBe("GSOC-2027-001");
  });
});
