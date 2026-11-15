import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon, MailIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormAlert } from "@/components/auth/AuthShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/misc";
import { useAuth } from "@/hooks/use-auth";
import { useFocusOnChange, type FormError } from "@/hooks/use-focus-on-change";
import { usePageMeta } from "@/hooks/use-page-meta";
import { sendContactMessage } from "@/lib/account";
import { friendlyError } from "@/lib/errors";
import { focusById } from "@/lib/focus";
import { CONTACT_TOPICS, contactSchema, type ContactValues } from "@/lib/validation";

export default function ContactPage() {
  usePageMeta("Contact", "How to reach the ScoutLink OC project team.");
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", topic: "", message: "", website: "" }
  });

  const { status } = useAuth();
  const [sent, setSent] = useState<object | null>(null);
  useFocusOnChange("contact-sent", sent);
  const [formError, setFormError] = useState<FormError | null>(null);
  useFocusOnChange("contact-error", formError);

  // Without a database, a valid submission points to the notice instead of pretending to send.
  const onValid = async (values: ContactValues) => {
    if (status === "unconfigured") return focusById("contact-closed-notice");
    setFormError(null);
    try {
      await sendContactMessage(values);
      setSent({});
      form.reset();
    } catch (error) {
      setFormError({ text: friendlyError(error) });
    }
  };
  const submitting = form.formState.isSubmitting;

  return (
    <>
      <PageHeader
        title="Contact"
        description="Questions, accessibility problems or interest in a pilot: this form reaches the ScoutLink OC project team."
      />

      <div className="container-page grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
        <div className="prose-page">
          <h2 className="!mt-0">Who you'll reach</h2>
          <p>
            ScoutLink OC is an independent project, so this form goes to the people building it, not to Girl Scouts of
            Orange County.
          </p>
          <p>
            For questions about Girl Scout membership, troop placement, council programs or anything official, contact
            Girl Scouts of Orange County directly through its official website.
          </p>
          <h2>Please don't include</h2>
          <ul>
            <li>Names, ages or schools of Girl Scouts</li>
            <li>Meeting locations, schedules or travel plans</li>
            <li>Phone numbers or home addresses</li>
          </ul>
          <p>If something on the site looks unsafe, choose "Safety or privacy concern" so it's reviewed first.</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          {status === "unconfigured" && (
            <Alert variant="warning" id="contact-closed-notice" tabIndex={-1} className="mb-6 outline-none">
              <MailIcon aria-hidden="true" />
              <AlertTitle>Messages can't be sent yet</AlertTitle>
              <AlertDescription>
                <p>This copy of the site isn't connected to the project database, so nothing you type is sent or stored.</p>
              </AlertDescription>
            </Alert>
          )}
          {sent && (
            <Alert variant="info" id="contact-sent" tabIndex={-1} className="mb-6 outline-none">
              <MailCheckIcon aria-hidden="true" />
              <AlertTitle>Message sent</AlertTitle>
              <AlertDescription>
                <p>Thanks. Your message reached the project team. If it needs a reply, they'll answer by email.</p>
              </AlertDescription>
            </Alert>
          )}
          {formError && (
            <FormAlert id="contact-error" title="Couldn't send your message">
              {formError.text}
            </FormAlert>
          )}

          <Form {...form}>
            <form noValidate onSubmit={form.handleSubmit(onValid)} className="grid gap-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your name</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" inputMode="email" {...field} />
                    </FormControl>
                    <FormDescription>We'll only use this to reply.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <NativeSelect {...field}>
                        <option value="">Choose a topic</option>
                        {CONTACT_TOPICS.map((topic) => (
                          <option key={topic.value} value={topic.value}>
                            {topic.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea rows={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Honeypot: hidden from people and assistive tech; bots that fill it are rejected. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="contact-website">Website</label>
                <input id="contact-website" tabIndex={-1} autoComplete="off" {...form.register("website")} />
              </div>
              <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
                {submitting ? "Sending…" : "Send message"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
