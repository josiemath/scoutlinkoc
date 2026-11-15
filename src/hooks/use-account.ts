import { useQuery } from "@tanstack/react-query";
import { fetchMyAccount } from "@/lib/account";
import { useAuth } from "./use-auth";

/** Query keys. Everything under "me" or "admin" is cleared when the signed-in user changes. */
export const queryKeys = {
  account: (userId: string | null) => ["me", userId, "account"] as const,
  affiliationOptions: ["me", "affiliation-options"] as const,
  verificationQueue: (status: string) => ["admin", "verification-requests", status] as const
};

/** The signed-in user's account, roles and verification status. */
export function useAccount() {
  const { user, status } = useAuth();
  return useQuery({
    queryKey: queryKeys.account(user?.id ?? null),
    queryFn: fetchMyAccount,
    enabled: status === "signed_in" && !!user,
    staleTime: 30_000
  });
}
