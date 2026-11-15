import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { signOut as signOutRequest } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { AuthContext, type AuthContextValue, type AuthStatus } from "./auth-context";

/**
 * Tracks the Supabase session. The session only says who someone is; what
 * they may see is decided by their verified roles in the database (RLS).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? "loading" : "unconfigured");
  const [session, setSession] = useState<Session | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);
  const intentionalSignOut = useRef(false);
  const currentUserId = useRef<string | null>(null);
  const previousStatus = useRef<AuthStatus>(status);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const applySession = (next: Session | null) => {
      const nextUserId = next?.user.id ?? null;
      // A different person (or nobody) is now signed in: drop everything cached for the last one,
      // before anything renders with the new session.
      if (currentUserId.current !== null && currentUserId.current !== nextUserId) {
        queryClient.removeQueries({ queryKey: ["me"] });
        queryClient.removeQueries({ queryKey: ["admin"] });
      }
      currentUserId.current = nextUserId;
      setSession(next);
      setStatus(next ? "signed_in" : "signed_out");
    };

    void getSupabase().then(async (supabase) => {
      if (!supabase || cancelled) return;
      const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
        // Keep this callback synchronous: Supabase holds a lock while it runs.
        if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
        if (event === "SIGNED_OUT") setIsRecovery(false);
        applySession(nextSession);
      });
      unsubscribe = () => data.subscription.unsubscribe();

      const { data: current } = await supabase.auth.getSession();
      if (cancelled) return;
      applySession(current.session);
    }).catch(() => {
      // The client couldn't load (offline, blocked script). Treat as signed out; sign-in will show the error.
      if (!cancelled) setStatus("signed_out");
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [queryClient]);

  // Tell people when a session ends without them signing out (expired or revoked elsewhere).
  useEffect(() => {
    if (previousStatus.current === "signed_in" && status === "signed_out") {
      if (!intentionalSignOut.current) toast.info("Your session ended. Sign in again to continue.");
      intentionalSignOut.current = false;
    }
    previousStatus.current = status;
  }, [status]);

  const signOut = useCallback(
    async (scope: "local" | "global" = "local") => {
      intentionalSignOut.current = true;
      try {
        await signOutRequest(scope);
      } finally {
        queryClient.clear();
      }
    },
    [queryClient]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, user: session?.user ?? null, isRecovery, signOut }),
    [status, session, isRecovery, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
