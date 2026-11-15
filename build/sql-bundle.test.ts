// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain JavaScript script without type declarations
import { bundleMigrations } from "../scripts/bundle-sql.mjs";

describe("supabase/setup.sql", () => {
  it("matches the migrations (run `npm run db:bundle` after changing them)", () => {
    const committed = readFileSync(join(process.cwd(), "supabase", "setup.sql"), "utf8");
    expect(committed).toBe((bundleMigrations as () => string)());
  });
});
