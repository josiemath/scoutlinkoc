import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { config } from "./env";

export type AppSupabaseClient = SupabaseClient<Database>;

/** Where Supabase Auth keeps the session in this browser. */
export const AUTH_STORAGE_KEY = "scoutlink-auth";

let clientPromise: Promise<AppSupabaseClient> | null = null;

/** True when this build was configured with a Supabase project. */
export const isSupabaseConfigured = config.supabase !== null;

/**
 * Loads the Supabase client on first use, so public pages don't download it
 * until it's needed. Resolves to null when this build has no Supabase project.
 *
 * Uses the publishable key only. Row Level Security in the database decides
 * what each signed-in user can read or change.
 */
export function getSupabase(): Promise<AppSupabaseClient | null> {
  const supabaseConfig = config.supabase;
  if (!supabaseConfig) return Promise.resolve(null);
  clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient<Database>(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        flowType: "pkce",
        // The app reads ?code= itself (see auth-redirect.ts) because HashRouter owns the URL hash.
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: AUTH_STORAGE_KEY
      }
    })
  );
  return clientPromise;
}

/** Like getSupabase, but throws when accounts aren't configured. For code that only runs signed in. */
export async function requireSupabase(): Promise<AppSupabaseClient> {
  const client = await getSupabase();
  if (!client) throw new Error("accounts_not_configured");
  return client;
}
