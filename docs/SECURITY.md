# Security and safeguarding

ScoutLink OC is treated as a potentially youth-facing platform. The rules here are requirements, not preferences.

## Current state (Milestone 1)

- Public, informational site only. No accounts, no database, no member data.
- Sign-in, sign-up, password and contact forms validate input but **send nothing**; each shows a notice that accounts and messages aren't open.
- Every page states that the site is an independent demonstration and not an official GSOC service.
- A Content-Security-Policy is injected into production builds: scripts only from this origin plus one hashed inline script, fonts and images from this origin, network requests only to this origin and the configured Supabase project, no plugins, no `<base>` hijacking.
- ESLint bans `dangerouslySetInnerHTML`; all user-visible text is rendered as text.

## Authorization boundaries

| Boundary | Enforced by |
| --- | --- |
| Who you are | Supabase Auth JWT (PKCE flow); email confirmation required |
| What you can reach | Row Level Security on every exposed table, default deny |
| What you can change | Column-level grants, RLS `with check`, state-transition triggers |
| Privileged actions (roles, verification, approvals, registration, exports) | `security definer` functions and Edge Functions that re-check the caller's verified, scoped roles |
| What the screen shows | Route guards and permission helpers in `src/lib/permissions.ts`, for UX only |

A hidden link or route guard is never treated as access control. Every admin route's data comes from functions that check scope server-side.

## Role and permission matrix

Scope in brackets. "Own" means records the person created or is a participant in. ✗ = no access.

