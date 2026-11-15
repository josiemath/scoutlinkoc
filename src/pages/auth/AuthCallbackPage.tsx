import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { AccountsClosedNotice, AuthShell, FormAlert } from "@/components/auth/AuthShell";
import { Skeleton } from "@/components/ui/misc";
import { useAuth } from "@/hooks/use-auth";
import { usePageMeta } from "@/hooks/use-page-meta";
import { completeAuthRedirect } from "@/lib/auth";
import { getPendingAuthRedirect, setPendingAuthRedirect } from "@/lib/auth-redirect";
import { friendlyError } from "@/lib/errors";

/** Finishes sign-in after someone opens a confirmation or password-reset email link. */
export default function AuthCallbackPage() {
  usePageMeta("Signing you in", "Finishing sign-in from your email link.");
  const { status } = useAuth();
  const navigate = useNavigate();
  const [redirect] = useState(getPendingAuthRedirect);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!redirect || status === "unconfigured") return;
    let active = true;
    completeAuthRedirect(redirect).then(
      () => {
        setPendingAuthRedirect(null);
        if (active) navigate(redirect.next, { replace: true });
      },
      (reason: unknown) => {
        setPendingAuthRedirect(null);
        if (active) setError(friendlyError(reason));
      }
    );
    return () => {
      active = false;
    };
  }, [redirect, status, navigate]);

  if (!redirect) return <Navigate to={status === "signed_in" ? "/dashboard" : "/login"} replace />;

  return (
    <AuthShell title="Signing you in" description="One moment while we confirm your email link.">
      {status === "unconfigured" ? (
        <AccountsClosedNotice />
      ) : error ? (
        <>
          <FormAlert id="callback-error" title="That link didn't work">
            {error}
          </FormAlert>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            <Link to="/login" className="text-primary underline underline-offset-4">
              Sign in
            </Link>
            <Link to="/forgot-password" className="text-primary underline underline-offset-4">
              Send a new password reset link
            </Link>
          </div>
        </>
      ) : (
        <div className="grid gap-3" role="status" aria-label="Confirming your link">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      )}
    </AuthShell>
  );
}
