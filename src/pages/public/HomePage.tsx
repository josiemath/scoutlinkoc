import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CalendarDaysIcon,
  CalendarSearchIcon,
  ClipboardListIcon,
  EyeOffIcon,
  FlagIcon,
  HandshakeIcon,
  KeyRoundIcon,
  MapIcon,
  NetworkIcon,
  ShieldCheckIcon,
  UsersIcon
} from "lucide-react";
import { Link } from "react-router";
import { NetworkIllustration } from "@/components/marketing/NetworkIllustration";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { SITE_NAME } from "@/lib/site";

const REASONS = [
  { Icon: HandshakeIcon, title: "Connect with other troops", text: "Find troops beyond your own service unit and send a contact request when you'd like to work together." },
  { Icon: MapIcon, title: "Explore service units", text: "See which troops and Girl Scout levels each service unit includes, and what they're open to collaborating on." },
  { Icon: CalendarDaysIcon, title: "Discover events", text: "Browse approved workshops, service days and outdoor activities your troop is eligible to join." },
  { Icon: FlagIcon, title: "Lead community projects", text: "Plan service projects and Bronze, Silver or Gold Award work with task boards, milestones and budgets." },
  { Icon: ClipboardListIcon, title: "Organize activities", text: "Create events, manage registration and waitlists, and keep everyone on the same calendar." },
  { Icon: NetworkIcon, title: "Build meaningful collaborations", text: "Share opportunities, recruit volunteers and partner on joint events across Orange County." }
];

const STEPS = [
  { title: "Join and verify your account", text: "Request an account. An administrator confirms your troop or service unit role before you can see member information." },
  { title: "Discover troops, events and opportunities", text: "Search the directory, browse approved events and see where other troops want help or partners." },
  { title: "Connect, collaborate and lead", text: "Send contact requests, register for events and plan projects together, with adults overseeing every step." }
];

const TRUST = [
  { Icon: BadgeCheckIcon, title: "Verified accounts", text: "Adults are verified through an administrative review, not by picking a role from a list." },
  { Icon: UsersIcon, title: "Adult oversight", text: "Girl-proposed events and projects are reviewed by an approved adult before anything is published." },
  { Icon: KeyRoundIcon, title: "Role-based permissions", text: "What you can see and do depends on your verified role, enforced by the database, not just the screen." },
  { Icon: EyeOffIcon, title: "Controlled information sharing", text: "Rosters, meeting places, personal contact details and travel plans are never shown publicly." }
];

