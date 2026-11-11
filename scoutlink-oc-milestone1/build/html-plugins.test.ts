import { createHash } from "node:crypto";
import type { Plugin } from "vite";
import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, githubPagesFallback } from "./html-plugins";

type HtmlHook = { handler: (html: string) => string };

function runCsp(plugin: Plugin, html: string): string {
  return (plugin.transformIndexHtml as HtmlHook).handler(html);
}

const html = `<!doctype html><html><head><meta charset="UTF-8" /><script>console.log("theme")</script><script type="module" src="/main.js"></script></head><body></body></html>`;

describe("contentSecurityPolicy", () => {
  it("allows the inline bootstrap script by hash only", () => {
    const out = runCsp(contentSecurityPolicy(undefined), html);
    const hash = createHash("sha256").update('console.log("theme")').digest("base64");
    expect(out).toContain(`script-src 'self' 'sha256-${hash}'`);
    expect(out).not.toContain("'unsafe-inline' 'self'");
    expect(out).toMatch(/<meta charset="UTF-8" \/>\s*<meta http-equiv="Content-Security-Policy"/);
  });

  it("limits network access to this origin plus the configured Supabase project", () => {
    const out = runCsp(contentSecurityPolicy("https://abc.supabase.co"), html);
    expect(out).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co");
    expect(out).toContain("object-src 'none'");
    expect(out).toContain("font-src 'self'");
  });
});

describe("githubPagesFallback", () => {
  it("emits a 404.html that redirects path URLs to hash routes under the base path", () => {
    const emitted: { fileName: string; source: string }[] = [];
    const plugin = githubPagesFallback("/scoutlinkoc/");
    const context = { emitFile: (file: { fileName: string; source: string }) => emitted.push(file) };
    (plugin.generateBundle as unknown as (this: typeof context) => void).call(context);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.fileName).toBe("404.html");
    expect(emitted[0]?.source).toContain('var base = "/scoutlinkoc/"');
    expect(emitted[0]?.source).toContain('base + "#/" + path');
  });
});
