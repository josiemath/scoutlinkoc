# Deployment guide

Step-by-step instructions to run ScoutLink OC on your computer and publish it on GitHub Pages with a Supabase project behind it. No step needs the command line unless it says so.

You'll need:

- A free **GitHub** account and a free **Supabase** account ([supabase.com](https://supabase.com)).
- For building on your own computer (optional): **Node.js** LTS from [nodejs.org](https://nodejs.org), version 22.22 or newer (`node -v`).

There are two halves: the **database and accounts** live in Supabase, and the **website** is static files on GitHub Pages. The website only knows two public values about Supabase: the project URL and the publishable key.

## 1. Create the Supabase project

1. Sign in at [supabase.com](https://supabase.com) → **New project**. Pick a strong database password (store it in a password manager) and a US West region.
2. Wait for the project to finish setting up (a minute or two).

## 2. Set up the database (SQL editor, no command line)

1. In the project, open **SQL Editor** → **New query**.
2. Open `supabase/setup.sql` from this project, copy **all** of it, paste it into the editor, and click **Run**. It should finish with "Success. No rows returned".
   - `setup.sql` is every file in `supabase/migrations/` in order. Run it **once**, on a new project. Running it a second time stops with an "already exists" error before it changes any data.
3. Optional, for a demonstration: open another new query, paste `supabase/seed.sql`, and run it. It adds three fictional service units and four fictional troops, all labelled "fictional demo". Without them nobody can complete onboarding, because a request must name a service unit.
4. Check it worked: **Table Editor** should list `profiles`, `role_assignments`, `troops` and the others, each showing RLS enabled. **Advisors → Security Advisor** should show no errors for these tables.

To remove the demo records later, run `supabase/scripts/remove-demo-data.sql` the same way.

**With the Supabase CLI instead** (developers): `npx supabase link --project-ref YOUR-REF`, then `npx supabase db push`. Don't do both.

## 3. Configure sign-in

In Supabase → **Authentication**:

**URL Configuration**

- **Site URL:** `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/` (for example `https://josiemath.github.io/scoutlinkoc/`). Include the trailing slash.
- **Redirect URLs:** add
  - `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/**`
  - `http://localhost:5173/**` (only if you'll run it on your computer)

Email links come back to `…/REPOSITORY-NAME/?next=/onboarding&code=…`. If the address isn't allowed here, Supabase sends people to the Site URL instead and they won't be signed in.

**Sign In / Providers → Email**

- **Confirm email:** on.
- **Secure email change** and **Secure password change:** on.
- **Minimum password length:** 12 (the app asks for 12 too).

**Attack Protection:** turn on leaked-password protection if your plan offers it. Consider CAPTCHA before a public launch.

**Emails → SMTP Settings: required before real people sign up.** Supabase's built-in email service only sends to people on your Supabase organization's team, about 2 emails an hour. Anyone else trying to sign up sees "This site can't email that address yet". For testing, add yourself (and testers) under **Organization settings → Team**. For real use, connect an email provider (Resend, Postmark, Amazon SES, Brevo and others work) and then raise the limit under **Rate Limits**.

## 4. Copy the two public values

**Project Settings → API Keys**:

- **Project URL**: `https://YOUR-PROJECT-REF.supabase.co`
- **Publishable key**: starts with `sb_publishable_`

These two are designed to be public: they end up in the website's JavaScript, and Row Level Security in the database protects the data.

**Never use the secret key (`sb_secret_…`) or the `service_role` key in this project.** Not in `.env.local`, not in GitHub variables, not in a chat. The build stops with `UnsafeConfigurationError` if it finds one. If one is ever exposed, rotate it in Supabase immediately.

## 5. Build the website with those values

The values are compiled into the site when it's built, so changing them means rebuilding. Pick one way:

**A. GitHub Actions (when Actions can run on your account).** Repository **Settings → Secrets and variables → Actions → Variables → New repository variable**:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | your project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your publishable key |

Then set **Settings → Pages → Source: GitHub Actions** and push to `main`, or run the "Deploy to GitHub Pages" workflow by hand. `VITE_BASE_PATH` is worked out from the repository name.

**B. Build on your computer.** Copy `.env.example` to `.env.local` and fill it in:

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_BASE_PATH=/REPOSITORY-NAME/
```

Then, in the project folder:

```bash
npm ci
npm run build
```

The finished site is in `dist/`. `.env.local` is ignored by Git; never commit it.

**C. Prebuilt files on the `gh-pages` branch (when Actions can't run).** Build as in B (or have someone build it for you with your URL and publishable key), then upload the **contents** of `dist/` to the `gh-pages` branch: open `https://github.com/YOUR-USERNAME/REPOSITORY-NAME/upload/gh-pages`, drag in everything inside `dist`, and commit. GitHub's web uploader skips files whose names start with a dot; the site doesn't need any. Pages must be set to **Deploy from a branch → gh-pages → / (root)**.

## 6. Create the first administrator

1. On the live site, **Request access** with your own email (it must be on your Supabase team until custom SMTP is set up).
2. Open the confirmation email **in the same browser** and click the link. You land on onboarding, signed in. You don't need to send a request.
3. In Supabase **SQL Editor**, run (with your email):

   ```sql
   select private.bootstrap_platform_admin('you@example.org');
   ```

   This makes you platform and council administrator and activates your account. It only works once; after that, administrators grant roles to each other in the app.
4. Reload the site. The dashboard shows your roles, and **Verification requests** appears in the menu.

## 7. Test the live site

1. In a private window, sign up as a second tester (on your Supabase team), confirm the email, and send a verification request for a demo troop.
2. As the administrator, open **Verification requests**, check the details, and **Approve**. The tester's dashboard now says "You're verified".
3. As the tester, **Sign out**, use **Forgot password**, open the email link in the same browser, choose a new password, and sign in with it.
4. Send a message through **Contact**. It's stored in the `contact_messages` table (Table Editor), readable only by administrators.

## 8. Run it on your computer (developers)

```bash
npm ci
npm run dev            # http://localhost:5173 (uses .env.local; set VITE_BASE_PATH=/)
npm run check          # type check, lint, unit tests, production build
npx playwright install chromium   # first time only
npm run test:e2e       # end-to-end and accessibility tests (two builds, one with a mock Supabase)
npm run test:db        # database tests against any PostgreSQL 15+ server (PGHOST, PGUSER, PGPASSWORD)
```

With Docker and the Supabase CLI you can run a full local stack instead: `npx supabase start` (uses `supabase/config.toml`, applies migrations and seed), then `npx supabase test db`.

After changing anything in `supabase/migrations/`, run `npm run db:bundle` to regenerate `supabase/setup.sql`.

## 9. Debugging common problems

| Symptom | Likely cause and fix |
| --- | --- |
| Sign-up says "This site can't email that address yet" | Supabase's built-in email only reaches your organization's team. Add the address to the team, or set up custom SMTP (step 3). |
| "Too many emails were sent recently" | The built-in email allows about 2 per hour for the whole project. Wait, or set up custom SMTP. |
| The email link opens the site but you aren't signed in | The redirect URL isn't allowed (step 3), or the link was opened in a different browser or app. Request a new link and open it in the browser you used. |
| "That link didn't work … expired or already used" | Links work once and expire after an hour. Some email scanners open links first; request a new one. |
| Sign-in page says "Accounts aren't open yet" | The site was built without `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Rebuild with them (step 5). |
| "Couldn't load your account" after signing in | The database setup didn't run. Check that the Table Editor lists `profiles`; if not, run `setup.sql` (step 2). |
| Onboarding says "No service units are set up yet" | Run `seed.sql` for demo data, or add real service units in the Table Editor (Milestone 7 adds a screen for this). |
| Build fails with `UnsafeConfigurationError` | A secret or `service_role` key is in a `VITE_` variable. Remove it, rotate it in Supabase, use the publishable key. |
| Blank page; console shows 404s for `/assets/…` | Built with the wrong base path. Set `VITE_BASE_PATH=/REPOSITORY-NAME/` and rebuild. |
| Site shows a list of files or unstyled text | Pages is serving the source code. Use **GitHub Actions** as the source (5A), or upload the built `dist` contents to `gh-pages` (5C). |
| Workflow fails with a billing or account lock message | GitHub won't run Actions on the account until billing is fixed. Use 5C meanwhile. |
| Old content after publishing | Browser cache. Hard refresh (Ctrl+Shift+R, or Cmd+Shift+R on a Mac). |

## Completing a deletion request

When someone asks to delete their account, it's deactivated right away and `deletion_requested_at` is set on their profile. To finish: Supabase → **Authentication → Users** → find the person → **Delete user**. Their profile, roles, requests and affiliations are removed with it.

## Custom domain (later)

1. Repository **Settings → Pages → Custom domain**, follow GitHub's DNS steps, then turn on **Enforce HTTPS**.
2. Add a repository variable `CUSTOM_DOMAIN` with the domain, so the build uses base path `/`.
3. Change the Supabase Site URL and redirect URLs to the new domain.
4. A host or proxy in front of the site can also send security headers GitHub Pages can't, such as `frame-ancestors` (see [SECURITY.md](SECURITY.md)).

## Removing the independence notice

Only after Girl Scouts of Orange County authorizes an official deployment in writing, set `VITE_GSOC_AUTHORIZATION_REF` to the authorization reference and rebuild.
