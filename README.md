# NexusTrace — AI-Powered Criminal Network Analysis System

Prototype for **SIH26189** (Ministry of Home Affairs — Blockchain & Cybersecurity theme). A dark, intelligence-platform-style web app for investigators to explore entities (people, phones, vehicles, organizations, locations, financial accounts), their relationships, AI-flagged suspicious patterns, and case timelines through an interactive network graph.

All data is synthetic and fictional, defined in `src/data/`.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`). The login screen accepts any input — click **Sign In**.

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
- `src/pages` — one file per route (Dashboard, Cases, Case Workspace, Network Explorer, Entity Registry/Profile, AI Insights, Evidence Intake, Reports)

## Notes for extending this

- To add real data, replace the arrays in `src/data/*.ts` — the rest of the app (graph, centrality ranking, entity profiles, tables) reads from those and needs no changes as long as the shapes in `src/types` are respected.
- The AI extraction / suspicious-pattern features are simulated (deterministic mock results in `src/data/extractions.ts` and `src/data/alerts.ts`) — wire these to a real NLP/ML backend by replacing those data sources with API calls.
- `npm run build` produces a static `dist/` bundle deployable to any static host (Vercel, Netlify, GitHub Pages).
