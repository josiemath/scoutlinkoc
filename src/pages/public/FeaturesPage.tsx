import { BellIcon, CalendarDaysIcon, FlagIcon, HandshakeIcon, MapIcon, MegaphoneIcon, ShieldCheckIcon, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/misc";
import { usePageMeta } from "@/hooks/use-page-meta";

interface FeatureGroup {
  id: string;
  Icon: LucideIcon;
  title: string;
  summary: string;
  items: { name: string; detail: string }[];
}

const GROUPS: FeatureGroup[] = [
  {
    id: "networking",
    Icon: HandshakeIcon,
    title: "Leader networking",
    summary: "Reach other troops without anyone's personal contact details changing hands.",
    items: [
      { name: "Contact requests", detail: "A verified leader asks to connect with another troop's leadership team, with a reason and a proposed type of collaboration." },
      { name: "Accept, decline or report", detail: "Recipients decide. A conversation opens only after a request is accepted." },
      { name: "Adult-to-adult messaging", detail: "Conversation history, unread counts, read status, archiving, reporting and blocking." },
      { name: "Spam protection", detail: "Limits on repeated requests and reporting tools for unwanted messages." }
    ]
  },
  {
    id: "directory",
    Icon: MapIcon,
    title: "Troop and service unit directory",
    summary: "See who's out there, by service unit and troop, showing only what each troop has chosen to share.",
    items: [
      { name: "Service unit profiles", detail: "Region, participating troops, the Girl Scout levels those troops represent, and approved community activities." },
      { name: "Troop profiles", detail: "Troop number, levels, approximate size, years active, interests and collaboration status." },
      { name: "Search, filter and sort", detail: "By name or number, region, level, size, years active, interests and openness to collaboration." },
      { name: "Privacy by default", detail: "No rosters, full names, personal contact details, meeting places or travel details, ever." }
    ]
  },
  {
    id: "events",
    Icon: CalendarDaysIcon,
    title: "Events and calendars",
    summary: "Plan, approve, share and fill events, from a troop meeting to a council-wide service day.",
    items: [
      { name: "Event creation", detail: "Category, host, times in Pacific time, general location, eligible levels, capacity, registration window and requirements." },
      { name: "Approval workflow", detail: "Draft, submitted, changes requested, approved, published, cancelled and completed. Girl-created events always get adult review." },
      { name: "Registration", detail: "Eligibility checks, guardian permission, capacity limits and waitlists, enforced by the database rather than the browser." },
      { name: "Shared calendars", detail: "Month, week and list views for your activities, your troop, your service unit and shared events." },
      { name: "Organizer tools", detail: "Attendee lists, waitlist management, updates, attendance and exports for authorized organizers only." }
    ]
  },
  {
    id: "projects",
    Icon: FlagIcon,
    title: "Girl-led project management",
    summary: "Turn ideas into plans: the core of what makes ScoutLink OC different.",
    items: [
      { name: "Project workspaces", detail: "For service projects, Bronze, Silver and Gold Award planning, workshops, fundraisers, meetings and travel." },
      { name: "Task boards", detail: "To Do, In Progress and Completed columns (add more), with assignees, due dates, priorities and comments. Drag and drop or use the keyboard." },
      { name: "Milestones and timeline", detail: "Track approvals, planning phases, the event itself and wrap-up." },
      { name: "Budgets and fundraising plans", detail: "Estimated and actual costs, approved funding sources and outcome reporting. No payment processing." },
      { name: "Travel planning", detail: "Checklists, supervision plans and approval reminders, visible only to the people on the trip." },
      { name: "Progress reports", detail: "A printable summary of goals, timeline, milestones and budget. It's a planning record, not an official award approval." }
    ]
  },
  {
    id: "opportunities",
    Icon: MegaphoneIcon,
    title: "Opportunities board",
    summary: "Approved requests and invitations from across the council.",
    items: [
      { name: "Categories", detail: "Volunteers needed, joint troop events, STEM, community service, workshops, leadership, project collaboration and supervised mentorship." },
      { name: "Approval first", detail: "Leaders submit opportunities for review before they're shared." },
      { name: "Respond safely", detail: "Express interest through ScoutLink OC; no private contact information is shown." }
    ]
  },
  {
    id: "notifications",
    Icon: BellIcon,
    title: "Notifications",
    summary: "Know when something needs you.",
    items: [
      { name: "What triggers them", detail: "Contact requests, messages, registrations, waitlist changes, event updates, task assignments, deadlines and approvals." },
      { name: "Notification center", detail: "Unread markers, mark as read, and a link straight to the thing that changed." }
    ]
  },
  {
    id: "administration",
    Icon: ShieldCheckIcon,
    title: "Administration and safeguarding",
    summary: "Tools for the people responsible for keeping the platform trustworthy.",
    items: [
      { name: "Verification", detail: "Review volunteer requests, approve affiliations and assign scoped roles." },
      { name: "Moderation", detail: "Review events, opportunities and reported content; request changes, resolve or escalate." },
      { name: "Audit logs", detail: "A record of sensitive actions like role changes, verifications, suspensions and approvals." }
    ]
  }
];

export default function FeaturesPage() {
  usePageMeta("Features", "Networking, directories, events, calendars, girl-led project tools and safeguards in ScoutLink OC.");
  const { hash } = useLocation();

  // Deep links such as "#/features#events" scroll to (and focus) the matching section.
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    target.focus({ preventScroll: true });
  }, [hash]);

  return (
    <>
      <PageHeader
        title="Features"
        description="Everything ScoutLink OC is designed to do, grouped by what you're trying to get done."
      >
        <nav aria-label="Jump to a feature group">
          <ul className="flex flex-wrap gap-2">
            {GROUPS.map((group) => (
              <li key={group.id}>
                <Link
                  to={{ pathname: "/features", hash: group.id }}
                  preventScrollReset
                  className="inline-flex min-h-9 items-center rounded-full border border-input bg-card px-3.5 text-sm font-semibold hover:bg-accent"
                >
                  {group.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <div className="container-page py-12 md:py-16">
        <Alert variant="info" className="max-w-3xl">
          <AlertTitle>Built in stages</AlertTitle>
          <AlertDescription>
            <p>
              This page describes the full platform. Member features open as each stage is finished and reviewed, and
              youth-facing features stay off until the council approves them.
            </p>
          </AlertDescription>
        </Alert>

        <div className="mt-12 grid grid-cols-1 gap-14">
          {GROUPS.map(({ id, Icon, title, summary, items }) => (
            <section key={id} id={id} tabIndex={-1} aria-labelledby={`${id}-heading`} className="scroll-mt-24 outline-none">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-12">
                <div>
                  <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h2 id={`${id}-heading`} className="mt-4 text-2xl font-extrabold">{title}</h2>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{summary}</p>
                </div>
                <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                  {items.map((item) => (
                    <div key={item.name} className="border-t pt-4">
                      <dt className="font-heading font-bold">{item.name}</dt>
                      <dd className="mt-1.5 leading-relaxed text-muted-foreground">{item.detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 text-muted-foreground">
          Curious who can do what? See <Link to="/how-it-works" className="font-semibold text-primary underline underline-offset-4">how roles work</Link>.
        </p>
      </div>
    </>
  );
}
