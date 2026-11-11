import { describe, expect, it } from "vitest";
import { PUBLIC_PATHS } from "@/app/routes";
import { FOOTER_NAV, PRIMARY_NAV } from "@/lib/site";

describe("site navigation", () => {
  const known = new Set<string>(PUBLIC_PATHS);

  it("every header link points to a real page", () => {
    for (const item of PRIMARY_NAV) expect(known, item.href).toContain(item.href);
  });

  it("every footer link points to a real page", () => {
    for (const group of FOOTER_NAV) {
      for (const item of group.items) expect(known, item.href).toContain(item.href);
    }
  });

  it("footer includes the links the brief requires", () => {
    const hrefs = FOOTER_NAV.flatMap((group) => group.items.map((item) => item.href));
    for (const required of ["/about", "/features", "/safety", "/privacy-policy", "/terms", "/contact"]) {
      expect(hrefs).toContain(required);
    }
  });
});
