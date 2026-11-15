import type { Session, User } from "@supabase/supabase-js";
import { createContext } from "react";

export type AuthStatus =
  /** This build has no Supabase project, so accounts are closed. */
  | "unconfigured"
  | "loading"
  | "signed_out"
  | "signed_in";

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  /** True after opening a password-reset link, until the new password is saved. */
  isRecovery: boolean;
  /** Signs out this browser (or every device) and clears cached account data. */
  signOut: (scope?: "local" | "global") => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
