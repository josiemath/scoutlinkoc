/**
 * Turns Supabase Auth and database errors into plain-language messages.
 *
 * Database functions raise short codes (see supabase/migrations), Supabase Auth
 * returns error codes, and network failures surface as TypeErrors. Anything
 * unrecognized gets a generic message: raw server text is never shown, so
 * internals don't leak into the interface.
 */

const MESSAGES: Record<string, string> = {
  // Supabase Auth
  invalid_credentials: "That email and password don't match an account. Check them and try again.",
  email_not_confirmed: "Confirm your email first. Open the link we sent you, then sign in.",
  user_banned: "This account can't sign in right now. Contact an administrator.",
  over_email_send_rate_limit: "Too many emails were sent recently. Wait a few minutes, then try again.",
  over_request_rate_limit: "Too many attempts. Wait a few minutes, then try again.",
  over_sms_send_rate_limit: "Too many attempts. Wait a few minutes, then try again.",
  weak_password: "Choose a stronger password: longer, and not one that's been exposed in a data breach.",
  same_password: "Your new password must be different from your current one.",
  signup_disabled: "New accounts aren't being accepted right now.",
  email_provider_disabled: "Email sign-in isn't turned on for this project.",
  session_expired: "Your session expired. Sign in again.",
  session_not_found: "Your session ended. Sign in again.",
  refresh_token_not_found: "Your session ended. Sign in again.",
  reauthentication_needed: "For your security, sign out and sign back in before changing your password.",
  flow_state_expired: "This link has expired. Request a new one.",
  flow_state_not_found: "This link has expired or was opened in a different browser. Request a new one and open it in this browser.",
  bad_code_verifier: "This link was opened in a different browser. Request a new one and open it in this browser.",
  otp_expired: "This link has expired or was already used. Request a new one.",
  email_address_not_authorized:
    "This site can't email that address yet: its email service is still in test mode. Contact the project team.",
  email_address_invalid: "Enter a valid email address.",
  validation_failed: "Check the highlighted fields and try again.",
  access_denied: "That link didn't work. It may have expired or already been used. Request a new one.",
  wrong_current_password: "Your current password is incorrect.",
  accounts_not_configured: "Accounts aren't open on this site yet.",

  // Database functions
  not_authenticated: "Sign in to continue.",
  profile_missing: "Your account profile wasn't found. Sign out and back in, or contact an administrator.",
  account_not_eligible: "Your account can't make this change while it's suspended or deactivated.",
  rate_limited: "You've done that several times recently. Wait a while, then try again.",
  invalid_display_name: "Use a display name between 2 and 80 characters.",
  role_not_requestable: "That role can't be requested. Choose one of the listed roles.",
  invalid_interests: "Use up to 12 interests, each 40 characters or fewer.",
  invalid_note: "Keep your note under 1,000 characters.",
  policy_version_mismatch: "The Terms or Privacy Policy changed. Reload the page and review them again.",
  invalid_service_unit: "Choose a service unit from the list.",
  troop_required: "Choose the troop you volunteer with.",
  invalid_troop: "That troop isn't part of the service unit you chose.",
  request_pending: "You already have a verification request waiting for review.",
  no_pending_request: "There's no pending request to withdraw.",
  forbidden: "You don't have permission to do that.",
  cannot_change_own_roles: "Administrators can't change their own roles. Ask another administrator.",
  cannot_change_own_state: "You can't change your own account status here.",
  cannot_review_own_request: "Another administrator has to review your own request.",
  request_not_found: "That request wasn't found. Refresh the list.",
  assignment_not_found: "That role assignment wasn't found. Refresh the page.",
  request_not_pending: "This request was already decided. Refresh to see the latest status.",
  reason_required: "Add a short reason. The member will see it.",
  youth_access_disabled: "Youth accounts are turned off until the council approves consent procedures.",
  invalid_scope: "That role doesn't fit the chosen troop or service unit.",
  invalid_profile: "That member account wasn't found.",
  invalid_state: "That account status isn't available.",
  invalid_name: "Enter your name.",
  invalid_email: "Enter a valid email address.",
  invalid_topic: "Choose a topic.",
  invalid_message: "Write a message between 20 and 2,000 characters."
};

const GENERIC = "Something went wrong. Try again, and if it keeps happening, contact the project team.";
const OFFLINE = "Can't reach ScoutLink OC. Check your internet connection and try again.";
const PERMISSION = "You don't have permission to see or change this.";

/** Extracts a known code from an error, if there is one. */
export function errorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const { code, message } = error as { code?: unknown; message?: unknown };
  if (typeof code === "string" && code in MESSAGES) return code;
  if (typeof message === "string" && message in MESSAGES) return message;
  if (code === "42501") return "permission_denied";
  return null;
}

export function friendlyError(error: unknown): string {
  if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) return OFFLINE;
  if (error && typeof error === "object" && (error as { name?: unknown }).name === "AuthRetryableFetchError") return OFFLINE;
  const code = errorCode(error);
  if (code === "permission_denied") return PERMISSION;
  return (code && MESSAGES[code]) ?? GENERIC;
}

/** An error carrying one of the codes above. Used to rethrow Supabase `{ error }` results. */
export class AppError extends Error {
  code: string;
  constructor(code: string, cause?: unknown) {
    super(code, { cause });
    this.name = "AppError";
    this.code = code;
  }
}

/** Throws a Supabase `{ error }` value as-is so friendlyError can read its code. */
export function throwIfError<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}
