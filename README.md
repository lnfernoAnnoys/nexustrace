# NexusTrace — AI-Powered Criminal Network Analysis System

Prototype for **SIH26189** (Ministry of Home Affairs — Blockchain & Cybersecurity theme). A dark, intelligence-platform-style web app for investigators to explore entities (people, phones, vehicles, organizations, locations, financial accounts), their relationships, AI-flagged suspicious patterns, and case timelines through an interactive network graph.

All data is synthetic and fictional, defined in `src/data/`.

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

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (`@theme` tokens in `src/index.css` — dark "intelligence ops room" palette)
- Radix UI primitives, hand-styled to match the theme (`src/components/ui`)
- `react-force-graph-2d` for the network graph (`src/components/graph/NetworkGraph.tsx`)
- Recharts for dashboard analytics, Framer Motion for transitions
- React Router for navigation

## Structure

- `src/types` — shared TypeScript interfaces (entities, relationships, cases, events, alerts, evidence)
- `src/data` — synthetic dataset (4 cases, ~57 entities, ~70 relationships, events, alerts, evidence) plus helper functions (`computeCentrality`, `findShortestPath`, per-case lookups)
- `src/components/graph` — the network graph, filters, legend, node detail panel, key-players ranking
- `src/components/layout` — sidebar, topbar, command palette (⌘K)
- `src/components/evidence` — AI extraction review modal
- `src/pages` — one file per route (Login, Dashboard, Cases, Case Workspace, Network Explorer, Entity Registry/Profile, AI Insights, Evidence Intake, Reports, Settings)
- `src/context/AuthContext.tsx`, `src/lib/api.ts`, `src/components/auth` — frontend side of sign-in (session, route protection, 2FA UI)
- `admin/index.html`, `src/admin/` — the admin console (its own sign-in, pages and styling; it reuses the shared components and talks to `/api/admin`)
- `src/components/settings/AccessPanel.tsx` — the investigator's Access tab (current level, request form, history)
- `server/` — the API (see *Backend* above); case, entity and alert data is still the built-in sample data in `src/data`

## Notes for extending this

- To add real data, replace the arrays in `src/data/*.ts` — the rest of the app (graph, centrality ranking, entity profiles, tables) reads from those and needs no changes as long as the shapes in `src/types` are respected.
- The AI extraction / suspicious-pattern features are simulated (deterministic mock results in `src/data/extractions.ts` and `src/data/alerts.ts`) — wire these to a real NLP/ML backend by replacing those data sources with API calls.
- `npm run build` produces a static `dist/` bundle deployable to any static host (Vercel, Netlify, GitHub Pages).
