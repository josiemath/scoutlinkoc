import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClockIcon, MapPinOffIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { FormAlert } from "@/components/auth/AuthShell";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle, Checkbox, Skeleton } from "@/components/ui/misc";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { queryKeys } from "@/hooks/use-account";
import { useAppAccount } from "@/hooks/use-app-account";
import { useFocusOnChange, type FormError } from "@/hooks/use-focus-on-change";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  fetchAffiliationOptions,
  parseInterests,
  REQUESTABLE_ROLES,
  ROLE_LABELS,
  submitOnboarding,
  withdrawVerificationRequest,
  type Account
} from "@/lib/account";
import { formatInZone } from "@/lib/date";
import { friendlyError } from "@/lib/errors";
import { onboardingSchema, ROLES_NEEDING_TROOP, type OnboardingValues } from "@/lib/validation";

const ERROR_ID = "onboarding-error";

export default function OnboardingPage() {
  usePageMeta("Verification");
  const account = useAppAccount();
  const pending = account.latest_request?.status === "pending" ? account.latest_request : null;

  return (
    <div className="max-w-3xl">
      <AppPageHeader
        title={pending ? "Your verification request" : "Ask to be verified"}
        description={
          pending
            ? "An administrator will compare your request with council volunteer records."
            : "Tell us how you volunteer. An administrator checks it against council records before your account can see troop information."
        }
      />
      {pending ? <PendingRequest request={pending} /> : <OnboardingForm account={account} />}
    </div>
  );
}

