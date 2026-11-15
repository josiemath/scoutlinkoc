import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert } from "@/components/auth/AuthShell";
import { AppPageHeader } from "@/components/layout/AppPageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input, Textarea } from "@/components/ui/input";
import { useAppAccount } from "@/hooks/use-app-account";
import { useFocusOnChange, type FormError } from "@/hooks/use-focus-on-change";
import { usePageMeta } from "@/hooks/use-page-meta";
import { parseInterests, updateMyProfile } from "@/lib/account";
import { friendlyError } from "@/lib/errors";
import { profileSchema, type ProfileValues } from "@/lib/validation";

const ERROR_ID = "profile-error";

export default function ProfilePage() {
  usePageMeta("Profile");
  const account = useAppAccount();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<FormError | null>(null);
  useFocusOnChange(ERROR_ID, formError);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    defaultValues: {
      displayName: account.display_name,
      generalLocation: account.general_location,
      bio: account.bio,
      interests: account.interests.join(", ")
    }
  });

  const onSubmit = async (values: ProfileValues) => {
    setFormError(null);
    try {
      await updateMyProfile(account.id, {
        display_name: values.displayName,
        general_location: values.generalLocation,
        bio: values.bio,
        interests: parseInterests(values.interests)
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      form.reset(values);
      toast.success("Profile saved.");
    } catch (error) {
      setFormError({ text: friendlyError(error) });
    }
  };

  const { isSubmitting, isDirty } = form.formState;

  return (
    <div className="max-w-2xl">
      <AppPageHeader
        title="Profile"
        description="What verified volunteers will see about you. Keep it about your volunteering; don't add girls' names, schools or schedules."
      />
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        {formError && (
          <FormAlert id={ERROR_ID} title="Couldn't save your profile">
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="generalLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General area (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="For example, North Orange County" {...field} />
                  </FormControl>
                  <FormDescription>A city or region only. Never a street address or meeting place.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About you (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} />
                  </FormControl>
                  <FormDescription>Up to 600 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Outdoor skills, STEM, community service" {...field} />
                  </FormControl>
                  <FormDescription>Separate with commas. Up to 12.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? "Saving…" : "Save profile"}
              </Button>
              {isDirty && !isSubmitting && (
                <Button type="button" variant="ghost" onClick={() => form.reset()}>
                  Discard changes
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Your email ({account.email}) is only visible to administrators.
      </p>
    </div>
  );
}
