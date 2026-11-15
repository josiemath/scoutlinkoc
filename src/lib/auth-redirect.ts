/**
 * Email links (confirm sign-up, reset password) return to the site as
 * `https://host/base/?next=/onboarding&code=…`. HashRouter routes on the part
 * after `#`, so before the router starts we lift the auth parameters out of
 * the query string, clean the address bar, and send the visitor to
 * `#/auth/callback`, which finishes sign-in and continues to `next`.
 */

export interface AuthRedirect {
  code: string | null;
  /** Error code from Supabase, e.g. `otp_expired`. */
  error: string | null;
  next: string;
}

const DEFAULT_NEXT = "/dashboard";
let pending: AuthRedirect | null = null;

/**
 * Only same-site, absolute app paths are allowed as a destination, so a crafted
 * link can't bounce someone to another website after they sign in.
 */
export function safeNextPath(value: string | null | undefined, fallback = DEFAULT_NEXT): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\s\0]/.test(value) || /^\/+[a-z][a-z0-9+.-]*:/i.test(value)) return fallback;
  if (value.startsWith("/auth/callback")) return fallback;
  return value;
}

/** Reads auth parameters from a URL. Returns null when the URL isn't an auth redirect. */
export function parseAuthRedirect(url: URL): AuthRedirect | null {
  const query = url.searchParams;
  // Implicit-flow errors arrive in the hash as `#error=…`; HashRouter would treat that as a route.
  const hash = url.hash.startsWith("#error") ? new URLSearchParams(url.hash.slice(1)) : null;
  const code = query.get("code");
  const error = query.get("error_code") ?? query.get("error") ?? hash?.get("error_code") ?? hash?.get("error") ?? null;
  if (!code && !error) return null;
  return { code, error, next: safeNextPath(query.get("next")) };
}

/**
 * Runs once at startup, before the router is created. Stores any auth
 * redirect and rewrites the address bar so the code isn't left in history.
 */
export function captureAuthRedirect(location: Location = window.location, history: History = window.history): void {
  const redirect = parseAuthRedirect(new URL(location.href));
  if (!redirect) return;
  pending = redirect;
  history.replaceState(null, "", `${location.pathname}#/auth/callback`);
}

/** The redirect captured at startup, if any. */
export function getPendingAuthRedirect(): AuthRedirect | null {
  return pending;
}

/** Replaces the stored redirect. Pass null once it has been handled. */
export function setPendingAuthRedirect(redirect: AuthRedirect | null) {
  pending = redirect;
}

/** The URL Supabase should send people back to after they click an email link. */
export function authRedirectUrl(next: string): string {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  base.searchParams.set("next", safeNextPath(next));
  return base.toString();
}
