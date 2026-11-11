import { BadgeCheckIcon, EyeOffIcon, FlagTriangleRightIcon, KeyRoundIcon, LockIcon, MessageSquareOffIcon, UsersIcon } from "lucide-react";
import { Link } from "react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePageMeta } from "@/hooks/use-page-meta";

const PILLARS = [
  { Icon: BadgeCheckIcon, title: "Verified accounts", text: "Every adult's affiliation is confirmed by an administrator. Selecting a troop or role at sign-up is only a request." },
  { Icon: UsersIcon, title: "Adult oversight", text: "Girl-created events and projects go to an approved adult for review before they're shared or opened for registration." },
  { Icon: KeyRoundIcon, title: "Role-based permissions", text: "Access is scoped to your troop, service unit or council role and enforced by database security rules, not just by hiding buttons." },
  { Icon: EyeOffIcon, title: "Controlled information sharing", text: "Troops choose what's shareable. Private details stay with the people who need them." }
];

const NEVER_SHOWN = [
  "Girl Scouts' full names",
  "Personal phone numbers or email addresses",
  "Exact private meeting locations or schedules",
  "Sensitive travel details and itineraries",
  "Member rosters",
  "Guardian information"
];

const BEFORE_YOUTH = [
  "Council authorization for a pilot",
  "Volunteer verification procedures",
  "Account eligibility rules for children and teens",
  "Guardian permission and consent procedures that meet legal requirements",
  "Age-appropriate access",
  "Content moderation and incident reporting",
  "Privacy notices, data retention and deletion",
  "Adult supervision plans",
  "An independent security review"
];

export default function SafetyPage() {
  usePageMeta("Safety and privacy", "How ScoutLink OC protects members, especially youth, through verification, oversight and controlled sharing.");

  return (
    <>
      <PageHeader
        title="Safety and privacy"
        description="ScoutLink OC is designed for a community that includes minors. These protections are part of how it works, not optional settings."
      />

      <div className="container-page grid grid-cols-1 gap-16 py-12 md:py-16">
        <section aria-labelledby="pillars-heading">
          <h2 id="pillars-heading" className="sr-only">Our four protections</h2>
          <ul className="grid gap-5 sm:grid-cols-2">
            {PILLARS.map(({ Icon, title, text }) => (
              <li key={title} className="rounded-2xl border bg-card p-6">
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-bold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="never-heading" className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 id="never-heading" className="text-2xl font-extrabold">Never shown publicly</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Directory pages, public listings, calendars, search results and notifications are built so these details
              can't leak, even to signed-in members who aren't authorized to see them.
            </p>
          </div>
          <ul className="grid gap-3 rounded-2xl border bg-card p-6">
            {NEVER_SHOWN.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <LockIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="messaging-heading" className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 id="messaging-heading" className="flex items-center gap-2 text-2xl font-extrabold">
              <MessageSquareOffIcon className="size-6 text-primary" aria-hidden="true" />
              Messaging rules
            </h2>
          </div>
          <div className="prose-page">
            <ul>
              <li>At launch, messaging is between verified adults only.</li>
              <li>Leaders connect through contact requests; a conversation opens only after the other leader accepts.</li>
              <li>There's no private one-to-one messaging between adults and minors, now or later.</li>
              <li>Future group discussions for Girl Scouts would require approved membership, adult moderators, reporting tools and retention rules.</li>
              <li>Only the people in a conversation can read it. Guessing a link or ID doesn't give anyone access.</li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="reporting-heading" className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 id="reporting-heading" className="flex items-center gap-2 text-2xl font-extrabold">
              <FlagTriangleRightIcon className="size-6 text-primary" aria-hidden="true" />
              Reporting and moderation
            </h2>
          </div>
          <div className="prose-page">
            <p>
              Members will be able to report messages, users, events and opportunities. Reports go to a moderation queue
              where administrators review, resolve or escalate them, and sensitive administrative actions are recorded in
              an audit log. ScoutLink OC doesn't claim automatic moderation; people review reports.
            </p>
            <p>
              If you see something unsafe on this demonstration site, <Link to="/contact">tell us through the contact page</Link>.
              In an emergency, contact local authorities.
            </p>
          </div>
        </section>

        <section aria-labelledby="youth-heading" className="rounded-2xl bg-brand-dark p-8 text-brand-dark-foreground md:p-10">
          <h2 id="youth-heading" className="text-2xl font-extrabold text-inherit">Before any Girl Scout can join</h2>
          <p className="mt-3 max-w-3xl leading-relaxed opacity-90">
            Youth accounts stay switched off, even though the screens are being designed, until each of these is approved.
            A checkbox or a birth date field is never treated as legal consent.
          </p>
          <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {BEFORE_YOUTH.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-mint" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="data-heading" className="prose-page">
          <h2 id="data-heading" className="!mt-0">How data is handled</h2>
          <ul>
            <li>This public demonstration uses fictional records only. No real rosters are loaded.</li>
            <li>ScoutLink OC doesn't collect medical information and doesn't share anyone's real-time location.</li>
            <li>Files are kept in private storage and opened through authorized, expiring links.</li>
            <li>Photos, if ever supported, would require permission and review before anyone else could see them.</li>
          </ul>
          <p>
            Read the draft <Link to="/privacy-policy">privacy policy</Link> and <Link to="/terms">terms of use</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
