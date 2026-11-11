# ScoutLink OC

A Girl Scout networking, event management and project collaboration platform designed for Girl Scouts of Orange County (GSOC): troops and service units find each other, organize events, and run girl-led projects with adults overseeing every step.

> **Independent ScoutLink OC demonstration.** Not an official Girl Scouts of Orange County service unless separately authorized. All example troops, people and numbers are fictional. Girl Scout names and marks belong to Girl Scouts of the USA.

## Status

**Milestone 1 of 8 (Foundation) is complete.** This is the public website and app foundation:

- Public pages: home, about, features, how it works, safety, contact, privacy policy (draft), terms (draft), 404
- Account pages (sign in, request access, forgot and reset password) with full validation. **Accounts aren't open yet**: the forms say so and send nothing until Milestone 2 connects Supabase.
- Design system with light and dark themes, responsive navigation, accessible components
- HashRouter routing that works on GitHub Pages, including reloads and path-style links
- Content-Security-Policy, secret-key guard, CI and deployment workflows

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#4-milestone-plan) for what each milestone adds.

## Technology

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · shadcn/ui pattern on Radix · Lucide · React Router 8 (hash routing) · TanStack Query 5 · React Hook Form + Zod 4 · date-fns 4 · Supabase (Postgres, Auth, Storage, Edge Functions; from Milestone 2) · Vitest 5 · Playwright · ESLint 10 · GitHub Actions + GitHub Pages

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
| `VITE_SUPABASE_URL` | Supabase project URL (Milestone 2+) |
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

## Testing

- **Unit and integration (Vitest):** base path handling, configuration and secret-key detection, Pacific-time date handling, every form schema, navigation integrity, theme behavior, every public route rendering, form error behavior, and the CSP and 404 build plugins.
- **End-to-end (Playwright, desktop and mobile):** each public page loads directly and after reload, fits small screens, logs no console or CSP errors; header, mobile and footer navigation; 404 handling; theme persistence; deep links; skip link; honest form behavior.
- **Accessibility:** axe WCAG 2.2 A/AA scans of every public page in light and dark themes, plus checks that form errors are linked to their fields.

Database, RLS and authentication tests arrive with Milestone 2 and need a Supabase project (documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)).

## Deployment

Push to `main` and the **Deploy to GitHub Pages** workflow type-checks, lints, tests, builds and publishes. One-time setup: **Settings → Pages → Source: GitHub Actions**. Full beginner-friendly steps, Supabase setup and troubleshooting: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Security and youth safety

The database is the security boundary: Row Level Security on every table, privileged actions only in trusted functions, roles only from administrator-verified records. Youth accounts and youth messaging stay disabled until the council approves consent, supervision and moderation procedures. See [docs/SECURITY.md](docs/SECURITY.md) for the permission matrix, threat model and production checklist.

### Before any real GSOC use

Real troops, rosters or youth must not be added until there is written council authorization, an approved volunteer verification process, guardian consent procedures that meet legal requirements, moderation and incident procedures, approved privacy notice and terms, and an independent security review.

## Documentation

- [Architecture and milestone plan](docs/ARCHITECTURE.md)
- [Database design and ERD](docs/DATABASE.md)
- [Security, permissions and threat model](docs/SECURITY.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- User guide: added in Milestone 2 alongside the first member features
