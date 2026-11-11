import { Link } from "react-router";
import { LegalDraft } from "@/components/marketing/LegalDraft";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function TermsPage() {
  usePageMeta("Terms of use (draft)", "Draft terms of use template for ScoutLink OC. Not in effect.");

  return (
    <LegalDraft title="Terms of use" preparedOn="2026-11-10T12:00:00-08:00">
      <h2>About these terms</h2>
      <p>
        These terms would govern use of ScoutLink OC, operated by [Operator name]. ScoutLink OC is independent and is not an
        official service of Girl Scouts of Orange County or Girl Scouts of the USA unless separately authorized in writing.
      </p>

      <h2>Who can use ScoutLink OC</h2>
      <ul>
        <li>Accounts are currently limited to adults 18 and older.</li>
        <li>Member features require verification of your affiliation by an administrator.</li>
        <li>You must give accurate information about your role and affiliation.</li>
      </ul>

      <h2>Acceptable use</h2>
      <ul>
        <li>Use the platform only for Girl Scout troop, service unit and community activities.</li>
        <li>Don't post anyone's personal contact details, private meeting places, travel details or information about minors.</li>
        <li>Don't harass, spam or send unwanted contact requests.</li>
        <li>Don't attempt to access information your role doesn't permit, or to get around security controls.</li>
        <li>Follow Girl Scout safety guidance and your council's fundraising and activity rules.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You keep ownership of what you post. You give [Operator name] permission to store and display it to the people your
        settings and role allow, so the platform can work.
      </p>

      <h2>Moderation and enforcement</h2>
      <p>
        Administrators may review reports, remove content, and suspend or deactivate accounts that break these terms or put
        members at risk.
      </p>

      <h2>No official approvals</h2>
      <p>
        Project tools and progress summaries are planning aids. They don't grant official Bronze, Silver or Gold Award
        approval or any other council approval.
      </p>

      <h2>Disclaimers</h2>
      <p>[Warranty disclaimer and limitation of liability, to be drafted and reviewed by counsel.]</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <Link to="/contact">contact the project team</Link>.
      </p>
    </LegalDraft>
  );
}