function PendingRequest({ request }: { request: NonNullable<Account["latest_request"]> }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const withdraw = useMutation({
    mutationFn: withdrawVerificationRequest,
    onSuccess: async () => {
      setOpen(false);
      toast.success("Request withdrawn.");
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => toast.error(friendlyError(error))
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockIcon className="size-5 text-primary" aria-hidden="true" />
          Waiting for review
        </CardTitle>
        <CardDescription>Sent {formatInZone(request.created_at, "MMMM d, yyyy 'at' h:mm a")} (Pacific time)</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-semibold">{ROLE_LABELS[request.requested_role]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Service unit</dt>
            <dd className="font-semibold">{request.service_unit_name}</dd>
          </div>
          {request.troop_number && (
            <div>
              <dt className="text-muted-foreground">Troop</dt>
              <dd className="font-semibold">Troop {request.troop_number}</dd>
            </div>
          )}
          {request.note && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Your note</dt>
              <dd className="whitespace-pre-line">{request.note}</dd>
            </div>
          )}
        </dl>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-fit">
              Withdraw request
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Withdraw this request?</AlertDialogTitle>
              <AlertDialogDescription>
                Administrators won't review it. You can send a corrected request afterwards.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep request</AlertDialogCancel>
              <Button variant="destructive" disabled={withdraw.isPending} onClick={() => withdraw.mutate()}>
                {withdraw.isPending ? "Withdrawing…" : "Withdraw request"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function OnboardingForm({ account }: { account: Account }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<FormError | null>(null);
  useFocusOnChange(ERROR_ID, formError);
  const options = useQuery({ queryKey: queryKeys.affiliationOptions, queryFn: fetchAffiliationOptions });
  const previous = account.latest_request;

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onTouched",
    defaultValues: {
      displayName: account.display_name,
      requestedRole: undefined,
      serviceUnitId: previous?.service_unit_id ?? "",
      troopId: previous?.troop_id ?? "",
      interests: account.interests.join(", "),
      note: "",
      acceptsPolicies: account.has_current_consent
    }
  });

  const serviceUnitId = useWatch({ control: form.control, name: "serviceUnitId" });
  const requestedRole = useWatch({ control: form.control, name: "requestedRole" });
  const needsTroop = requestedRole ? ROLES_NEEDING_TROOP.includes(requestedRole) : true;

  const serviceUnits = useMemo(() => {
    const units = new Map<string, { id: string; name: string; troops: { id: string; number: string }[] }>();
    for (const row of options.data ?? []) {
      const unit = units.get(row.service_unit_id) ?? { id: row.service_unit_id, name: row.service_unit_name, troops: [] };
      if (row.troop_id && row.troop_number) unit.troops.push({ id: row.troop_id, number: row.troop_number });
      units.set(unit.id, unit);
    }
    return [...units.values()];
  }, [options.data]);
  const troops = serviceUnits.find((unit) => unit.id === serviceUnitId)?.troops ?? [];

  const onSubmit = async (values: OnboardingValues) => {
    setFormError(null);
    try {
      await submitOnboarding({
        displayName: values.displayName.trim(),
        requestedRole: values.requestedRole,
        serviceUnitId: values.serviceUnitId,
        troopId: ROLES_NEEDING_TROOP.includes(values.requestedRole) && values.troopId ? values.troopId : null,
        interests: parseInterests(values.interests),
        note: values.note.trim(),
        policyVersion: account.policy_version
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Verification requested. An administrator will review it.");
      navigate("/dashboard");
    } catch (error) {
      setFormError({ text: friendlyError(error) });
    }
  };

  if (options.isPending) {
    return (
      <div role="status" aria-label="Loading service units" className="grid gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  if (options.isError) {
    return (
      <FormAlert id={ERROR_ID} title="Couldn't load service units">
        {friendlyError(options.error)}
      </FormAlert>
    );
  }

  if (serviceUnits.length === 0) {
    return (
      <Alert variant="info">
        <MapPinOffIcon aria-hidden="true" />
        <AlertTitle>No service units are set up yet</AlertTitle>
        <AlertDescription>
          <p>
            An administrator needs to add service units and troops before volunteers can ask to be verified. Check back
            later, or{" "}
            <Link to="/contact" className="font-semibold underline underline-offset-4">
              contact the project team
            </Link>
            .
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  const submitting = form.formState.isSubmitting;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
      {formError && (
        <FormAlert id={ERROR_ID} title="Couldn't send your request">
          {formError.text}
        </FormAlert>
      )}
      <Form {...form}>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormDescription>Shown to verified volunteers. Use the name people in your troop know you by.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requestedRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel id="onboarding-role-label">Role to verify</FormLabel>
                <FormControl>
                  <RadioGroup aria-labelledby="onboarding-role-label" value={field.value ?? ""} onValueChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref}>
                    {REQUESTABLE_ROLES.map((role) => (
                      <label
                        key={role.value}
                        htmlFor={`onboarding-role-${role.value}`}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary/50"
                      >
                        <RadioGroupItem id={`onboarding-role-${role.value}`} value={role.value} className="mt-0.5" />
                        <span className="grid gap-0.5">
                          <span className="text-sm font-semibold">{role.label}</span>
                          <span className="text-sm text-muted-foreground">{role.description}</span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription>Administrator and youth roles can't be requested here.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="serviceUnitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service unit</FormLabel>
                  <FormControl>
                    <NativeSelect
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        form.setValue("troopId", "");
                      }}
                    >
                      <option value="">Choose a service unit</option>
                      {serviceUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {needsTroop && (
              <FormField
                control={form.control}
                name="troopId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Troop</FormLabel>
                    <FormControl>
                      <NativeSelect {...field} disabled={!serviceUnitId}>
                        <option value="">{serviceUnitId ? "Choose a troop" : "Choose a service unit first"}</option>
                        {troops.map((troop) => (
                          <option key={troop.id} value={troop.id}>
                            Troop {troop.number}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    {serviceUnitId && troops.length === 0 && (
                      <FormDescription>This service unit has no troops listed yet.</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="interests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interests (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Outdoor skills, STEM, community service" {...field} />
                </FormControl>
                <FormDescription>Separate with commas. Up to 12. Helps leaders find collaborators later.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note for the administrator (optional)</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
                <FormDescription>
                  Anything that helps confirm your role, like how long you've led the troop. Don't include girls' names
                  or contact details.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptsPolicies"
            render={({ field }) => (
              <FormItem className="flex flex-wrap items-start gap-x-3 gap-y-1">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                </FormControl>
                <div className="grid flex-1 gap-1">
                  <FormLabel className="leading-snug font-medium">I agree to the current Terms of use and Privacy policy</FormLabel>
                  <FormDescription>
                    Version {account.policy_version}.{" "}
                    <Link to="/terms" className="font-semibold text-primary underline underline-offset-4">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy-policy" className="font-semibold text-primary underline underline-offset-4">
                      privacy policy
                    </Link>{" "}
                    are drafts until the council reviews them.
                  </FormDescription>
                </div>
                <FormMessage className="basis-full" />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={submitting}>
            {submitting ? "Sending request…" : "Send verification request"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
