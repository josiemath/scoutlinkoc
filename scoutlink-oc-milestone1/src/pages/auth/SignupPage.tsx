import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { AccountsClosedNotice, AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/misc";
import { usePageMeta } from "@/hooks/use-page-meta";
import { focusById } from "@/lib/focus";
import { signupSchema, type SignupValues } from "@/lib/validation";

const NOTICE_ID = "signup-closed-notice";

export default function SignupPage() {
  usePageMeta("Request access", "Request a ScoutLink OC account. Adult volunteers are verified before they can see member information.");
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", confirmPassword: "", isAdult: false, acceptsPolicies: false }
  });

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
                  <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} onBlur={field.onBlur} name={field.name} ref={field.ref} />
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
                  <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} onBlur={field.onBlur} name={field.name} ref={field.ref} />
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
          <Button type="submit" size="lg" className="w-full">
            Create account
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
