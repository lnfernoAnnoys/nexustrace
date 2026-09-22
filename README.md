# NexusTrace — AI-Powered Criminal Network Analysis System

Prototype for **SIH26189** (Ministry of Home Affairs — Blockchain & Cybersecurity theme). A dark, intelligence-platform-style web app for investigators to explore entities (people, phones, vehicles, organizations, locations, financial accounts), their relationships, AI-flagged suspicious patterns, and case timelines through an interactive network graph.

The case files are **ten real Indian cases** compiled from public records: the 26/11 Mumbai attacks, the Bhopal gas disaster, the 1992 Harshad Mehta securities scam, Satyam, the 2G spectrum case, Nirav Modi / PNB, NSEL, Saradha, Kingfisher / Vijay Mallya and AgustaWestland. Each person, company and place has a role, a legal status as reported in public records, a plain-English description, a risk score with the reasons behind it, and links to the articles it is based on. Photos are openly licensed pictures from Wikimedia Commons, credited on the page. The files hold no personal phone numbers or home addresses: only company registered offices, crime locations and facts that are in published sources.

The **NLP engine** (`src/nlp/`) is real and runs in the browser, with no API and no model download. See *NLP engine* below.

The case data is served by the API only to signed-in users (`GET /api/dataset`); it is not part of the public JavaScript bundle.

## Run it

```bash
npm install
npm run dev
```

`npm run dev` starts two things together: the website (Vite, `http://localhost:5173`) and the API (`server/`, port 3001). Vite forwards `/api` requests to the API, so just use the 5173 address. **Node 22 or newer** is required (install the current LTS from nodejs.org).

There are two websites on that one server:

| | Address | For |
|---|---|---|
| NexusTrace | `http://localhost:5173/` | investigators |
| NexusTrace Command (admin console) | `http://localhost:5173/admin/` | the head of department: accounts, access levels, access requests |

### Signing in (password + authenticator app)

Use **Create an account** on the login page (pick an Investigator ID or email, and a password of 10+ characters). Every account then has to scan a QR code with **Google Authenticator, Microsoft Authenticator or Authy** (any TOTP app), confirm a 6-digit code, and save 10 one-time backup codes. Every sign-in after that needs the password *and* a code from the app.

On the first run the API also creates a demo account and prints it in the terminal: ID `a.sharma`, password `NexusTrace#2026` (change it in **Settings → Security**).

**Restricting who can sign in.** Sign-up is open for now. To allow only accounts you create yourself, start the API with `SIGNUP_OPEN=false` (the "Create an account" link disappears and the API refuses sign-ups), then add people with `npm run user -- create ...` below.

### Access levels and the admin console

Every account has an **access level from 1 to 8** (new accounts start at 1). What each level can see is not enforced yet: the level is stored, shown to the person (Settings → Access, and `L3` in the sidebar) and available to the API as `accessLevel`, ready to be checked once the rules are decided.

**Signing in to the admin console** needs an account with the *administrator* role, plus password and authenticator code like everywhere else. Give someone that role from the command line (there is deliberately no button for it in the website):

```bash
npm run user -- make-admin <username>       # e.g. your own account
npm run user -- remove-admin <username>     # locks them out of the console immediately
```

In the console the administrator can:

- see every account with its level, 2FA status and any waiting request (**Accounts**), and change a level by hand;
- read **Access Requests**: the reason and the identity documents people attached, then approve at any level they choose (it can differ from what was asked) or deny with a note;
- look back at every change in the **Audit Log** (who, what, when, and the note).

Investigators ask for more access in **Settings → Access**: pick a higher level, write the reason (20+ characters) and attach an ID scan or photo (1 to 3 files, PDF/PNG/JPEG, 5 MB each). One request can be open at a time and can be withdrawn. They see the decision and the administrator's note there.

The two websites have separate sign-ins (cookies `nt_session` and `nt_admin_session`), so signing in to one does not sign you in to the other, and the console session expires after 2 hours.

### Managing users

```bash
npm run user -- list                        # shows level and role
npm run user -- create <username> <password> --name "Full Name" --badge IPS-1234 --department "Unit" --email a@b.gov.in [--admin] [--level 1-8]
npm run user -- set-level <username> <1-8>
npm run user -- make-admin <username>
npm run user -- reset-password <username> <new-password>
npm run user -- reset-2fa <username>      # lost phone: they re-enrol at next sign-in
npm run user -- delete <username>
```

### Running as one server (demo / deployment)

```bash
npm run build
npm start          # serves both websites (/ and /admin/) and the API on one port (3001, or $PORT)
```

To put it on the internet (Azure server + free `.me` domain, HTTPS, auto-restart) follow [DEPLOY.md](DEPLOY.md); the scripts it uses are in `deploy/`.

## Backend (`server/`)

Express + SQLite (`better-sqlite3`), written in TypeScript. Data lives in `server/data/` (created on first run, git-ignored):

