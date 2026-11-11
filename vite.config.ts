import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { contentSecurityPolicy, githubPagesFallback } from "./build/html-plugins.ts";
import { normalizeBasePath } from "./src/lib/base-path.ts";
import { assertNoPrivilegedKeys, parseConfig } from "./src/lib/config-schema.ts";

export default defineConfig(({ mode }) => {
  // Load .env files plus real environment variables (the deploy workflow sets them).
  const env = loadEnv(mode, process.cwd(), "");
  const base = normalizeBasePath(env.VITE_BASE_PATH);

  // Fail fast if a secret or service_role key was put in a browser-visible variable.
  assertNoPrivilegedKeys(env);
  parseConfig(env);

  return {
    base,
    plugins: [react(), tailwindcss(), contentSecurityPolicy(env.VITE_SUPABASE_URL), githubPagesFallback(base)],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    },
    build: {
      target: "es2022",
      sourcemap: false,
      // Keep font files as separate assets: the Content-Security-Policy only allows fonts from this origin.
      assetsInlineLimit: (filePath: string) => (/\.(woff2?|ttf|otf)$/.test(filePath) ? false : undefined),
      chunkSizeWarningLimit: 600
    },
    server: {
      port: 5173
    },
    preview: {
      port: 4173
    }
  };
});
