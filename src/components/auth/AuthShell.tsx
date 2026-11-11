import { LockKeyholeIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/misc";
import { Breadcrumbs } from "@/components/ui/breadcrumb";

interface AuthShellProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Centered card layout shared by the sign-in, sign-up and password pages. */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="container-page grid gap-10 py-10 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16">
      <div className="hidden max-w-md lg:block">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
        <h1 className="mt-6 text-4xl font-extrabold">{title}</h1>
        <div className="mt-4 text-lg leading-relaxed text-muted-foreground">{description}</div>
        <div className="mt-10 rounded-2xl border bg-secondary/60 p-6">
          <h2 className="font-heading text-base font-bold">Accounts are verified by people</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Creating an account doesn't make you a verified volunteer. An administrator confirms every adult's troop or
            service unit role before they can see troop information or contact other leaders.{" "}
            <Link to="/safety" className="font-semibold text-primary underline underline-offset-4">
              How we keep members safe
            </Link>
          </p>
        </div>
      </div>

      <div className="w-full">
        <div className="lg:hidden">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
          <h1 className="mt-4 text-3xl font-extrabold">{title}</h1>
          <div className="mt-3 leading-relaxed text-muted-foreground">{description}</div>
        </div>
        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm sm:p-8 lg:mt-0">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Explains that accounts aren't open on this deployment. Shown until the
 * Supabase project and verification workflow are connected (Milestone 2), so
 * the forms never pretend to sign anyone in.
 */
export function AccountsClosedNotice({ id }: { id?: string }) {
  return (
    <Alert variant="warning" id={id} tabIndex={-1} className="mb-6 outline-none">
      <LockKeyholeIcon aria-hidden="true" />
      <AlertTitle>Accounts aren't open yet</AlertTitle>
      <AlertDescription>
        <p>
          ScoutLink OC is still being built. Sign-in opens once the member database is connected and volunteer
          verification is in place. Nothing you type here is sent anywhere.
        </p>
      </AlertDescription>
    </Alert>
  );
}
