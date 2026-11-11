import { Link } from "react-router";
import { LegalDraft } from "@/components/marketing/LegalDraft";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function PrivacyPolicyPage() {
  usePageMeta("Privacy policy (draft)", "Draft privacy policy template for ScoutLink OC. Not in effect.");

  return (
    <LegalDraft title="Privacy policy" preparedOn="2026-11-10T12:00:00-08:00">
      <h2>Who this policy covers</h2>
      <p>
        This policy would apply to ScoutLink OC, operated by [Operator name], [operator contact address]. It would cover
        adult volunteers, administrators and visitors. Youth accounts are not available; if they are approved in the
        future, a separate notice meeting the Children's Online Privacy Protection Act (COPPA) and organizational
        requirements would be published first.
      </p>

      <h2>Information we would collect</h2>
      <ul>
        <li>Account details: email address, display name and a password managed by our authentication provider (we never see or store your password).</li>
        <li>Affiliation requests: the role, troop and service unit you ask to be verified for, and the outcome of that review.</li>
        <li>Content you create: events, projects, tasks, messages and opportunities.</li>
        <li>Technical records needed for security, such as sign-in times and audit logs of sensitive actions.</li>
      </ul>

      <h2>Information we would not collect</h2>
      <ul>
        <li>Medical information</li>
        <li>Real-time location</li>
        <li>Payment card details (ScoutLink OC does not process payments)</li>
        <li>Girl Scout rosters from official council systems</li>
      </ul>

      <h2>How information would be used</h2>
      <p>
        To run the platform: verifying volunteers, showing you what your role allows, delivering notifications you've
        chosen, keeping the service secure, and investigating reports. We would not sell personal information or use it for
        advertising.
      </p>

      <h2>Who can see what</h2>
      <p>
        Access is limited by verified role and enforced by database security rules. Rosters, personal contact details,
        private meeting locations and travel details are never shown publicly. See the <Link to="/safety">safety page</Link>{" "}
        for details.
      </p>

      <h2>Service providers</h2>
      <p>
        Data would be hosted by [database and authentication provider, region] and the website by [hosting provider].
        [List of processors and their purposes, to be completed.]
      </p>

      <h2>Retention and deletion</h2>
      <p>
        [Retention periods for accounts, messages, audit logs and event records, to be set during review.] You would be able
        to deactivate your account and request deletion from your account settings.
      </p>

      <h2>Your choices</h2>
      <p>
        You would be able to update your profile, change notification preferences, and request a copy or deletion of your
        data by contacting [privacy contact].
      </p>

      <h2>Changes</h2>
      <p>Material changes would be announced on the site before they take effect.</p>
    </LegalDraft>
  );
}
