import { describe, expect, it } from "vitest";
import { contactSchema, emailSchema, loginSchema, passwordSchema, resetPasswordSchema, signupSchema } from "@/lib/validation";

const firstError = (result: { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } }) =>
  result.error?.issues[0];

describe("emailSchema", () => {
  it("trims and accepts valid addresses", () => {
    expect(emailSchema.parse("  leader@example.org ")).toBe("leader@example.org");
  });

  it("explains what's wrong", () => {
    expect(firstError(emailSchema.safeParse(""))?.message).toBe("Enter your email address.");
    expect(firstError(emailSchema.safeParse("leader@"))?.message).toMatch(/valid email/);
  });
});

describe("passwordSchema", () => {
  it("requires at least 12 characters", () => {
    expect(passwordSchema.safeParse("short-pass").success).toBe(false);
    expect(passwordSchema.safeParse("correct horse battery").success).toBe(true);
  });

  it("enforces the 72-byte limit, counting multi-byte characters", () => {
    expect(passwordSchema.safeParse("a".repeat(72)).success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(73)).success).toBe(false);
    // 30 emoji are 30 characters but 120 bytes.
    expect(passwordSchema.safeParse("🌲".repeat(30)).success).toBe(false);
  });

  it("rejects leading or trailing spaces", () => {
    expect(firstError(passwordSchema.safeParse(" long enough password"))?.message).toMatch(/spaces/);
  });
});

describe("loginSchema", () => {
  it("requires both fields", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(["email", "password"]);
  });
});

describe("signupSchema", () => {
  const valid = {
    email: "leader@example.org",
    password: "a long passphrase",
    confirmPassword: "a long passphrase",
    isAdult: true,
    acceptsPolicies: true
  };

  it("accepts a complete adult sign-up", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("flags mismatched passwords on the confirmation field", () => {
    const issue = firstError(signupSchema.safeParse({ ...valid, confirmPassword: "something else!" }));
    expect(issue?.path).toEqual(["confirmPassword"]);
    expect(issue?.message).toBe("These passwords don't match.");
  });

  it("requires the adult attestation and policy agreement", () => {
    expect(firstError(signupSchema.safeParse({ ...valid, isAdult: false }))?.path).toEqual(["isAdult"]);
    expect(firstError(signupSchema.safeParse({ ...valid, acceptsPolicies: false }))?.path).toEqual(["acceptsPolicies"]);
  });
});

describe("resetPasswordSchema", () => {
  it("requires matching strong passwords", () => {
    expect(resetPasswordSchema.safeParse({ password: "a long passphrase", confirmPassword: "a long passphrase" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: "a long passphrase", confirmPassword: "different one!!" }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  const valid = { name: "Dana R.", email: "dana@example.org", topic: "pilot", message: "We'd like to talk about a pilot in our service unit.", website: "" };

  it("accepts a complete message", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects unknown topics and short messages", () => {
    expect(contactSchema.safeParse({ ...valid, topic: "spam" }).success).toBe(false);
    expect(firstError(contactSchema.safeParse({ ...valid, message: "hi" }))?.message).toMatch(/at least 20/);
  });

  it("rejects submissions that fill the honeypot", () => {
    expect(firstError(contactSchema.safeParse({ ...valid, website: "http://spam.example" }))?.path).toEqual(["website"]);
  });
});
