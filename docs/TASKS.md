
# Task Board

Build approach (D-019): **page by page** — landing → auth → basic dashboard → one module page
at a time. Each page ships as a vertical slice (its backend routes + its UI) styled with the
`impeccable` + `design-taste-frontend` skills and GSAP, per DESIGN.md and the binding API
contract in AGENTS.md.

Members: **Ankush Gupta** (Claude Code) · **Dev Panchal** (Antigravity).
Owner column is the agreed split — statuses: `todo → doing → done`. Update this file and push
when you start/finish a task. If you take over an unowned/blocked task, write your name in.

## Phase 1 — Landing, Auth, Basic Dashboard

| ID | Task | Owner | Status |
|---|---|---|---|
| T1 | Landing page `/` (hero, floating preview cards, feature grid, roles strip — DESIGN.md §L) with GSAP | Ankush | done |
| T2 | Auth backend: User model, `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `requireAuth` + `requireRole` | Ankush | done |
| T3 | Client auth plumbing: `lib/api.ts` (axios + JWT + envelope unwrap), `lib/types.ts`, `lib/rbac.ts`, AuthContext, protected routes | Ankush | done |
| T4 | Signup + Login pages per DESIGN.md §0 (split layout, role select on signup, error states) | Ankush | done |
| T5 | Core Mongoose models: Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense + enum constants | Dev | done |
| T6 | Seed script: 4 users, ~8 vehicles, ~6 drivers (1 expired license, 1 suspended), sample trips/logs | Dev | done |
| T7 | `GET /api/dashboard/kpis` endpoint (per contract) | Dev | done |
| T8 | App shell: responsive sidebar (RBAC-filtered) + topbar + badge/kpi-card components | Ankush | done |
| T9 | Basic dashboard page: KPI cards + recent trips (filters + donut can wait) | Ankush | done |

## Phase 2 — Module pages

Split so neither of us blocks the other: Ankush's M1 gives Dev the vehicle picker data
his M4/M5 forms need, but Dev's M2/M4/M5/M6 are all buildable directly against the
Mongoose models already shipped in T5 — no need to wait on Ankush's routes to start.

| ID | Page slice (backend routes + UI) | Owner | Status |
|---|---|---|---|
| M1 | Fleet / Vehicle Registry (`/api/vehicles` + `/fleet`) | Ankush | done |
| M2 | Drivers (`/api/drivers` + `/drivers`) | Dev | done |
| M3 | Trips + rules engine (`lib/rules.ts`, `/api/trips` + `/trips`) | Ankush | done |
| M4 | Maintenance (`/api/maintenance` + `/maintenance`) | Dev | done |
| M5 | Fuel & Expenses (`/api/fuel-logs`, `/api/expenses` + `/expenses`) | Dev | done |
| M6 | Analytics + CSV (`/api/analytics` + `/analytics`) | Dev | done |
| M7 | Dashboard finishers: filters, status donut | Ankush | done |
| M8 | Settings page (general + RBAC matrix display) | Ankush | done |

Dev's detailed task prompt: [docs/PROMPT_DEV_PHASE2.md](./PROMPT_DEV_PHASE2.md).

## Phase 3 — Polish & Launch Readiness

All M1-M8 module slices are done. Phase 3 is the final pass before the hackathon deadline:
a real regression to fix, dark mode finished on every page, a responsive pass, an end-to-end
correctness check, and a fresh-clone dry run so the judges' first `npm install` doesn't fail.

Split so neither of us touches the other's files: Ankush owns the shared shell/infra plus his
own pages (Landing, Auth, Dashboard, Fleet, Trips, Settings) and the two whole-system checks
(E2E smoke, fresh-clone test). Dev owns dark mode + responsive on his own four pages (Drivers,
Maintenance, Expenses, Analytics), using the exact convention Ankush already shipped on his
pages — copy the pattern, no invention needed.

Detailed, fully self-contained prompts (everything needed with zero back-and-forth):
- Ankush: [docs/PROMPT_ANKUSH_PHASE3.md](./PROMPT_ANKUSH_PHASE3.md)
- Dev: [docs/PROMPT_DEV_PHASE3.md](./PROMPT_DEV_PHASE3.md)

| ID | Task | Owner | Status |
|---|---|---|---|
| N1 | **Fix regression**: `/api/trips` returns 404 — trips router got dropped from `server/src/index.ts` (likely lost in the M2/M4/M5/M6 merge); restore the mount, full re-verification | Ankush | done |
| N2 | Dark mode — shared infra (toggle, `useTheme`, Tailwind `@custom-variant dark`, AppShell/Modal/StatusBadge tokens) + Ankush's own pages (Dashboard, Fleet, Trips + subcomponents, Settings). Landing/Auth stay light per DESIGN.md | Ankush | done |
| N3 | Dark mode — Dev's four pages (Drivers, Maintenance, Expenses, Analytics), same convention as N2 | Dev | doing |
| N4 | Responsive/mobile pass — Ankush's pages (Landing, Login/Signup, Dashboard, Fleet, Trips, Settings) | Ankush | todo |
| N5 | Responsive/mobile pass — Dev's pages (Drivers, Maintenance, Expenses, Analytics) | Dev | doing |
| N6 | E2E smoke test of the full Section-5 example workflow (register vehicle → driver → trip → dispatch → complete → maintenance → analytics), documented as a repeatable script | Ankush | todo |
| N7 | Fresh-clone test (simulate a judge's first clone: `npm install`, seed, run) + polish README with a demo script for judges | Ankush | todo |
| N8 | *Optional stretch, only if time remains*: license-expiry reminder banner on the Drivers page (bonus feature from the hackathon brief — UI banner only, no real email service) | Dev | todo |

## Polish (superseded)

The four generic tasks below are superseded by the detailed N1-N8 breakdown above; kept only
for history.

| ID | Task | Owner | Status |
|---|---|---|---|
| P1 | Responsive/mobile pass on all pages | — | superseded by N4/N5 |
| P2 | Dark mode (app pages) + remaining GSAP micro-interactions | — | superseded by N2/N3 |
| P3 | E2E smoke of the Section-5 example workflow (agent-browser) | — | superseded by N6 |
| P4 | Fresh-clone test + README demo script | — | superseded by N7 |

## Dev Panchal Onboarding (Antigravity)

1. Clone `git@github.com:AnkushGitRepo/Odoo-Hackathon-2026.git`, `npm install` (root — installs client + server workspaces).
2. Copy `.env.example` → `server/.env`; get `MONGODB_URI` + `JWT_SECRET` from Ankush.
3. `npm run seed && npm run dev` (API :5001, client :5173).
4. Read `AGENTS.md` fully (agent guide + **binding API contract**), then `DESIGN.md` (your pages) and `ARCHITECTURE.md`.
5. Commit hourly to `main` under your own git identity (`git config user.name/user.email` before first commit!); `npm run build` before every push.
