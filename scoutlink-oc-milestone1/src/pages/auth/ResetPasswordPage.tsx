import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { AccountsClosedNotice, AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePageMeta } from "@/hooks/use-page-meta";
import { focusById } from "@/lib/focus";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validation";

const NOTICE_ID = "reset-closed-notice";

export default function ResetPasswordPage() {
  usePageMeta("Choose a new password", "Set a new password for your ScoutLink OC account.");
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" }
  });

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
      <AccountsClosedNotice id={NOTICE_ID} />
      <Form {...form}>
        <form noValidate onSubmit={form.handleSubmit(() => focusById(NOTICE_ID))} className="grid gap-5">
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
          <Button type="submit" size="lg" className="w-full">
            Save new password
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
