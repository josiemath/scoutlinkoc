/**
 * Database types for the parts of the schema the browser may touch.
 *
 * Written to match supabase/migrations. Object shapes are `type` aliases, not
 * interfaces, because supabase-js needs them to be assignable to Record<string, unknown>. When the Supabase CLI is available,
 * `npx supabase gen types typescript --local > src/types/database.ts`
 * produces the same shape for the full schema. Tables the browser can't
 * read (audit logs, guardian records, contact messages) are left out on purpose.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AccountState = "pending_verification" | "active" | "suspended" | "deactivated";
export type AppRole =
  | "platform_admin"
  | "council_admin"
  | "service_unit_coordinator"
  | "troop_leader"
  | "adult_volunteer"
  | "girl_member"
  | "guardian";
export type RoleScope = "platform" | "council" | "service_unit" | "troop";
export type VerificationStatus = "pending" | "approved" | "rejected" | "withdrawn";
export type OcRegion = "north" | "central" | "south" | "coastal" | "west";

type ProfileRow = {
  id: string;
  display_name: string;
  bio: string;
  interests: string[];
  general_location: string;
  account_state: AccountState;
  state_reason: string | null;
  deletion_requested_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VerificationRequestRow = {
  id: string;
  profile_id: string;
  display_name: string;
  email: string;
  requested_role: AppRole;
  service_unit_id: string;
  service_unit_name: string;
  troop_id: string | null;
  troop_number: string | null;
  note: string;
  status: VerificationStatus;
  decision_note: string | null;
  created_at: string;
  decided_at: string | null;
};

export type AffiliationOptionRow = {
  service_unit_id: string;
  service_unit_name: string;
  region: OcRegion;
  troop_id: string | null;
  troop_number: string | null;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: never;
        Update: Partial<Pick<ProfileRow, "display_name" | "bio" | "interests" | "general_location">>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_my_account: { Args: never; Returns: Json };
      list_affiliation_options: { Args: never; Returns: AffiliationOptionRow[] };
      submit_onboarding: {
        Args: {
          p_display_name: string;
          p_requested_role: AppRole;
          p_service_unit_id: string;
          p_troop_id: string | null;
          p_interests: string[];
          p_note: string;
          p_policy_version: string;
        };
        Returns: string;
      };
      withdraw_my_verification_request: { Args: never; Returns: undefined };
      deactivate_my_account: { Args: { p_reason?: string | null }; Returns: undefined };
      request_my_account_deletion: { Args: { p_reason?: string | null }; Returns: undefined };
      admin_list_verification_requests: { Args: { p_status?: VerificationStatus }; Returns: VerificationRequestRow[] };
      admin_decide_verification: {
        Args: { p_request_id: string; p_approve: boolean; p_note?: string | null };
        Returns: undefined;
      };
      submit_contact_message: {
        Args: { p_name: string; p_email: string; p_topic: string; p_message: string; p_website?: string };
        Returns: undefined;
      };
    };
    Enums: {
      account_state: AccountState;
      app_role: AppRole;
      role_scope: RoleScope;
      verification_status: VerificationStatus;
      oc_region: OcRegion;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
