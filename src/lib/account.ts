import { z } from "zod";
import type { AccountState, AppRole, VerificationStatus } from "@/types/database";
import { throwIfError } from "./errors";
import { requireSupabase } from "./supabase";

/**
 * The signed-in user's account, as returned by public.get_my_account().
 * Parsed at runtime so a schema drift fails loudly instead of rendering wrong data.
 */

const accountState = z.enum(["pending_verification", "active", "suspended", "deactivated"]);
const appRole = z.enum([
  "platform_admin",
  "council_admin",
  "service_unit_coordinator",
  "troop_leader",
  "adult_volunteer",
  "girl_member",
  "guardian"
]);
const verificationStatus = z.enum(["pending", "approved", "rejected", "withdrawn"]);

const roleSchema = z.object({
  id: z.string(),
  role: appRole,
  scope_type: z.enum(["platform", "council", "service_unit", "troop"]),
  scope_id: z.string().nullable(),
  scope_name: z.string().nullable(),
  granted_at: z.string()
});

const requestSchema = z.object({
  id: z.string(),
  requested_role: appRole,
  service_unit_id: z.string(),
  service_unit_name: z.string(),
  troop_id: z.string().nullable(),
  troop_number: z.string().nullable(),
  note: z.string(),
  status: verificationStatus,
  decision_note: z.string().nullable(),
  created_at: z.string(),
  decided_at: z.string().nullable()
});

export const accountSchema = z.object({
  id: z.string(),
  email: z.string(),
  display_name: z.string(),
  bio: z.string(),
  interests: z.array(z.string()),
  general_location: z.string(),
  account_state: accountState,
  state_reason: z.string().nullable(),
  deletion_requested_at: z.string().nullable(),
  created_at: z.string(),
  policy_version: z.string(),
  has_current_consent: z.boolean(),
  roles: z.array(roleSchema),
  latest_request: requestSchema.nullable()
});

export type Account = z.infer<typeof accountSchema>;
export type RoleAssignment = z.infer<typeof roleSchema>;
export type VerificationRequest = z.infer<typeof requestSchema>;

export const ROLE_LABELS: Record<AppRole, string> = {
  platform_admin: "Platform administrator",
  council_admin: "Council administrator",
  service_unit_coordinator: "Service unit coordinator",
  troop_leader: "Troop leader",
  adult_volunteer: "Adult volunteer",
  girl_member: "Girl Scout member",
  guardian: "Parent or guardian"
};

export const ACCOUNT_STATE_LABELS: Record<AccountState, string> = {
  pending_verification: "Waiting for verification",
  active: "Verified",
  suspended: "Suspended",
  deactivated: "Deactivated"
};

export const REQUEST_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: "Waiting for review",
  approved: "Approved",
  rejected: "Not approved",
  withdrawn: "Withdrawn"
};

/** Roles an adult can ask for during onboarding. Administrator and youth roles are never requestable. */
export const REQUESTABLE_ROLES = [
  { value: "troop_leader", label: "Troop leader", description: "You lead or co-lead a troop.", needsTroop: true },
  { value: "adult_volunteer", label: "Adult volunteer", description: "You help a troop as a registered adult volunteer.", needsTroop: true },
  {
    value: "service_unit_coordinator",
    label: "Service unit coordinator",
    description: "You support the troops across a service unit.",
    needsTroop: false
  }
] as const satisfies readonly { value: AppRole; label: string; description: string; needsTroop: boolean }[];

export type RequestableRole = (typeof REQUESTABLE_ROLES)[number]["value"];

export function isAdmin(account: Pick<Account, "account_state" | "roles"> | null | undefined): boolean {
  return (
    !!account &&
    account.account_state === "active" &&
    account.roles.some((role) => role.role === "platform_admin" || role.role === "council_admin")
  );
}

export function displayNameOf(account: Pick<Account, "display_name" | "email">): string {
  return account.display_name.trim() || account.email.split("@")[0] || "there";
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export async function fetchMyAccount(): Promise<Account> {
  const supabase = await requireSupabase();
  return accountSchema.parse(throwIfError(await supabase.rpc("get_my_account")));
}

export async function fetchAffiliationOptions() {
  const supabase = await requireSupabase();
  return throwIfError(await supabase.rpc("list_affiliation_options")) ?? [];
}

export interface OnboardingInput {
  displayName: string;
  requestedRole: RequestableRole;
  serviceUnitId: string;
  troopId: string | null;
  interests: string[];
  note: string;
  policyVersion: string;
}

export async function submitOnboarding(input: OnboardingInput): Promise<string> {
  const supabase = await requireSupabase();
  const requestId = throwIfError(
    await supabase.rpc("submit_onboarding", {
      p_display_name: input.displayName,
      p_requested_role: input.requestedRole,
      p_service_unit_id: input.serviceUnitId,
      p_troop_id: input.troopId,
      p_interests: input.interests,
      p_note: input.note,
      p_policy_version: input.policyVersion
    })
  );
  if (!requestId) throw new Error("unexpected_empty_response");
  return requestId;
}

export async function withdrawVerificationRequest(): Promise<void> {
  const supabase = await requireSupabase();
  throwIfError(await supabase.rpc("withdraw_my_verification_request"));
}

export interface ProfileInput {
  display_name: string;
  bio: string;
  general_location: string;
  interests: string[];
}

export async function updateMyProfile(id: string, input: ProfileInput): Promise<void> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase.from("profiles").update(input).eq("id", id).select("id");
  if (error) throw error;
  // RLS filters rows silently; zero rows means the account isn't allowed to edit right now.
  if (!data || data.length === 0) throw new Error("account_not_eligible");
}

export async function deactivateMyAccount(reason: string): Promise<void> {
  const supabase = await requireSupabase();
  throwIfError(await supabase.rpc("deactivate_my_account", { p_reason: reason || null }));
}

export async function requestMyAccountDeletion(reason: string): Promise<void> {
  const supabase = await requireSupabase();
  throwIfError(await supabase.rpc("request_my_account_deletion", { p_reason: reason || null }));
}

export async function listVerificationRequests(status: VerificationStatus) {
  const supabase = await requireSupabase();
  return throwIfError(await supabase.rpc("admin_list_verification_requests", { p_status: status })) ?? [];
}

export async function decideVerification(requestId: string, approve: boolean, note: string): Promise<void> {
  const supabase = await requireSupabase();
  throwIfError(
    await supabase.rpc("admin_decide_verification", { p_request_id: requestId, p_approve: approve, p_note: note || null })
  );
}

export async function sendContactMessage(values: { name: string; email: string; topic: string; message: string; website: string }) {
  const supabase = await requireSupabase();
  throwIfError(
    await supabase.rpc("submit_contact_message", {
      p_name: values.name,
      p_email: values.email,
      p_topic: values.topic,
      p_message: values.message,
      p_website: values.website
    })
  );
}

/** Splits a comma-separated list of interests into clean, unique tags. */
export function parseInterests(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of value.split(",")) {
    const tag = raw.trim().replace(/\s+/g, " ");
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }
  return tags;
}
