import { CheckIcon, ClipboardCheckIcon, ShieldOffIcon, UserRoundXIcon } from "lucide-react";
import { Link } from "react-router";
import { AppPageHeader } from "@/components/layout/AppPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/misc";
import { useAppAccount } from "@/hooks/use-app-account";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ACCOUNT_STATE_LABELS, displayNameOf, isAdmin, ROLE_LABELS, type Account } from "@/lib/account";
import { formatInZone } from "@/lib/date";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  usePageMeta("Dashboard");
  const account = useAppAccount();

  return (
    <div className="grid max-w-4xl gap-8">
      <AppPageHeader
        title={`Hi, ${displayNameOf(account)}`}
        description="Your account status and verified roles."
        actions={<Badge variant={account.account_state === "active" ? "default" : "warning"}>{ACCOUNT_STATE_LABELS[account.account_state]}</Badge>}
      />
      <StatusPanel account={account} />
      {account.roles.length > 0 && <RolesCard account={account} />}
      {isAdmin(account) && (
        <Card>
          <CardHeader>
            <CardTitle>Verification requests</CardTitle>
            <CardDescription>Volunteers waiting for an administrator to confirm their role.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/admin/verifications">
                <ClipboardCheckIcon aria-hidden="true" />
                Review requests
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusPanel({ account }: { account: Account }) {
  const request = account.latest_request;

  if (account.account_state === "suspended") {
    return (
      <Alert variant="destructive">
        <ShieldOffIcon aria-hidden="true" />
        <AlertTitle>Your account is suspended</AlertTitle>
        <AlertDescription>
          <p>While it's suspended you can't see troop or member information.</p>
          {account.state_reason && <p>Reason given: {account.state_reason}</p>}
          <p>
            To ask about this,{" "}
            <Link to="/contact" className="font-semibold underline underline-offset-4">
              contact the project team
            </Link>
            .
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (account.account_state === "deactivated") {
    return (
      <Alert variant="info">
        <UserRoundXIcon aria-hidden="true" />
        <AlertTitle>Your account is deactivated</AlertTitle>
        <AlertDescription>
          {account.deletion_requested_at ? (
            <p>
              You asked for your account to be deleted on {formatInZone(account.deletion_requested_at)}. An administrator
              reviews deletion requests and removes your information.
            </p>
          ) : (
            <p>Your information is kept but hidden. To use ScoutLink OC again, contact the project team.</p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (account.account_state === "active") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You're verified</CardTitle>
          <CardDescription>
            An administrator confirmed your role. Troop directory, events and projects open to verified volunteers as
            they're released.
          </CardDescription>
        </CardHeader>
        {request?.status === "pending" && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your request to be a {ROLE_LABELS[request.requested_role].toLowerCase()} is waiting for review.
            </p>
          </CardContent>
        )}
      </Card>
    );
  }

  // Pending verification
  const steps = [
    { label: "Create your account", done: true },
    { label: "Ask to be verified for your role", done: request?.status === "pending" },
    { label: "An administrator confirms your role", done: false },
    { label: "Use ScoutLink OC as a verified volunteer", done: false }
  ];
  const current = steps.findIndex((step) => !step.done);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{request?.status === "pending" ? "Your request is waiting for review" : "Next: ask to be verified"}</CardTitle>
        <CardDescription>
          {request?.status === "pending"
            ? "A council administrator checks every request against volunteer records before approving it."
            : "Tell us which troop or service unit you volunteer with. An administrator confirms it before you can see any troop information."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <ol className="grid gap-3">
          {steps.map((step, index) => (
            <li key={step.label} className="flex items-center gap-3" aria-current={index === current ? "step" : undefined}>
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold",
                  step.done && "border-primary bg-primary text-primary-foreground",
                  index === current && "border-primary text-primary"
                )}
                aria-hidden="true"
              >
                {step.done ? <CheckIcon className="size-4" /> : index + 1}
              </span>
              <span className={cn("text-sm", step.done ? "text-muted-foreground" : index === current ? "font-semibold" : "text-muted-foreground")}>
                {step.label}
                <span className="sr-only">{step.done ? " (done)" : index === current ? " (current step)" : ""}</span>
              </span>
            </li>
          ))}
        </ol>

        {request?.status === "rejected" && (
          <Alert variant="warning">
            <AlertTitle>Your last request wasn't approved</AlertTitle>
            <AlertDescription>
              {request.decision_note && <p>Administrator's note: {request.decision_note}</p>}
              <p>You can correct the details and ask again.</p>
            </AlertDescription>
          </Alert>
        )}

        {request?.status === "pending" ? (
          <dl className="grid gap-x-6 gap-y-3 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-semibold">{ROLE_LABELS[request.requested_role]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{request.troop_number ? "Troop" : "Service unit"}</dt>
              <dd className="font-semibold">
                {request.troop_number ? `Troop ${request.troop_number}, ${request.service_unit_name}` : request.service_unit_name}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sent</dt>
              <dd className="font-semibold">{formatInZone(request.created_at)}</dd>
            </div>
          </dl>
        ) : (
          <Button asChild className="w-fit">
            <Link to="/onboarding">Ask to be verified</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function RolesCard({ account }: { account: Account }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your roles</CardTitle>
        <CardDescription>Roles are granted by administrators after verification.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {account.roles.map((role) => (
            <li key={role.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0">
              <span className="font-semibold">{ROLE_LABELS[role.role]}</span>
              <span className="text-sm text-muted-foreground">
                {role.scope_name ?? "Council"}, since {formatInZone(role.granted_at, "MMM d, yyyy")}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
