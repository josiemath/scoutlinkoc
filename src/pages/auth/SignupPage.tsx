import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router";
import { AccountsClosedNotice, AuthShell, FormAlert } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/misc";
import { useAuth } from "@/hooks/use-auth";
import { useFocusOnChange, type FormError } from "@/hooks/use-focus-on-change";
import { usePageMeta } from "@/hooks/use-page-meta";
import { signUp } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { focusById } from "@/lib/focus";
import { signupSchema, type SignupValues } from "@/lib/validation";

const NOTICE_ID = "signup-closed-notice";
const ERROR_ID = "signup-error";
const SENT_ID = "signup-sent";

export default function SignupPage() {
  usePageMeta("Request access", "Request a ScoutLink OC account. Adult volunteers are verified before they can see member information.");
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", confirmPassword: "", isAdult: false, acceptsPolicies: false }
  });
  const { status } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<FormError | null>(null);
  useFocusOnChange(ERROR_ID, formError);
  const [sentTo, setSentTo] = useState<string | null>(null);
  useFocusOnChange(SENT_ID, sentTo);

  if (status === "signed_in") return <Navigate to="/onboarding" replace />;

  const onSubmit = async (values: SignupValues) => {
    if (status === "unconfigured") return focusById(NOTICE_ID);
    setFormError(null);
    try {
      const result = await signUp(values.email, values.password);
      if (result.needsEmailConfirmation) {
        setSentTo(values.email.trim());
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch (error) {
      setFormError({ text: friendlyError(error) });
    }
  };

  const submitting = form.formState.isSubmitting;

  return (
    <AuthShell
      title="Request access"
      description="Create an account, confirm your email, then ask to be verified for your troop or service unit role."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      {sentTo ? (
        <CheckEmail id={SENT_ID} email={sentTo} onRestart={() => setSentTo(null)} />
      ) : (
        <>
          {status === "unconfigured" && <AccountsClosedNotice id={NOTICE_ID} />}
          {formError && (
            <FormAlert id={ERROR_ID} title="Couldn't create your account">
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormDescription>At least 12 characters. A short phrase is easier to remember.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isAdult"
                render={({ field }) => (
                  <FormItem className="flex flex-wrap items-start gap-x-3 gap-y-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(value) => field.onChange(value === true)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <div className="grid flex-1 gap-1">
                      <FormLabel className="leading-snug font-medium">I'm 18 or older</FormLabel>
                      <FormDescription>Accounts for Girl Scouts open only after the council approves consent procedures.</FormDescription>
                    </div>
                    <FormMessage className="basis-full" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="acceptsPolicies"
                render={({ field }) => (
                  <FormItem className="flex flex-wrap items-start gap-x-3 gap-y-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(value) => field.onChange(value === true)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <div className="grid flex-1 gap-1">
                      <FormLabel className="leading-snug font-medium">I agree to the Terms of use and Privacy policy</FormLabel>
                      <FormDescription>
                        Read the{" "}
                        <Link to="/terms" className="font-semibold text-primary underline underline-offset-4">
                          terms
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy-policy" className="font-semibold text-primary underline underline-offset-4">
                          privacy policy
                        </Link>{" "}
                        (both still drafts).
                      </FormDescription>
                    </div>
                    <FormMessage className="basis-full" />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full" disabled={submitting || status === "loading"}>
                {submitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </Form>
        </>
      )}
    </AuthShell>
  );
}

function CheckEmail({ id, email, onRestart }: { id: string; email: string; onRestart: () => void }) {
  return (
    <div id={id} tabIndex={-1} className="grid gap-4 outline-none" role="status">
      <MailCheckIcon className="size-10 text-primary" aria-hidden="true" />
      <h2 className="font-heading text-xl font-bold">Check your email</h2>
      <p className="leading-relaxed text-muted-foreground">
        If <strong className="text-foreground">{email}</strong> can be used for a new account, we've sent it a link to confirm the address.
        Open the link in this browser to continue.
      </p>
      <ul className="grid list-disc gap-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
        <li>The email can take a few minutes. Check spam or promotions folders too.</li>
        <li>Already have an account with this email? Sign in, or reset your password instead.</li>
      </ul>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button asChild>
          <Link to="/login">Go to sign in</Link>
        </Button>
        <Button variant="outline" onClick={onRestart}>
          Use a different email
        </Button>
      </div>
    </div>
  );
}
