import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { AccountsClosedNotice, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { usePageMeta } from "@/hooks/use-page-meta";
import { focusById } from "@/lib/focus";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validation";

const NOTICE_ID = "forgot-closed-notice";

export default function ForgotPasswordPage() {
  usePageMeta("Forgot password", "Get a link to reset your ScoutLink OC password.");
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: "" }
  });

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
                <FormDescription>For your privacy, we show the same message whether or not an account exists.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full">
            Send reset link
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
