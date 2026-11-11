import { Link } from "react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/hooks/use-page-meta";

const STEPS = [
  { title: "Request an account", text: "Sign up with your email, confirm it, and tell us your role and the service unit or troop you volunteer with." },
  { title: "Get verified", text: "An administrator checks your affiliation through the council's process. Until then you can see only your own account and public pages." },
  { title: "Find and connect", text: "Search troops and service units, send contact requests, browse events and opportunities you're eligible for." },
  { title: "Plan and lead", text: "Create or register for events, and run projects with task boards, milestones and budgets." }
];

const ROLES: { name: string; scope: string; can: string; status?: string }[] = [
  { name: "Platform administrator", scope: "Whole platform", can: "Technical administration, security settings and audit review. Doesn't grant access to private messages." },
  { name: "Council administrator", scope: "The council", can: "Verify volunteers, manage troop and service unit records, approve events, review reports." },
  { name: "Service unit coordinator", scope: "One or more service units", can: "Manage service unit information, coordinate volunteers, approve service unit events and opportunities." },
  { name: "Troop leader", scope: "Their troop", can: "Manage the troop profile, contact other leaders, create events, approve girl-led proposals, run projects." },
  { name: "Adult volunteer", scope: "Their troop or event", can: "Help with events and projects they're assigned to, and contact leaders once verified." },
  { name: "Girl Scout member", scope: "Their projects and troop", can: "Join approved projects, propose events for adult review, sign up for activities with guardian permission.", status: "Not open yet" },
  { name: "Parent or guardian", scope: "Their own child", can: "Review events, give permissions and register their child.", status: "Not open yet" },
  { name: "Public visitor", scope: "Public pages", can: "Read about the platform and approved public listings. No member information." }
];

const STATES = [
  { name: "Pending verification", text: "Signed up but not yet confirmed. Sees only their own account status and public pages." },
  { name: "Active, verified", text: "Confirmed affiliation. Access matches their scoped roles." },
  { name: "Suspended", text: "Temporarily blocked from member features while an issue is reviewed." },
  { name: "Deactivated", text: "Closed by the member or an administrator. A deletion request removes personal data." }
];

export default function HowItWorksPage() {
  usePageMeta("How it works", "How accounts, verification and roles work in ScoutLink OC.");

  return (
    <>
      <PageHeader
        title="How it works"
        description="Every account is tied to a verified role, and every role has a clear scope: a troop, a service unit or the council."
      />

      <div className="container-page grid grid-cols-1 gap-16 py-12 md:py-16">
        <section aria-labelledby="journey-heading">
          <h2 id="journey-heading" className="text-2xl font-extrabold">From sign-up to collaboration</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border bg-card p-6">
                <span className="grid size-9 place-items-center rounded-full bg-primary font-heading text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="roles-heading">
          <h2 id="roles-heading" className="text-2xl font-extrabold">Roles</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
            Roles come from verified records kept by administrators. You can't pick your own, and one person can hold more
            than one, for example leading a troop and coordinating a service unit.
          </p>
          {/* Focusable so keyboard users can scroll the table sideways on small screens. */}
          <div role="region" aria-label="Roles table" tabIndex={0} className="mt-8 overflow-x-auto rounded-2xl border bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">ScoutLink OC roles, their scope and what they can do</caption>
              <thead className="bg-muted/70">
                <tr>
                  <th scope="col" className="px-5 py-3 font-heading font-bold">Role</th>
                  <th scope="col" className="px-5 py-3 font-heading font-bold">Scope</th>
                  <th scope="col" className="px-5 py-3 font-heading font-bold">What they can do</th>
                </tr>
              </thead>
              <tbody>
                {ROLES.map((role) => (
                  <tr key={role.name} className="border-t align-top">
                    <th scope="row" className="px-5 py-4 font-semibold">
                      <span className="flex flex-wrap items-center gap-2">
                        {role.name}
                        {role.status && <Badge variant="warning">{role.status}</Badge>}
                      </span>
                    </th>
                    <td className="px-5 py-4 text-muted-foreground">{role.scope}</td>
                    <td className="px-5 py-4 leading-relaxed">{role.can}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="states-heading" className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-12">
          <div>
            <h2 id="states-heading" className="text-2xl font-extrabold">Account states</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">Your account status decides what you can reach.</p>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2">
            {STATES.map((state) => (
              <div key={state.name} className="border-t pt-4">
                <dt className="font-heading font-bold">{state.name}</dt>
                <dd className="mt-1.5 leading-relaxed text-muted-foreground">{state.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="faq-heading" className="max-w-3xl">
          <h2 id="faq-heading" className="text-2xl font-extrabold">Common questions</h2>
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="verified">
              <AccordionTrigger>Does signing up make me a verified leader?</AccordionTrigger>
              <AccordionContent>
                No. Choosing a troop or role during sign-up is a request. An administrator confirms it through the council's
                process before you can see private troop information or contact other leaders.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="contact">
              <AccordionTrigger>Can other leaders see my phone number or email?</AccordionTrigger>
              <AccordionContent>
                Not by default. Leaders reach each other through contact requests, and a conversation opens inside ScoutLink
                OC only after the request is accepted.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="girls">
              <AccordionTrigger>When can Girl Scouts use ScoutLink OC?</AccordionTrigger>
              <AccordionContent>
                Only after the council approves age eligibility, guardian consent, adult supervision and moderation
                procedures. Even then, there's no private one-to-one messaging between adults and girls.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="events">
              <AccordionTrigger>Can a Girl Scout publish an event on her own?</AccordionTrigger>
              <AccordionContent>
                She can plan and propose it. An authorized adult reviews and approves it before anyone else can see or
                register for it.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="official">
              <AccordionTrigger>Is this the official council system?</AccordionTrigger>
              <AccordionContent>
                No. ScoutLink OC is an independent project. It doesn't replace official membership or registration systems.{" "}
                <Link to="/about" className="font-semibold text-primary underline underline-offset-4">
                  More about the project
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </>
  );
}