export default function HomePage() {
  usePageMeta(SITE_NAME, "ScoutLink OC connects Girl Scout troops, service units and volunteers across Orange County.");

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden">
        <div className="container-page grid items-center gap-10 py-12 md:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <h1 className="text-[2.15rem] leading-[1.08] font-extrabold sm:text-5xl lg:text-[2.75rem] xl:text-[3.25rem]">
              <span className="block">Connecting Troops.</span>
              <span className="block">Empowering Girls.</span>
              <span className="block text-primary">Building Community.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Discover opportunities, collaborate across service units, organize events, and bring Girl Scout-led ideas to
              life—all in one connected platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/features">
                  Explore ScoutLink OC
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/how-it-works">Learn How It Works</Link>
              </Button>
            </div>
          </div>
          <div className="relative rounded-[2rem] bg-secondary/70 p-4 sm:p-6 dark:bg-secondary/40">
            <NetworkIllustration className="h-auto w-full" />
          </div>
        </div>
      </section>

      {/* Why */}
      <section aria-labelledby="why-heading" className="border-t bg-card/60 py-16 md:py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <h2 id="why-heading" className="text-3xl font-extrabold">Why ScoutLink OC?</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
              Most troops know what's happening inside their own meetings. ScoutLink OC is built for everything between
              troops and service units.
            </p>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map(({ Icon, title, text }) => (
              <li key={title}>
                <Card className="h-full">
                  <span className="grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription className="text-[0.95rem]">{text}</CardDescription>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="steps-heading" className="py-16 md:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="steps-heading" className="text-3xl font-extrabold">How it works</h2>
            <Link to="/how-it-works" className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline">
              Roles and verification in detail
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative border-t-2 border-primary pt-6">
                <span className="font-heading text-sm font-bold text-primary">Step {index + 1}</span>
                <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Featured activities */}
      <section aria-labelledby="activities-heading" className="border-t bg-card/60 py-16 md:py-20">
        <div className="container-page">
          <h2 id="activities-heading" className="text-3xl font-extrabold">Featured activities</h2>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Approved activities that troops choose to share publicly appear here.
          </p>
          <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-input bg-card p-6 sm:flex-row sm:items-center sm:p-8">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <CalendarSearchIcon className="size-6" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h3 className="text-lg font-bold">No public activities are listed yet</h3>
              <p className="mt-1 max-w-2xl leading-relaxed text-muted-foreground">
                Public listings show only the activity, host and general area. Exact places, times and registration go to
                verified members, never to the open web.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/features#events">How events work</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section aria-label="Who ScoutLink OC is for" className="py-16 md:py-20">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border bg-card p-8">
            <h2 className="text-2xl font-extrabold">For troop leaders</h2>
            <p className="mt-2 text-muted-foreground">Spend less time chasing contacts and more time with your troop.</p>
            <ul className="mt-6 grid gap-4">
              {[
                ["Inter-troop contact requests", "Reach another troop's leaders without anyone's phone number or email being shared."],
                ["Event management", "Publish events, set eligibility and capacity, and manage registrations and waitlists."],
                ["Collaboration", "Propose joint events, workshops and service days to troops across the council."],
                ["Volunteer coordination", "Post where you need verified adult help and see who's offered to pitch in."]
              ].map(([title, text]) => (
                <li key={title} className="flex gap-3">
                  <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    <span className="font-semibold">{title}.</span> <span className="text-muted-foreground">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl bg-mint/70 p-8 text-brand-dark dark:bg-accent dark:text-accent-foreground">
            <h2 className="text-2xl font-extrabold text-inherit">For Girl Scouts</h2>
            <p className="mt-2">Tools for planning and leading, with your troop's adults alongside you.</p>
            <ul className="mt-6 grid gap-4">
              {[
                ["Project management", "Break big ideas into tasks, milestones and a budget your team can see."],
                ["Service opportunities", "Find service projects and events your troop is eligible to join."],
                ["Event proposals", "Plan an event yourself and send it to your leader for review."],
                ["Leadership development", "Practice running real projects, from first idea to wrap-up."]
              ].map(([title, text]) => (
                <li key={title} className="flex gap-3">
                  <FlagIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="font-semibold">{title}.</span> {text}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl bg-background/70 p-4 text-sm leading-relaxed text-foreground">
              Accounts for Girl Scouts open only after the council approves consent, guardian permission and supervision
              procedures. Until then, ScoutLink OC is adults-only.
            </p>
          </article>
        </div>
      </section>

      {/* Safety and trust */}
      <section aria-labelledby="trust-heading" className="bg-brand-dark py-16 text-brand-dark-foreground md:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 id="trust-heading" className="text-3xl font-extrabold text-inherit">Safety and trust</h2>
              <p className="mt-3 text-lg leading-relaxed opacity-90">
                ScoutLink OC is designed for a community that includes minors. Safety rules are built into how it works.
              </p>
            </div>
            <Button asChild variant="inverse">
              <Link to="/safety">Read our safety approach</Link>
            </Button>
          </div>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(({ Icon, title, text }) => (
              <li key={title}>
                <Icon className="size-6 text-mint" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-bold text-inherit">{title}</h3>
                <p className="mt-2 leading-relaxed opacity-90">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pilot call to action */}
      <section aria-labelledby="pilot-heading" className="py-16">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border bg-secondary/60 p-6 sm:p-8 md:flex-row md:items-center">
            <div>
              <h2 id="pilot-heading" className="text-2xl font-extrabold">Interested in a pilot?</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                ScoutLink OC is an independent project. Real troop participation starts only with council authorization.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/contact">Get in touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
