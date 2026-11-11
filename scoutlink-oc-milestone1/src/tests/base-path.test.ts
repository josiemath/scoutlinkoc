import { describe, expect, it } from "vitest";
import { normalizeBasePath } from "@/lib/base-path";

describe("normalizeBasePath", () => {
  it("defaults to the site root", () => {
    expect(normalizeBasePath(undefined)).toBe("/");
    expect(normalizeBasePath("")).toBe("/");
    expect(normalizeBasePath("  /  ")).toBe("/");
    expect(normalizeBasePath(".")).toBe("/");
  });

  it("adds leading and trailing slashes for GitHub Pages project sites", () => {
    expect(normalizeBasePath("scoutlink-oc")).toBe("/scoutlink-oc/");
    expect(normalizeBasePath("/scoutlinkoc")).toBe("/scoutlinkoc/");
    expect(normalizeBasePath("scoutlink-oc/")).toBe("/scoutlink-oc/");
    expect(normalizeBasePath("//nested//path//")).toBe("/nested/path/");
  });

  it("rejects full URLs and path traversal", () => {
    expect(() => normalizeBasePath("https://example.com/app/")).toThrow(/not a full URL/);
    expect(() => normalizeBasePath("/../etc/")).toThrow(/unsupported segment/);
    expect(() => normalizeBasePath("/has space/")).toThrow(/unsupported segment/);
  });
});
