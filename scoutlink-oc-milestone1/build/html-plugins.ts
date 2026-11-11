import { createHash } from "node:crypto";
import type { Plugin } from "vite";

/**
 * Adds a Content-Security-Policy <meta> tag to production builds.
 *
 * GitHub Pages can't send custom response headers, so the policy is delivered
 * in the document. Inline scripts are allowed only by hash (the theme
 * bootstrap in index.html). Network access is limited to this origin and the
 * configured Supabase project. Dev builds skip the policy so hot reload works.
 */
export function contentSecurityPolicy(supabaseUrl: string | undefined): Plugin {
  return {
    name: "scoutlink:csp",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
          .map((match) => match[1] ?? "")
          .filter((body) => body.trim().length > 0)
          .map((body) => `'sha256-${createHash("sha256").update(body).digest("base64")}'`);

        const connect = ["'self'"];
        if (supabaseUrl) {
          const origin = new URL(supabaseUrl).origin;
          connect.push(origin, origin.replace(/^http/, "ws"));
        }

        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(" ")}`.trim(),
          // Radix UI and Sonner position popovers and toasts with inline style attributes.
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self'",
          `connect-src ${connect.join(" ")}`,
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "upgrade-insecure-requests"
        ].join("; ");

        // Insert right after <meta charset> so the charset stays first in <head>.
        const tag = `<meta http-equiv="Content-Security-Policy" content="${policy}" />`;
        return /<meta charset[^>]*>/i.test(html)
          ? html.replace(/(<meta charset[^>]*>)/i, `$1\n    ${tag}`)
          : html.replace("<head>", `<head>\n    ${tag}`);
      }
    }
  };
}

/**
 * Emits a 404.html for GitHub Pages that turns path-style URLs into hash routes.
 *
 * The app uses HashRouter, so "/scoutlink-oc/#/about" always works. If someone
 * types "/scoutlink-oc/about", GitHub Pages serves 404.html; this page sends
 * them to "/scoutlink-oc/#/about" instead of showing GitHub's error page.
 */
export function githubPagesFallback(base: string): Plugin {
  return {
    name: "scoutlink:github-pages-404",
    apply: "build",
    generateBundle() {
      const source = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Redirecting | ScoutLink OC</title>
    <script>
      (function () {
        var base = ${JSON.stringify(base)};
        var loc = window.location;
        var path = loc.pathname.indexOf(base) === 0 ? loc.pathname.slice(base.length) : loc.pathname.replace(/^\\/+/, "");
        path = path.replace(/\\/+$/, "").replace(/^index\\.html$/, "");
        loc.replace(base + "#/" + path + loc.search);
      })();
    </script>
  </head>
  <body>
    <p>Redirecting to ScoutLink OC. If nothing happens, <a href="${base}">open the home page</a>.</p>
  </body>
</html>
`;
      this.emitFile({ type: "asset", fileName: "404.html", source });
    }
  };
}
