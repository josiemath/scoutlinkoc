import type { AuthRedirect } from "./auth-redirect";
import { authRedirectUrl } from "./auth-redirect";
import { AppError } from "./errors";
import { requireSupabase } from "./supabase";

/**
 * Account actions backed by Supabase Auth. Each throws on failure; pass the
 * error to friendlyError() for display.
 */

export async function signIn(email: string, password: string): Promise<void> {
  const supabase = await requireSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export interface SignUpResult {
  /** False when the project doesn't require email confirmation and the user is signed in already. */
  needsEmailConfirmation: boolean;
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: authRedirectUrl("/onboarding") }
  });
  // Supabase reports an already-registered email as a success with no session,
  // so the response is the same whether or not an account exists.
  if (error && error.code !== "user_already_exists") throw error;
  return { needsEmailConfirmation: !data.session };
}

export async function sendPasswordReset(email: string): Promise<void> {
  const supabase = await requireSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: authRedirectUrl("/reset-password")
  });
  // Unknown emails get the same response as known ones, so nobody can probe for accounts.
  if (error && error.code !== "user_not_found") throw error;
}

/** Sets a new password for the signed-in user (after a reset link, or from settings). */
export async function setPassword(password: string): Promise<void> {
  const supabase = await requireSupabase();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/** Changes the password after confirming the current one, so an unattended session can't lock someone out. */
export async function changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
  const supabase = await requireSupabase();
  const check = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (check.error) {
    throw check.error.code === "invalid_credentials" ? new AppError("wrong_current_password", check.error) : check.error;
  }
  await setPassword(newPassword);
}

/** Signs out this browser, or every device when scope is "global". */
export async function signOut(scope: "local" | "global" = "local"): Promise<void> {
  const supabase = await requireSupabase();
  const { error } = await supabase.auth.signOut({ scope });
  // Signing out locally always clears this browser even if the server call fails.
  if (error && scope === "global") throw error;
}

const exchanges = new Map<string, Promise<void>>();

/**
 * Finishes sign-in from an email link. Memoized per code: a code works once,
 * and React may run the calling effect twice in development.
 */
export function completeAuthRedirect(redirect: AuthRedirect): Promise<void> {
  if (redirect.error) return Promise.reject(new AppError(redirect.error));
  const code = redirect.code;
  if (!code) return Promise.reject(new AppError("flow_state_not_found"));
  let exchange = exchanges.get(code);
  if (!exchange) {
    exchange = requireSupabase().then(async (supabase) => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    });
    exchanges.set(code, exchange);
  }
  return exchange;
}
