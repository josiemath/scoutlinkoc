import { CalendarDaysIcon, FlagIcon, HandshakeIcon, MapIcon, MegaphoneIcon } from "lucide-react";
import { Link } from "react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePageMeta } from "@/hooks/use-page-meta";

const NEEDS = [
  { Icon: HandshakeIcon, title: "Inter-troop networking", text: "Help troop leaders find and contact leaders from other troops and service units." },
  { Icon: MapIcon, title: "Service unit visibility", text: "One directory of service units, their troops, Girl Scout levels and what they're open to doing together." },
  { Icon: CalendarDaysIcon, title: "Event organization", text: "Let authorized volunteers and Girl Scouts plan, propose, publish, discover and register for activities." },
  { Icon: FlagIcon, title: "Girl-led project management", text: "Planning tools for service projects, award projects, fundraisers, meetings and travel." },
  { Icon: MegaphoneIcon, title: "Community engagement", text: "A single place for approved opportunities, collaborations and announcements." }
];

const AUDIENCES = [
  "Council administrators",
  "Service unit coordinators",
  "Verified troop leaders",
  "Authorized adult volunteers",
  "Girl Scouts 13 and older, once permissions and supervision are approved",
  "Parents and legal guardians",
  "Visitors reading this public site"
];

export default function AboutPage() {
  usePageMeta("About", "What ScoutLink OC is, who it's for, and where the project stands.");

  return (
    <>
      <PageHeader
        title="About ScoutLink OC"
        description="ScoutLink OC is a community platform designed to connect Girl Scout troops, service units, volunteers and Girl Scouts across Orange County."
      />

      <div className="container-page grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div>
          <section aria-labelledby="needs-heading">
            <h2 id="needs-heading" className="text-2xl font-extrabold">What it's for</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              Troop tools already handle what happens inside a troop. ScoutLink OC focuses on five needs that sit between
              troops and service units.
            </p>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {NEEDS.map(({ Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-heading font-bold">{title}</span>
                    <span className="mt-1 block leading-relaxed text-muted-foreground">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="not-heading" className="prose-page mt-14">
            <h2 id="not-heading" className="!mt-0 text-2xl font-extrabold">What it isn't</h2>
            <p>
              ScoutLink OC isn't an official Girl Scouts of Orange County service, and it doesn't claim to be. It doesn't
              replace official membership, registration, finance or badge-tracking systems, and it never asks for
              information those systems already hold.
            </p>
            <p>
              It also isn't another group-chat app. Messaging exists to support collaboration between verified adults, with
              the safeguards described on the <Link to="/safety">safety page</Link>.
            </p>
          </section>

          <section aria-labelledby="audience-heading" className="prose-page mt-12">
            <h2 id="audience-heading" className="text-2xl font-extrabold">Who it's for</h2>
            <ul>
              {AUDIENCES.map((audience) => (
                <li key={audience}>{audience}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside aria-labelledby="status-heading" className="h-fit rounded-2xl border bg-card p-6 lg:sticky lg:top-24">
          <h2 id="status-heading" className="text-lg font-extrabold">Where the project stands</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-relaxed">
            <li>
              <span className="font-semibold">Independent demonstration.</span>{" "}
              <span className="text-muted-foreground">Built by volunteers and not endorsed by GSOC.</span>
            </li>
            <li>
              <span className="font-semibold">Fictional data only.</span>{" "}
              <span className="text-muted-foreground">Every troop, person and number in the demo is invented.</span>
            </li>
            <li>
              <span className="font-semibold">Adults only for now.</span>{" "}
              <span className="text-muted-foreground">Youth accounts stay off until consent and supervision procedures are approved.</span>
            </li>
            <li>
              <span className="font-semibold">Pilot by authorization.</span>{" "}
              <span className="text-muted-foreground">Real troops join only after the council agrees to a pilot.</span>
            </li>
          </ul>
          <Link to="/contact" className="mt-5 inline-block font-semibold text-primary underline underline-offset-4">
            Ask about a pilot
          </Link>
        </aside>
      </div>
    </>
  );
}