| Capability | Platform admin | Council admin | SU coordinator | Troop leader | Adult volunteer | Girl member* | Guardian* | Visitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Read public pages and public listings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Read directory (shareable fields) | ✓ | ✓ | ✓ | ✓ | ✓ | limited | limited | ✗ |
| Read troop private details | ✗ | ✓ [council] | ✓ [their SUs' troops] | ✓ [own troop] | ✓ [own troop, if assigned] | ✗ | ✗ | ✗ |
| Edit troop profile | ✗ | ✓ | ✓ [their SUs] | ✓ [own troop] | ✗ | ✗ | ✗ | ✗ |
| Edit service unit profile | ✗ | ✓ | ✓ [own SU] | ✗ | ✗ | ✗ | ✗ | ✗ |
| Send contact request | ✗ | ✓ | ✓ | ✓ | ✓ (verified) | ✗ | ✗ | ✗ |
| Accept/decline contact request | ✗ | ✗ | ✓ [own SU] | ✓ [own troop] | ✗ | ✗ | ✗ | ✗ |
| Read a conversation | ✗ | ✗ | participant | participant | participant | ✗ | ✗ | ✗ |
| Create event (draft) | ✗ | ✓ | ✓ | ✓ | ✓ [assigned troop] | propose | ✗ | ✗ |
| Approve/publish event | ✗ | ✓ | ✓ [own SU] | ✓ [own troop, troop-level visibility] | ✗ | ✗ | ✗ | ✗ |
| Register for event | ✗ | ✓ | ✓ | ✓ [own troop] | ✓ [self] | with guardian permission | own child | ✗ |
| View/export attendee list | ✗ | ✓ | ✓ [own SU events] | ✓ [own events] | organizer only | ✗ | ✗ | ✗ |
| Create project | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ (needs advisor) | ✗ | ✗ |
| Read/edit project | ✗ | read [council] | read [own SU] | ✓ [own troop] | member | member | read own child's | ✗ |
| Invite/remove project members | ✗ | ✗ | ✗ | ✓ [project admin] | project admin | project admin | ✗ | ✗ |
| Submit opportunity | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Approve opportunity | ✗ | ✓ | ✓ [own SU] | ✗ | ✗ | ✗ | ✗ | ✗ |
| Verify users, assign roles | grant admins only | ✓ [council] | recommend [own SU] | ✗ | ✗ | ✗ | ✗ | ✗ |
| Moderate reports | ✓ | ✓ | ✓ [own SU] | ✗ | ✗ | ✗ | ✗ | ✗ |
| Read audit logs | ✓ | ✓ [council] | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Technical settings, key rotation | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

\* Girl member and guardian roles exist in the schema but are **disabled** until the prerequisites below are approved. Pending-verification and suspended accounts get only "read your own account status" plus public content, whatever roles they hold. No one can grant themselves any role; platform admins don't automatically read private messages.

## Supabase key handling

- The browser uses only the **publishable** key (`sb_publishable_…`). It is public by design; RLS protects the data.
- **Secret / service_role keys never go in `VITE_` variables, GitHub Actions variables, or the repository.** `vite.config.ts` and `src/lib/env.ts` both throw if a `VITE_` value looks like a secret key or a `service_role` JWT, so a misconfigured build fails instead of publishing it.
- Privileged keys live only in Supabase Edge Function secrets (`supabase secrets set`).
- If a secret key is ever exposed: rotate it in the Supabase dashboard immediately, then review audit logs. A private GitHub repository does **not** protect keys compiled into frontend code.

## Row Level Security approach

- RLS enabled on every table in `public`; default-deny; minimum table grants (`anon` gets almost nothing).
- Helper functions in a non-exposed `private` schema, `security definer`, fixed `search_path`, reading only `auth.uid()` and `role_assignments`.
- Views that expose directory data are `security invoker` so they can't bypass RLS.
- Every migration ships with SQL tests proving: anonymous reads of private tables return nothing, users can't read another troop's private details, non-participants can't read messages, non-members can't read projects, users can't insert into `role_assignments`, and organizers can't see registrations for events they don't run.

## Age and guardian restrictions

Initial release: adults (18+) only; fictional data only; no real rosters; no youth messaging; no unapproved public event submission.

Youth accounts stay disabled, even when their screens are complete, until the council approves a written plan for:

1. Council authorization of a pilot
2. Volunteer verification
3. Child and teen account eligibility
4. Guardian permission and consent (meeting COPPA and Girl Scout requirements; a checkbox or birth date is never treated as consent)
5. Age-appropriate access
6. Content moderation and incident reporting
7. Privacy notices, data retention and deletion
8. Adult supervision
9. An independent security review

Permanent rules: no public roster of minors; no unrestricted one-to-one adult–minor messaging; no real-time location sharing; no public meeting addresses or travel schedules; no medical data; files in private storage with signed URLs; photos only with permission and review.

## Reporting and incident handling

- Members will report messages, users, events and opportunities (Milestone 7). Reports enter a queue with `open → in_review → resolved | escalated`; no automatic moderation is claimed.
- Incident response: (1) contain (suspend account, unpublish content, revoke sessions); (2) preserve audit logs; (3) notify the council contact and, where required, guardians and authorities; (4) rotate keys if credentials may be exposed; (5) write a post-incident review.
- Report vulnerabilities in this code privately to the repository owner rather than in a public issue.

## Threat model

| Threat | Mitigation | Milestone / test |
| --- | --- | --- |
| Unverified users impersonating leaders | Roles only from admin-written `role_assignments`; onboarding choices are requests; `account_state` gate in every policy | M2; RLS tests: pending user can't read private data |
| Cross-troop data access | Scoped helper functions in every policy; private details in separate tables; UUIDs plus RLS so changing IDs returns nothing | M3; tests change IDs and expect empty results |
| Unauthorized event registration | `register_for_event` RPC only; checks role, eligibility, window, guardian permission, duplicates; no direct insert grant | M5; concurrent registration and bypass tests |
| Private calendar exposure | Calendar queries hit RLS-filtered tables; private events never returned in counts, searches, notifications or ICS feeds | M5; enumeration tests |
| Unsafe messages | Adult-only conversations opened by accepted requests; block and report; plain-text rendering; length limits; rate limits | M4 |
| Malicious uploads | Private bucket; MIME allow-list and size limits in storage policies; signed URLs; files never rendered inline as HTML | M6 |
| Admin privilege escalation | No user write path to `role_assignments`; `grant_role` checks the granter's scope; council admins can't create platform admins; every change audited | M2/M7; escalation tests |
| Youth privacy risks | Youth features disabled; no rosters or full names; prerequisites above | All |
| Abusive automated registrations and requests | Rate limits in RPCs and Edge Functions; honeypot on public forms; unique constraints | M2–M5 |
| Cross-site scripting | No raw HTML rendering (lint-enforced); CSP with hashed inline script; Zod validation | M1 ✅ |
| Clickjacking | GitHub Pages can't send `frame-ancestors` (it isn't allowed in a `<meta>` CSP). Mitigation for an official deployment: serve through a host or proxy that sets `Content-Security-Policy: frame-ancestors 'none'` | Before real pilot |

## Known limitations

- `style-src 'unsafe-inline'` is required because Radix UI and Sonner position overlays with inline `style` attributes. Scripts remain hash-restricted.
- A moderate `minimatch` advisory (GHSA-g3hv-75wg-m249) affects ESLint's dev-only tooling, not anything shipped to browsers; npm's automatic fix would downgrade the accessibility lint plugin. CI audits production dependencies (`npm audit --omit=dev --audit-level=high`), which report 0 vulnerabilities. Dependabot will pick up the upstream fix.

## Production security review checklist

- [ ] Council authorization recorded (`VITE_GSOC_AUTHORIZATION_REF`)
- [ ] Only the publishable key in GitHub variables; secret keys only in Edge Function secrets
- [ ] RLS enabled on every table; `supabase test db` passes; Supabase security advisor shows no warnings
- [ ] Auth: email confirmation on, leaked-password protection on, redirect URLs limited to the real site
- [ ] Storage buckets private; upload limits set
- [ ] Rate limits configured; CAPTCHA considered for sign-up
- [ ] Audit logs reviewed; retention policy set
- [ ] Clickjacking protection via response headers (custom domain/proxy)
- [ ] Dependency audit clean; Dependabot enabled
- [ ] Accessibility and privacy review completed; legal pages approved and draft banners removed
