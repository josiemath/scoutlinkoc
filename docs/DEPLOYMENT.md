# Deployment guide

Beginner-friendly steps to run ScoutLink OC on your computer and publish it with GitHub Pages. Steps 3–6 are only needed from Milestone 2 onward, when the database is added.

You'll need:

- **Node.js** (current LTS release) from [nodejs.org](https://nodejs.org). Check with `node -v`; it must be 22.22 or newer.
- **Git**, or **GitHub Desktop** if you'd rather not use the command line.
- A free **GitHub** account (and, from Milestone 2, a free **Supabase** account).

## 1. Create or reuse a GitHub repository

- **New repository:** github.com/new → choose a name (for example `scoutlink-oc`) → Public → don't add a README → Create.
- **Reusing an existing repository** that holds an older version of the site: that's fine. You'll replace its files in step 8.

The site address will be `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`. The repository name is read automatically at build time; nothing is hardcoded.

## 2. Install dependencies

Unzip the project, open a terminal in the project folder, and run:

```bash
npm ci
```

`npm ci` installs the exact versions in `package-lock.json`. Don't commit the `node_modules` folder it creates (it's already in `.gitignore`).

## 3. Create a Supabase project (Milestone 2+)

1. Sign in at [supabase.com](https://supabase.com) → **New project**. Choose a strong database password and a US West region.
2. Open **Project Settings → API Keys**. Copy the **Project URL** and the **publishable** key (`sb_publishable_…`).
3. **Never copy the secret / service_role key into this project's environment files or GitHub variables.** The build refuses to run if you do.

## 4. Run database migrations (Milestone 2+)

```bash
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push        # applies supabase/migrations
npx supabase test db        # runs the Row Level Security tests
```

## 5. Configure authentication (Milestone 2+)

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`
- **Redirect URLs:** add both
  - `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/**`
  - `http://localhost:5173/**`

In **Authentication → Providers → Email**: keep **Confirm email** on. In **Authentication → Attack Protection**: turn on leaked-password protection if your plan offers it.

## 6. Set environment variables

**Local development:** copy `.env.example` to `.env.local` and fill in:

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_BASE_PATH=/
```

`.env.local` is ignored by Git. Never commit it.

**GitHub (for the deployed site):** repository **Settings → Secrets and variables → Actions → Variables tab → New repository variable**:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | your project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your publishable key |

You don't set `VITE_BASE_PATH` on GitHub; the deploy workflow works it out from the repository name.

## 7. Run locally

```bash
npm run dev            # http://localhost:5173
npm run check          # type check, lint, unit tests and production build
npx playwright install chromium   # first time only
npm run test:e2e       # end-to-end and accessibility tests
```

To preview exactly what GitHub Pages will serve:

```bash
# macOS / Linux
VITE_BASE_PATH=/REPOSITORY-NAME/ npm run build && VITE_BASE_PATH=/REPOSITORY-NAME/ npm run preview
# Windows PowerShell
$env:VITE_BASE_PATH="/REPOSITORY-NAME/"; npm run build; npm run preview
```

Then open `http://localhost:4173/REPOSITORY-NAME/`.

## 8. Push the code to GitHub

The project has folders (`src`, `docs`, `.github`, …) that must keep their structure. GitHub's "Upload files" page flattens folders if you select files instead of folders, which breaks the site, so use one of these:

**Option A: GitHub Desktop (easiest)**

1. GitHub Desktop → **File → Clone repository** → pick your repository → Clone.
2. Open the cloned folder. If it contains files from an older version of the site, delete them (keep the hidden `.git` folder).
3. Copy **everything** from the unzipped project into that folder, including `.github`, `.gitignore`, `.env.example` and `.nvmrc`. Don't copy `node_modules` or `dist` if you have them.
4. Back in GitHub Desktop, write a summary like "ScoutLink OC Milestone 1" → **Commit to main** → **Push origin**.

**Option B: command line**

```bash
git init -b main          # skip if the folder is already a Git repository
git add .
git commit -m "ScoutLink OC Milestone 1"
git remote add origin https://github.com/YOUR-USERNAME/REPOSITORY-NAME.git
git push -u origin main   # add --force only if you intend to replace an older site's history
```

**Option C: web upload.** On the repository page → **Add file → Upload files**, then drag the **folders and files** from the unzipped project (drag the `src` folder itself, not the files inside it). On a Mac, press Cmd+Shift+. in Finder to show the hidden `.github` folder first. Delete any leftover files from an older version of the site.

## 9. Turn on GitHub Pages

Repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.

If it currently says "Deploy from a branch", switch it. Otherwise GitHub serves the raw source files instead of the built site.

## 10. Open the published site

1. Open the **Actions** tab. The "Deploy to GitHub Pages" workflow runs on every push to `main` (about 2 minutes). You can also start it by hand with **Run workflow**.
2. When it shows a green check, open `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.
3. If you see an old version, do a hard refresh (Ctrl+Shift+R, or Cmd+Shift+R on a Mac). GitHub Pages lets browsers cache pages for about 10 minutes.

## 11. Test production authentication (Milestone 2+)

1. On the live site, **Request access** with a real email address you control.
2. Open the confirmation email; the link should return you to the live site, signed in, with "Pending verification".
3. **Sign out**, use **Forgot password**, follow the email link, set a new password, and sign in with it.
4. If links bounce to `localhost` or show "redirect URL not allowed", recheck step 5.

## 12. Debugging common failures

| Symptom | Likely cause and fix |
| --- | --- |
| Site shows unstyled text or a list of files | Pages source is still "Deploy from a branch". Set it to **GitHub Actions** (step 9) and re-run the workflow. |
| Blank page; browser console shows 404s for `/assets/…` | Built with the wrong base path. Let the workflow set it, or build locally with `VITE_BASE_PATH=/REPOSITORY-NAME/`. If you renamed the repository, re-run the workflow. |
| Workflow fails at `npm ci` | `package-lock.json` wasn't uploaded. Commit it. |
| Workflow fails at "Configure GitHub Pages" or "Deploy" | Pages isn't enabled with the GitHub Actions source, or the `github-pages` environment blocks the `main` branch (Settings → Environments). |
| Build fails with `UnsafeConfigurationError` | A Supabase secret or service_role key is in a `VITE_` variable. Remove it, rotate the key in Supabase, and use the publishable key. |
| Type check or lint fails in Actions but not locally | Run `npm run check` locally on the same commit; make sure you're on the Node LTS. |
| Typing `/REPOSITORY-NAME/about` shows a redirect, then the page | Expected. Routes use `#/about`; the generated `404.html` forwards path-style links. |
| Old content after a successful deploy | Browser cache; hard refresh or open a private window. |

## Custom domain (later)

1. Repository **Settings → Pages → Custom domain**, enter your domain (for example `scoutlink.example.org`), and follow GitHub's DNS instructions. Turn on **Enforce HTTPS** once the certificate is ready.
2. Add a repository variable `CUSTOM_DOMAIN` with the same domain. The workflow then builds with base path `/`.
3. Update the Supabase Site URL and redirect URLs to the new domain.
4. A custom domain behind a proxy or CDN also lets you send security headers that GitHub Pages can't, such as `frame-ancestors` (see [SECURITY.md](SECURITY.md)).

## Removing the independence notice

Only after Girl Scouts of Orange County authorizes an official deployment in writing, add a repository variable `VITE_GSOC_AUTHORIZATION_REF` with the authorization reference. The demonstration notice is then replaced by that reference.
