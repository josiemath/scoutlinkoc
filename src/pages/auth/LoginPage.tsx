import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { AccountsClosedNotice, AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { usePageMeta } from "@/hooks/use-page-meta";
import { focusById } from "@/lib/focus";
import { loginSchema, type LoginValues } from "@/lib/validation";

const NOTICE_ID = "login-closed-notice";

export default function LoginPage() {
  usePageMeta("Sign in", "Sign in to ScoutLink OC.");
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" }
  });

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back. Sign in to see your troop, events and projects."
      footer={
        <>
          New to ScoutLink OC?{" "}
          <Link to="/signup" className="font-semibold text-primary underline underline-offset-4">
            Request access
          </Link>
        </>
      }
    >
      <AccountsClosedNotice id={NOTICE_ID} />
      <Form {...form}>
        <form noValidate onSubmit={form.handleSubmit(() => focusById(NOTICE_ID))} className="grid gap-5">
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
          <Button type="submit" size="lg" className="w-full">
            Sign in
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
