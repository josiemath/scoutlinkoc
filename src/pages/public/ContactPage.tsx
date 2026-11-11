import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/misc";
import { usePageMeta } from "@/hooks/use-page-meta";
import { focusById } from "@/lib/focus";
import { CONTACT_TOPICS, contactSchema, type ContactValues } from "@/lib/validation";

export default function ContactPage() {
  usePageMeta("Contact", "How to reach the ScoutLink OC project team.");
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", topic: "", message: "", website: "" }
  });

  // Messages can't be delivered until the project database is connected, so a
  // valid submission points the visitor to the notice instead of pretending to send.
  const onValid = () => focusById("contact-closed-notice");

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
          <Alert variant="warning" id="contact-closed-notice" tabIndex={-1} className="mb-6 outline-none">
            <MailIcon aria-hidden="true" />
            <AlertTitle>Messages can't be sent yet</AlertTitle>
            <AlertDescription>
              <p>The form will deliver messages once the project database is connected. Nothing you type is sent or stored.</p>
            </AlertDescription>
          </Alert>

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
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Check and send
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
