import { zodResolver } from "@hookform/resolvers/zod";
import { LinkIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { AccountsClosedNotice, AuthShell, FormAlert } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle, Skeleton } from "@/components/ui/misc";
import { useAuth } from "@/hooks/use-auth";
import { useFocusOnChange, type FormError } from "@/hooks/use-focus-on-change";
import { usePageMeta } from "@/hooks/use-page-meta";
import { setPassword } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validation";

const ERROR_ID = "reset-error";

export default function ResetPasswordPage() {
  usePageMeta("Choose a new password", "Set a new password for your ScoutLink OC account.");
  const { status, isRecovery } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<FormError | null>(null);
  useFocusOnChange(ERROR_ID, formError);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" }
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    setFormError(null);
    try {
      await setPassword(values.password);
      toast.success("Password saved. You're signed in.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setFormError({ text: friendlyError(error) });
    }
  };

  const submitting = form.formState.isSubmitting;

  return (
    <AuthShell
      title="Choose a new password"
      description="Open this page from the link in your password reset email, then choose a new password."
      footer={
        <Link to="/forgot-password" className="font-semibold text-primary underline underline-offset-4">
          Need a new reset link?
        </Link>
      }
    >
      {status === "unconfigured" && <AccountsClosedNotice />}
      {status === "loading" && (
        <div className="grid gap-4" aria-busy="true" aria-label="Checking your reset link">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      )}
      {status === "signed_out" && (
        <Alert variant="info">
          <LinkIcon aria-hidden="true" />
          <AlertTitle>Open the link from your email</AlertTitle>
          <AlertDescription>
            <p>
              To choose a new password, open the reset link we emailed you, in this browser. Links work once and expire
              after an hour.
            </p>
            <p>
              <Link to="/forgot-password" className="font-semibold underline underline-offset-4">
                Send a new reset link
              </Link>
            </p>
          </AlertDescription>
        </Alert>
      )}
      {status === "signed_in" && !isRecovery && (
        <Alert variant="info">
          <LinkIcon aria-hidden="true" />
          <AlertTitle>You're already signed in</AlertTitle>
          <AlertDescription>
            <p>
              To change your password, go to{" "}
              <Link to="/settings" className="font-semibold underline underline-offset-4">
                Settings
              </Link>{" "}
              and enter your current password. Forgot it? Sign out, then send yourself a reset link.
            </p>
          </AlertDescription>
        </Alert>
      )}
      {status === "signed_in" && isRecovery && (
        <>
          {formError && (
            <FormAlert id={ERROR_ID} title="Couldn't save your password">
              {formError.text}
            </FormAlert>
          )}
          <Form {...form}>
            <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormDescription>At least 12 characters.</FormDescription>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Saving…" : "Save new password"}
              </Button>
            </form>
          </Form>
        </>
      )}
    </AuthShell>
  );
}
