import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, InboxIcon, RefreshCwIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { AppPageHeader } from "@/components/layout/AppPageHeader";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle, Label, Skeleton } from "@/components/ui/misc";
import { queryKeys } from "@/hooks/use-account";
import { useAppAccount } from "@/hooks/use-app-account";
import { usePageMeta } from "@/hooks/use-page-meta";
import { decideVerification, listVerificationRequests, REQUEST_STATUS_LABELS, ROLE_LABELS } from "@/lib/account";
import { formatInZone } from "@/lib/date";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { VerificationRequestRow, VerificationStatus } from "@/types/database";

const STATUSES: VerificationStatus[] = ["pending", "approved", "rejected", "withdrawn"];

export default function AdminVerificationsPage() {
  usePageMeta("Verification requests");
  const [params] = useSearchParams();
  const requested = params.get("status");
  const status: VerificationStatus = STATUSES.includes(requested as VerificationStatus) ? (requested as VerificationStatus) : "pending";
  const query = useQuery({
    queryKey: queryKeys.verificationQueue(status),
    queryFn: () => listVerificationRequests(status)
  });

  return (
    <div className="max-w-4xl">
      <AppPageHeader
        title="Verification requests"
        description="Check each request against council volunteer records before approving. Approving grants exactly the role and troop shown."
        actions={
          <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
            <RefreshCwIcon aria-hidden="true" className={cn(query.isFetching && "motion-safe:animate-spin")} />
            Refresh
          </Button>
        }
      />

      <nav aria-label="Filter by status" className="mb-6">
        <ul className="flex flex-wrap gap-2">
          {STATUSES.map((value) => (
            <li key={value}>
              <Link
                to={value === "pending" ? "/admin/verifications" : `/admin/verifications?status=${value}`}
                aria-current={value === status ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors hover:bg-accent",
                  value === status ? "border-primary bg-secondary text-secondary-foreground" : "text-muted-foreground"
                )}
              >
                {REQUEST_STATUS_LABELS[value]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {query.isPending ? (
        <div role="status" aria-label="Loading requests" className="grid gap-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load requests</AlertTitle>
          <AlertDescription>
            <p>{friendlyError(query.error)}</p>
          </AlertDescription>
        </Alert>
      ) : query.data.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed p-10 text-center">
          <InboxIcon className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold">{status === "pending" ? "No requests are waiting" : `No ${REQUEST_STATUS_LABELS[status].toLowerCase()} requests`}</p>
          <p className="text-sm text-muted-foreground">New requests appear here as volunteers send them.</p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {query.data.map((request) => (
            <li key={request.id}>
              <RequestCard request={request} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestCard({ request }: { request: VerificationRequestRow }) {
  const me = useAppAccount();
  const own = request.profile_id === me.id;
  const headingId = useId();

  return (
    <article aria-labelledby={headingId} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="font-heading text-lg font-bold">
            {request.display_name || "(no display name)"}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{request.email}</p>
        </div>
        <Badge variant={request.status === "pending" ? "warning" : "outline"}>{REQUEST_STATUS_LABELS[request.status]}</Badge>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Role</dt>
          <dd className="font-semibold">{ROLE_LABELS[request.requested_role]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Service unit</dt>
          <dd className="font-semibold">{request.service_unit_name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Troop</dt>
          <dd className="font-semibold">{request.troop_number ? `Troop ${request.troop_number}` : "None"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sent</dt>
          <dd>{formatInZone(request.created_at, "MMM d, yyyy, h:mm a")}</dd>
        </div>
        {request.decided_at && (
          <div>
            <dt className="text-muted-foreground">Decided</dt>
            <dd>{formatInZone(request.decided_at, "MMM d, yyyy, h:mm a")}</dd>
          </div>
        )}
        {request.note && (
          <div className="sm:col-span-3">
            <dt className="text-muted-foreground">Volunteer's note</dt>
            <dd className="whitespace-pre-line">{request.note}</dd>
          </div>
        )}
        {request.decision_note && (
          <div className="sm:col-span-3">
            <dt className="text-muted-foreground">Decision note</dt>
            <dd className="whitespace-pre-line">{request.decision_note}</dd>
          </div>
        )}
      </dl>

      {request.status === "pending" &&
        (own ? (
          <p className="mt-5 text-sm text-muted-foreground">This is your own request. Another administrator has to review it.</p>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2">
            <DecisionDialog request={request} approve />
            <DecisionDialog request={request} approve={false} />
          </div>
        ))}
    </article>
  );
}

function DecisionDialog({ request, approve }: { request: VerificationRequestRow; approve: boolean }) {
  const queryClient = useQueryClient();
  const noteId = useId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const trimmed = note.trim();
  const decide = useMutation({
    mutationFn: () => decideVerification(request.id, approve, trimmed),
    onSuccess: async () => {
      setOpen(false);
      setNote("");
      toast.success(approve ? `${request.display_name || request.email} is verified.` : "Request declined.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });
  const name = request.display_name || request.email;
  const place = request.troop_number ? `Troop ${request.troop_number} in ${request.service_unit_name}` : request.service_unit_name;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) decide.reset();
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant={approve ? "default" : "outline"}>
          {approve ? <CheckIcon aria-hidden="true" /> : <XIcon aria-hidden="true" />}
          {approve ? "Approve" : "Decline"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{approve ? `Approve ${name}?` : `Decline ${name}'s request?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {approve
              ? `This makes ${name} a verified ${ROLE_LABELS[request.requested_role].toLowerCase()} for ${place}. Only approve after checking council volunteer records.`
              : "The volunteer will see your note on their dashboard and can send a corrected request."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {decide.isError && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {friendlyError(decide.error)}
          </p>
        )}
        <div className="grid gap-2">
          <Label htmlFor={noteId}>{approve ? "Note (optional)" : "Reason the volunteer will see"}</Label>
          <Textarea id={noteId} rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
          {approve && <p className="text-sm text-muted-foreground">For example, which record you checked. Saved with the request.</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant={approve ? "default" : "destructive"}
            disabled={decide.isPending || (!approve && trimmed.length === 0)}
            onClick={() => decide.mutate()}
          >
            {decide.isPending ? "Saving…" : approve ? "Approve" : "Decline request"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
