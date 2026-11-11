# ScoutLink OC

A proposed council-wide platform for Girl Scouts of Orange County (GSOC) that connects troops across service units and gives girls tools to plan and lead their own projects.

This repository is a **static prototype**: plain HTML, CSS and JavaScript with no build step, so it runs on GitHub Pages for free. All troops, people and events are fictional sample data.

> ScoutLink OC is an independent student prototype. It is not an official Girl Scouts website and is not operated or endorsed by Girl Scouts of the USA or GSOC. Any final use of Girl Scout names or marks needs GSOC approval.

## What's in the site

| Page | What it does |
| --- | --- |
| `index.html` | The overview and pitch: interactive troop map, features, roles and safety, roadmap, tech stack, the proposal and three pilot decisions you can answer and copy. |
| `app.html` | A working demo of the platform. Switch between six roles to see how each one's experience changes. |
| `404.html` | Friendly "page not found" page that GitHub Pages shows automatically. |

### What you can do in the demo

- **Switch roles** (sidebar or Settings): troop leader, Girl Scout 13+, parent/guardian, Girl Scout under 13, service unit coordinator, GSOC administrator.
- **Explore** troops grouped by service unit, filter by level, interest and service unit, and open troop profiles. Private details stay locked.
- **Events**: list and calendar views, registration with capacity, waitlists, level eligibility and caregiver permission. Organizers can view and download attendee lists (troops and head counts only).
- **Create or propose events**: leaders publish directly; girls 13+ send proposals that their leader approves or sends back with notes.
- **Caregiver flow**: as a Girl Scout under 13, tap "Ask my grown-up", then switch to Parent/guardian to give permission.
- **Projects**: drag-and-drop task board, budget with fundraising tracker, milestones, files, people and invites, plus an exportable progress summary.
- **Messages**: leader-to-leader conversations and adult-moderated project spaces for girls (no adult-to-girl private messages).
- **Opportunities**: volunteer requests, joint projects, mentorship and gear to lend. Posts with phone numbers are blocked.
- **Council admin**: volunteer verification queue, flagged content and service unit data.

Changes in the demo are saved in the browser's local storage only. Use **Settings → Reset demo data** to start over.

## Put it on GitHub Pages

1. Sign in to GitHub and create a **new public repository** (for example `scoutlink-oc`). Don't add a README; this one is included.
2. On the new repo's page, click **uploading an existing file** (or **Add file → Upload files**).
3. Unzip `scoutlink-oc.zip`, open the folder, select **all 13 files inside it** and drag them into the upload area. Drag the files, not the outer folder, so `index.html` ends up at the top level of the repo.
4. Click **Commit changes**.
5. Go to **Settings → Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick **main** and **/ (root)**, then click **Save**.
6. Wait a minute or two, then refresh the Pages settings. Your site will be at
   `https://YOUR-USERNAME.github.io/scoutlink-oc/`

`.nojekyll` is optional (it just tells GitHub not to process the site with Jekyll). If your computer hides it and it doesn't get uploaded, the site still works.

### Using git instead

```bash
cd scoutlink-oc
git init
git add .
git commit -m "ScoutLink OC prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/scoutlink-oc.git
git push -u origin main
```

Then turn on Pages as in step 5.

## Preview on your computer

Double-click `index.html` to open it in a browser. Everything works offline except the web fonts, which load from Google Fonts.

For a local server (closer to how GitHub serves it):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## File structure

```
scoutlink-oc/
├── index.html      Overview and pitch page
├── app.html        Interactive demo
├── 404.html        Not-found page
├── base.css        Colors, type, buttons, patches, forms, tables
├── landing.css     Overview page layout
├── app.css         Demo app layout
├── data.js         All sample data (troops, events, projects, messages, roles)
├── landing.js      Troop map and pilot decisions
├── app.js          Demo app: routing, roles, views, actions
├── logo.svg
├── favicon.svg
├── README.md
└── .nojekyll
```

Every file sits at the top level, with no subfolders, so uploading through GitHub's website can't break the paths.

## Customizing

- **Sample data**: edit `data.js`. Event and task dates are stored as "days from today" (`offset: 9` means nine days from now), so the demo never looks out of date.
- **Colors and fonts**: the variables at the top of `base.css`. Each Girl Scout level has its own color, used for troop patches and level tags.
- **Your name or contact info**: add it to the footer in `index.html`.
- **Map positions**: each troop's `map: [x, y]` in `data.js` places its patch on the overview map.

## Design notes

- Troops appear as stitched patches, colored by their youngest Girl Scout level. Dashed trail lines show collaborations.
- Type: Young Serif for headings and Atkinson Hyperlegible Next for everything else. Atkinson was designed by the Braille Institute for legibility, which matters for a site used by kids and caregivers.
- Built to work with a keyboard and screen readers, on phones and desktops, and with reduced-motion settings respected.

## From prototype to real platform

The suggested production stack is Next.js and TypeScript, Tailwind CSS, Supabase (PostgreSQL and Auth) and Vercel, with a transactional email service for notifications. Before any real data goes in, GSOC should review account verification, caregiver consent, row-level database permissions, moderation and data retention against its current policies.
