/**
 * Configuration parsing, shared by the app (src/lib/env.ts) and the build
 * (vite.config.ts), so a misconfigured deploy fails before anything is published.
 *
 * Browser-visible configuration.
 *
 * Only values prefixed VITE_ reach the browser bundle, so this module also
 * guards against the most damaging mistake: pasting a Supabase secret or
 * service_role key into a VITE_ variable. Such keys bypass Row Level Security
 * and must only live in Edge Function secrets.
 */

export class UnsafeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeConfigurationError";
  }
}

/** Returns true when a key is a Supabase secret key or a service_role JWT. */
export function isPrivilegedSupabaseKey(key: string): boolean {
  const value = key.trim();
  if (value.startsWith("sb_secret_")) return true;
  const parts = value.split(".");
  if (parts.length === 3 && parts[1]) {
    try {
      const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(json) as { role?: unknown };
      return payload.role === "service_role";
    } catch {
      return false;
    }
  }
  return false;
}

function optional(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export interface AppConfig {
  supabase: { url: string; publishableKey: string } | null;
  /** Reference to a written GSOC authorization. While null, the independence notice is shown. */
  authorizationReference: string | null;
}

export function parseConfig(raw: Record<string, unknown>): AppConfig {
  const url = optional(raw.VITE_SUPABASE_URL);
  const publishableKey = optional(raw.VITE_SUPABASE_PUBLISHABLE_KEY);
  const authorizationReference = optional(raw.VITE_GSOC_AUTHORIZATION_REF) ?? null;

  if (url && !isHttpUrl(url)) {
    throw new UnsafeConfigurationError(`VITE_SUPABASE_URL must be an http(s) URL (got "${url}").`);
  }
  if (publishableKey && isPrivilegedSupabaseKey(publishableKey)) {
    throw new UnsafeConfigurationError(
      "VITE_SUPABASE_PUBLISHABLE_KEY contains a Supabase secret or service_role key. Remove it immediately, rotate the key in the Supabase dashboard, and use the publishable key instead."
    );
  }

  return {
    supabase: url && publishableKey ? { url, publishableKey } : null,
    authorizationReference
  };
}

/**
 * Throws if any VITE_ variable holds a privileged Supabase key. Everything
 * prefixed VITE_ is compiled into public JavaScript.
 */
export function assertNoPrivilegedKeys(env: Record<string, string | undefined>): void {
  for (const [name, value] of Object.entries(env)) {
    if (name.startsWith("VITE_") && value && isPrivilegedSupabaseKey(value)) {
      throw new UnsafeConfigurationError(
        `${name} contains a Supabase secret or service_role key. Browser variables are public; remove it, rotate the key, and keep privileged keys in Edge Function secrets.`
      );
    }
  }
}
