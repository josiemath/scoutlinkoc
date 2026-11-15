import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { AccountsClosedNotice, AuthShell, FormAlert } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useFocusOnChange, type FormError } from "@/hooks/use-focus-on-change";
import { usePageMeta } from "@/hooks/use-page-meta";
import { signIn } from "@/lib/auth";
import { safeNextPath } from "@/lib/auth-redirect";
import { friendlyError } from "@/lib/errors";
import { focusById } from "@/lib/focus";
import { loginSchema, type LoginValues } from "@/lib/validation";

const NOTICE_ID = "login-closed-notice";
const ERROR_ID = "login-error";

export default function LoginPage() {
  usePageMeta("Sign in", "Sign in to ScoutLink OC.");
  const { status } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [formError, setFormError] = useState<FormError | null>(null);
  useFocusOnChange(ERROR_ID, formError);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" }
  });

  if (status === "signed_in") return <Navigate to={next} replace />;

  const onSubmit = async (values: LoginValues) => {
    if (status === "unconfigured") return focusById(NOTICE_ID);
    setFormError(null);
    try {
      await signIn(values.email, values.password);
      navigate(next, { replace: true });
    } catch (error) {
      setFormError({ text: friendlyError(error) });
      form.resetField("password");
    }
  };

  const submitting = form.formState.isSubmitting;

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back. Sign in to see your account and verification status."
      footer={
        <>
          New to ScoutLink OC?{" "}
          <Link to="/signup" className="font-semibold text-primary underline underline-offset-4">
            Request access
          </Link>
        </>
      }
    >
      {status === "unconfigured" && <AccountsClosedNotice id={NOTICE_ID} />}
      {formError && (
        <FormAlert id={ERROR_ID} title="Couldn't sign in">
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
                <div className="flex items-center justify-between gap-2">
                  <FormLabel>Password</FormLabel>
                  <Link to="/forgot-password" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" disabled={submitting || status === "loading"}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
