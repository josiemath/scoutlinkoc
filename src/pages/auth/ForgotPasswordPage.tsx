import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { AccountsClosedNotice, AuthShell, FormAlert } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useFocusOnChange, type FormError } from "@/hooks/use-focus-on-change";
import { usePageMeta } from "@/hooks/use-page-meta";
import { sendPasswordReset } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { focusById } from "@/lib/focus";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validation";

const NOTICE_ID = "forgot-closed-notice";
const ERROR_ID = "forgot-error";
const SENT_ID = "forgot-sent";

export default function ForgotPasswordPage() {
  usePageMeta("Forgot password", "Get a link to reset your ScoutLink OC password.");
  const { status } = useAuth();
  const [formError, setFormError] = useState<FormError | null>(null);
  useFocusOnChange(ERROR_ID, formError);
  const [sentTo, setSentTo] = useState<string | null>(null);
  useFocusOnChange(SENT_ID, sentTo);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: "" }
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    if (status === "unconfigured") return focusById(NOTICE_ID);
    setFormError(null);
    try {
      await sendPasswordReset(values.email);
      setSentTo(values.email.trim());
    } catch (error) {
      setFormError({ text: friendlyError(error) });
    }
  };

  const submitting = form.formState.isSubmitting;

  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter the email you use for ScoutLink OC and we'll send a link to choose a new password."
      footer={
        <Link to="/login" className="font-semibold text-primary underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      {sentTo ? (
        <div id={SENT_ID} tabIndex={-1} role="status" className="grid gap-4 outline-none">
          <MailCheckIcon className="size-10 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-xl font-bold">Check your email</h2>
          <p className="leading-relaxed text-muted-foreground">
            If there's an account for <strong className="text-foreground">{sentTo}</strong>, we've sent it a link to
            choose a new password. Open it in this browser. The link works once and expires after an hour.
          </p>
          <Button variant="outline" className="w-fit" onClick={() => setSentTo(null)}>
            Send to a different email
          </Button>
        </div>
      ) : (
        <>
          {status === "unconfigured" && <AccountsClosedNotice id={NOTICE_ID} />}
          {formError && (
            <FormAlert id={ERROR_ID} title="Couldn't send the link">
              {formError.text}
            </FormAlert>
          )}
          <Form {...form}>
            <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" inputMode="email" {...field} />
                    </FormControl>
                    <FormDescription>For your privacy, we show the same message whether or not an account exists.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full" disabled={submitting || status === "loading"}>
                {submitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          </Form>
        </>
      )}
    </AuthShell>
  );
}
