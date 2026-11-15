import { zodResolver } from "@hookform/resolvers/zod";
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { FormAlert } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
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
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/misc";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ThemePreference } from "@/contexts/theme-context";
import { useAppAccount } from "@/hooks/use-app-account";
import { useAuth } from "@/hooks/use-auth";
import { useFocusOnChange, type FormError } from "@/hooks/use-focus-on-change";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useTheme } from "@/hooks/use-theme";
import { deactivateMyAccount, requestMyAccountDeletion } from "@/lib/account";
import { changePassword } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validation";

export default function SettingsPage() {
  usePageMeta("Settings");
  const account = useAppAccount();
  const canDeactivate = account.account_state === "pending_verification" || account.account_state === "active";

  return (
    <div className="grid max-w-2xl gap-6">
      <AppPageHeader title="Settings" description="Appearance, password, sign-in sessions and your account." />
      <AppearanceCard />
      <PasswordCard email={account.email} />
      <SessionsCard />
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Leave ScoutLink OC</CardTitle>
          <CardDescription>Deactivating hides your account. Deleting removes your information.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {canDeactivate && (
            <AccountActionDialog
              trigger="Deactivate account"
              title="Deactivate your account?"
              description="You'll be signed out and your profile hidden from other members. To come back later, contact the project team."
              confirmLabel="Deactivate account"
              doneMessage="Your account is deactivated."
              action={deactivateMyAccount}
            />
          )}
          {!account.deletion_requested_at && (
            <AccountActionDialog
              trigger="Request account deletion"
              title="Ask to delete your account?"
              description="You'll be signed out and your account deactivated now. An administrator then deletes your account and profile. The security log keeps a record that past approvals happened, without your profile details."
              confirmLabel="Request deletion"
              doneMessage="Deletion requested. You've been signed out."
              requireWord="delete"
              action={requestMyAccountDeletion}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const THEMES: { value: ThemePreference; label: string; Icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "Match device", Icon: LaptopIcon }
];

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  return (
    <Card>
      <CardHeader>
        <CardTitle id="theme-heading">Appearance</CardTitle>
        <CardDescription>Saved in this browser.</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          aria-labelledby="theme-heading"
          value={theme}
          onValueChange={(value) => setTheme(value as ThemePreference)}
          className="grid-cols-1 sm:grid-cols-3"
        >
          {THEMES.map(({ value, label, Icon }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary/50"
            >
              <RadioGroupItem value={value} />
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-semibold">{label}</span>
            </label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

const PASSWORD_ERROR_ID = "password-error";

function PasswordCard({ email }: { email: string }) {
  const [formError, setFormError] = useState<FormError | null>(null);
  useFocusOnChange(PASSWORD_ERROR_ID, formError);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" }
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    setFormError(null);
    try {
      await changePassword(email, values.currentPassword, values.password);
      form.reset();
      toast.success("Password changed.");
    } catch (error) {
      setFormError({ text: friendlyError(error) });
    }
  };

  const submitting = form.formState.isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Use at least 12 characters. A short phrase is easier to remember.</CardDescription>
      </CardHeader>
      <CardContent>
        {formError && (
          <FormAlert id={PASSWORD_ERROR_ID} title="Couldn't change your password">
            {formError.text}
          </FormAlert>
        )}
        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
            {/* Lets password managers pair the new password with the right account. */}
            <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormDescription>Other devices stay signed in. Sign them out below if you need to.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-fit" disabled={submitting}>
              {submitting ? "Changing password…" : "Change password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SessionsCard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const signOutEverywhere = async () => {
    setBusy(true);
    try {
      await navigate("/login", { replace: true, flushSync: true });
      await signOut("global");
      toast.success("Signed out on every device.");
    } catch (error) {
      toast.error(friendlyError(error));
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signed-in devices</CardTitle>
        <CardDescription>If you used a shared computer or lost a phone, sign out everywhere.</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Sign out of all devices</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out of all devices?</AlertDialogTitle>
              <AlertDialogDescription>
                Every browser and phone signed in to your account, including this one, will need to sign in again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button disabled={busy} onClick={() => void signOutEverywhere()}>
                {busy ? "Signing out…" : "Sign out everywhere"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

interface AccountActionDialogProps {
  trigger: string;
  title: string;
  description: string;
  confirmLabel: string;
  doneMessage: string;
  /** When set, the person must type this word to confirm. */
  requireWord?: string;
  action: (reason: string) => Promise<void>;
}

function AccountActionDialog({ trigger, title, description, confirmLabel, doneMessage, requireWord, action }: AccountActionDialogProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const reasonId = useId();
  const wordId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = !requireWord || word.trim().toLowerCase() === requireWord;

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await action(reason.trim().slice(0, 500));
    } catch (failure) {
      setError(friendlyError(failure));
      setBusy(false);
      return;
    }
    // Leave the signed-in area before the session ends (see UserMenu in AppLayout).
    await navigate("/", { replace: true, flushSync: true });
    await signOut().catch(() => undefined);
    toast.success(doneMessage);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setReason("");
          setWord("");
          setError(null);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
          {trigger}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <div className="grid gap-2">
          <Label htmlFor={reasonId}>Reason (optional)</Label>
          <Textarea id={reasonId} rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
        </div>
        {requireWord && (
          <div className="grid gap-2">
            <Label htmlFor={wordId}>Type “{requireWord}” to confirm</Label>
            <Input id={wordId} autoComplete="off" value={word} onChange={(event) => setWord(event.target.value)} />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={busy || !confirmed} onClick={() => void run()}>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
