# ScoutLink OC

A Girl Scout networking, event management and project collaboration platform designed for Girl Scouts of Orange County (GSOC): troops and service units find each other, organize events, and run girl-led projects with adults overseeing every step.

> **Independent ScoutLink OC demonstration.** Not an official Girl Scouts of Orange County service unless separately authorized. All example troops, people and numbers are fictional. Girl Scout names and marks belong to Girl Scouts of the USA.

## Status

**Milestone 2 of 8 (Database and authentication) is complete.**

- **Accounts for adult volunteers:** sign up with email confirmation, sign in, sign out (here or on every device), forgot and reset password, sessions that survive reloads and expire gracefully.
- **Verification before access:** new accounts start as "waiting for verification"; onboarding sends a request for a troop or service unit role; council administrators approve or decline it in a review queue. Roles come only from administrator-approved records.
- **Signed-in area:** dashboard with account status and roles, verification page, profile editing, settings (theme, password change, deactivate, deletion request).
- **Database:** Supabase Postgres with Row Level Security on every table, audited functions for every privileged change, rate limits, fictional demo data with a removal script, and 69 database security tests.
- **Contact form** delivers to the database with validation, a honeypot and rate limits.
- Milestone 1's public site, design system, HashRouter routing, CSP and secret-key guard.

A build without Supabase settings still works as a public site; its account forms say accounts aren't open and send nothing. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#4-milestone-plan) for what each milestone adds.

## Technology

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · shadcn/ui pattern on Radix · Lucide · React Router 8 (hash routing) · TanStack Query 5 · React Hook Form + Zod 4 · date-fns 4 · Supabase (Postgres, Auth; Storage and Edge Functions in later milestones) · Vitest 5 · Playwright · ESLint 10 · GitHub Actions + GitHub Pages

Version notes: TypeScript 7 isn't yet supported by typescript-eslint, so the project uses TypeScript 6.0. Fonts (Plus Jakarta Sans, Inter) are Google Fonts families self-hosted through Fontsource, so pages make no third-party requests.

## Getting started

Requires Node.js 22.22 or newer (current LTS recommended).

```bash
npm ci            # install exact dependency versions
npm run dev       # http://localhost:5173
```

### Environment variables

Copy `.env.example` to `.env.local` (never commit it):

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase **publishable** key only. Secret or service_role keys make the build fail on purpose. |
| `VITE_BASE_PATH` | `/` locally; the deploy workflow sets `/<repository-name>/` automatically |
| `VITE_GSOC_AUTHORIZATION_REF` | Optional. Set only after written GSOC authorization; hides the demonstration notice. |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run typecheck` | TypeScript project check |
| `npm run lint` | ESLint, including accessibility rules |
| `npm test` | Vitest unit and integration tests |
| `npm run test:e2e` | Playwright end-to-end and axe accessibility tests against a production build (run `npx playwright install chromium` once first) |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run check` | Typecheck, lint, unit tests and build in one go |
| `npm run test:db` | Database security tests against any PostgreSQL 15+ server (`PGHOST`, `PGUSER`, `PGPASSWORD`) |
| `npm run db:bundle` | Regenerate `supabase/setup.sql` from the migrations |

## Testing

- **Database (pgTAP, real PostgreSQL):** migrations applied to a fresh database, then 69 assertions run as visitors, pending, verified, suspended and deactivated members, and council and platform administrators: who can read and change what, role escalation and self-approval blocked, youth roles blocked, guardian records unreachable, audit log append-only, contact form validation and rate limits, and the demo-data removal script.
- **Unit and integration (Vitest):** configuration and secret-key detection, redirect safety (`next` links can't leave the site), error messages never showing server text, every form schema, route guards, sign-in, sign-up, password reset, email-link handling, onboarding, profile, settings, the verification queue and the contact form against an in-memory Supabase stand-in, plus everything from Milestone 1.
- **End-to-end (Playwright, desktop and mobile):** the public site on a build without Supabase, and the account flows on a build whose Supabase API is answered inside the browser, so the real supabase-js client, session storage and routing are exercised: redirect to sign-in and back, wrong password, session surviving reload, sign-out, onboarding, admin-only queue, contact form.
- **Accessibility:** axe WCAG 2.2 A/AA scans of every public page and every signed-in page (pending, verified, suspended, admin) in light and dark themes.

## Deployment

Set up Supabase by pasting `supabase/setup.sql` into its SQL editor, configure sign-in URLs and email, then build with the project URL and publishable key. Push to `main` and the **Deploy to GitHub Pages** workflow type-checks, lints, tests, builds and publishes; when Actions can't run, upload a local build to the `gh-pages` branch. Step-by-step instructions and troubleshooting: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Security and youth safety

The database is the security boundary: Row Level Security on every table, privileged actions only in trusted functions, roles only from administrator-verified records. Youth accounts and youth messaging stay disabled until the council approves consent, supervision and moderation procedures. See [docs/SECURITY.md](docs/SECURITY.md) for the permission matrix, threat model and production checklist.

### Before any real GSOC use

Real troops, rosters or youth must not be added until there is written council authorization, an approved volunteer verification process, guardian consent procedures that meet legal requirements, moderation and incident procedures, approved privacy notice and terms, and an independent security review.

## Documentation

- [Architecture and milestone plan](docs/ARCHITECTURE.md)
- [Database design and ERD](docs/DATABASE.md)
- [Security, permissions and threat model](docs/SECURITY.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [User guide](docs/USER_GUIDE.md)