- `nexustrace.db` — users (with role and access level), sessions, backup codes, access requests, the identity documents attached to them, and the audit log
- `app.key` — encrypts each user's authenticator secret. **Never commit it.** If it is lost, every user has to re-enrol 2FA (`reset-2fa`). Set `APP_SECRET_KEY` (64 hex chars) to supply your own key instead.

How sign-in is protected:

- Passwords are hashed with bcrypt; wrong-user and wrong-password look identical; 5 failures lock the account for 15 minutes.
- After the password, the server issues a short-lived *pending* session that cannot access anything until the 2FA code is accepted, and is replaced by a brand new session token once it is.
- TOTP codes are checked on the server with a ±30 s clock allowance, and a code can't be reused (replay protection). 5 wrong codes end the sign-in attempt.
- Sessions are random tokens in an `HttpOnly`, `SameSite=Lax` cookie (only their hash is stored), last 8 hours, and can be revoked from **Settings → Security → Active Sessions**.
- Identity documents are checked by their content (only real PDF/PNG/JPEG files are accepted, whatever the file is called) and stored **encrypted** with the same key as the authenticator secrets. Only signed-in administrators can open them.
- A session only works on the site it was created for, and the admin console re-checks the administrator role on every request, so removing the role takes effect at once.
- Requests are rate-limited, security headers come from `helmet`, and state-changing requests from another site are rejected (a page is trusted when it was served from the same host and port it sends the request to, so any dev port works).

Configuration (all optional): `SIGNUP_OPEN` (default `true`), `API_PORT` (dev, default 3001), `PORT` (production), `HOST` (default `127.0.0.1`), `CLIENT_ORIGIN` (comma-separated extra allowed origins), `COOKIE_SECURE=true` (when served over HTTPS), `DEMO_PASSWORD`, `APP_SECRET_KEY`, `DATA_DIR`.

Run only one `npm run dev` at a time: a second one can't use port 3001, and Vite silently moves to 5174.

If `npm install` fails on `better-sqlite3` (a native module), install the Visual Studio "Desktop development with C++" build tools, or use a Node version that has a prebuilt binary.

## NLP engine

Paste an FIR, a news report or a court order into **Evidence Intake** or the **AI Insights → NLP Lab**, and the engine finds:

- people (with aliases: "Sajid Mir, alias Wasi"), companies, places, vehicle plates, phone numbers and bank accounts;
- who is in the graph already (fuzzy matching: "Mehta" = "Harshad Mehta", "Union Carbide" = "Union Carbide Corporation", "NSEL" = "National Spot Exchange Ltd (NSEL)");
- the links between them ("son of", "transferred", "was arrested in", "co-accused"), each with the words that triggered it and a confidence;
- amounts, dates, legal sections and a crime category.

Investigating agencies and officials are recognised but kept out of the network. In the review window the investigator ticks what to add and it goes into the case graph. It is rule-based (tokeniser, sentence splitter, gazetteers, cue rules, Jaro-Winkler matching), so it takes a few milliseconds and nothing leaves the browser. Word lists are plain data in `src/nlp/lexicon.ts`. `npx tsx src/nlp/selfcheck.ts` runs sample texts and checks the expected results are found.

Text added on Evidence Intake, and entities added from the review window, live in the browser only (they are gone after a reload); the ten cases come from the server each time.

## Importing many cases from one file

**Cases → Import from file** (or the *Import from file* tab of *New Case*) turns a CSV or Excel file into many cases at once, one case per row.

1. Drop a `.csv` or `.xlsx` (up to 5 MB and 500 rows; the first row must be column names). *Download template* gives a CSV to start from. Old `.xls` files are refused with a message asking to save as `.xlsx` or CSV. The file is read in the browser and never uploaded.
2. Columns are matched to case fields by their names ("Case Name", "Type of Crime", "FIR Year", "Accused Names", …). The page shows what it matched and lets you change any of them. If a workbook has several sheets you pick one.
3. A preview lists every case that will be created, with notes on problems: a row with no title, a title that already exists (or repeats an earlier row) is left out by default, and an unknown status, priority or year falls back to a default with a warning. Untick any row to leave it out.
4. Only a **title** is needed. Other columns: description, category, status, priority, year, place, lead agency (separate several with `;`), impact, outcome, people and organisations (separate names with `;`).
5. *Create* adds the cases. Names in the people and organisations columns become entities in the case. With *Read each description with the NLP engine* ticked (the default), people, companies, places and the links between them found in each description are added too. A name that is already in the graph, or appears in several rows, is one entity that belongs to each of those cases, which is how cross-case links show up.

Imported cases are held in the browser like anything added on Evidence Intake: they are not stored on the server and are gone after a reload. The code is in `src/lib/tabular.ts` (CSV parser and lazy-loaded Excel reader, using `read-excel-file`), `src/data/caseImport.ts` (column matching, validation and the import) and `src/components/cases/ImportCasesPanel.tsx`.

## Social media intelligence

The **Social Intelligence** page lists every person and organisation in the cases and what is documented about their official social media accounts.

- **Where accounts come from:** Wikidata (the public database behind Wikipedia). `server/dataset/fetch-social.ts` ties each public figure or organisation to one Wikipedia article by hand, reads the accounts Wikidata documents for it (X, Instagram, Facebook, YouTube, LinkedIn, official website) and writes `server/dataset/social.ts`. Run `npx tsx server/dataset/fetch-social.ts` to refresh it. The app never calls Wikidata or any social platform at run time, so it works offline and shows the same thing every time.
- **Each name gets one of three statuses:** *Official account found*, *Checked, none listed*, or *Not searched*. The page says why for every row.
- **Not searched, on purpose:** private individuals, victims and people accused of terrorism. Matching a name to a personal profile is unreliable and can point at the wrong person, and there is no source to cite. The tool does not scrape platforms, call platform APIs or generate search links for a person.
- **Handle finder:** paste text (a complaint, a screenshot's text, a news report) and the engine picks out handles and profile links (`src/nlp/handles.ts`). Each one is checked against the documented accounts: a match points to the person or organisation in the case, anything else is flagged for a person to review. The same handles appear as facts in the NLP Lab and the Evidence Intake review window.
- Entity pages for people and organisations show a *Social media presence* card with the same information and its source.

To add a name, add its entity id and exact English Wikipedia title to `CHECKED` in `fetch-social.ts` and run the script. Only add public figures and organisations, and check that the article is about the same entity as the one in the case (a parent company or a scandal with the same name is a different thing).

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (`@theme` tokens in `src/index.css` — dark "intelligence ops room" palette)
- Radix UI primitives, hand-styled to match the theme (`src/components/ui`)
- `react-force-graph-2d` for the network graph (`src/components/graph/NetworkGraph.tsx`)
- Recharts for dashboard analytics, Framer Motion for transitions
- React Router for navigation

## Structure

- `src/types` — shared TypeScript interfaces (entities, relationships, cases, events, alerts, evidence)
- `src/data` — the in-browser store (filled after sign-in by `loader.ts`) plus helper functions (`computeCentrality`, `findShortestPath`, per-case lookups, `computeAlerts`: patterns worked out from the graph itself)
- `src/nlp` — the NLP engine (`extract.ts`, `lexicon.ts`, `handles.ts`, `toGraph.ts`, `selfcheck.ts`)
- `src/data/social.ts`, `src/components/social`, `src/pages/SocialIntelligence.tsx` — the social media intelligence page and card
- `src/lib/tabular.ts`, `src/data/caseImport.ts`, `src/components/cases` — importing cases from CSV / Excel
- `src/components/graph` — the network graph, filters, legend, node detail panel, key-players ranking
- `src/components/layout` — sidebar, topbar, command palette (⌘K)
- `src/components/evidence` — AI extraction review modal
- `src/pages` — one file per route (Login, Dashboard, Cases, Case Workspace, Network Explorer, Entity Registry/Profile, AI Insights, Evidence Intake, Reports, Settings)
- `src/context/AuthContext.tsx`, `src/lib/api.ts`, `src/components/auth` — frontend side of sign-in (session, route protection, 2FA UI)
- `admin/index.html`, `src/admin/` — the admin console (its own sign-in, pages and styling; it reuses the shared components and talks to `/api/admin`)
- `src/components/settings/AccessPanel.tsx` — the investigator's Access tab (current level, request form, history)
- `server/` — the API (see *Backend* above)
- `server/dataset/` — the ten real cases: `cases.ts`, `entities.ts`, `relationships.ts`, `events.ts`, `evidence.ts`, `social.ts` (generated, see *Social media intelligence*), and `build.ts` (helpers that build entities, risk factors and Commons image links). `checkDataset()` runs at start-up and logs anything inconsistent (duplicate ids, or links, events and documents that point at something that doesn't exist). Risk scores are always worked out from their `riskFactors`, so a score can't disagree with its reasons.

## Notes for extending this

- To add a case, add its records under `server/dataset/` and follow the shapes in `src/types`. Give each entity a risk score made of `riskFactors` (label, points, detail) so the page can explain it, and a source link for every claim. Restart the server; the rest of the app (graph, centrality ranking, entity profiles, alerts, tables) needs no changes.
- Only add pictures that are openly licensed (Wikimedia Commons), with their credit and licence. The server's Content-Security-Policy allows images from `upload.wikimedia.org`, `thumb.wikimedia.org` and `commons.wikimedia.org` and nowhere else; change `img-src` in `server/index.ts` if you use another source.
- The app needs the API for sign-in and for the case data, so it cannot be hosted as a static site; follow [DEPLOY.md](DEPLOY.md).
