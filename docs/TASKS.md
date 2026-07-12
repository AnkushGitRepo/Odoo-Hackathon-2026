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
| M7 | Dashboard finishers: filters, status donut | Ankush | todo |
| M8 | Settings page (general + RBAC matrix display) | Ankush | todo |

Dev's detailed task prompt: [docs/PROMPT_DEV_PHASE2.md](./PROMPT_DEV_PHASE2.md).

## Polish (last)

| ID | Task | Owner | Status |
|---|---|---|---|
| P1 | Responsive/mobile pass on all pages | — | todo |
| P2 | Dark mode (app pages) + remaining GSAP micro-interactions | — | todo |
| P3 | E2E smoke of the Section-5 example workflow (agent-browser) | — | todo |
| P4 | Fresh-clone test + README demo script | — | todo |

## Dev Panchal Onboarding (Antigravity)

1. Clone `git@github.com:AnkushGitRepo/Odoo-Hackathon-2026.git`, `npm install` (root — installs client + server workspaces).
2. Copy `.env.example` → `server/.env`; get `MONGODB_URI` + `JWT_SECRET` from Ankush.
3. `npm run seed && npm run dev` (API :5001, client :5173).
4. Read `AGENTS.md` fully (agent guide + **binding API contract**), then `DESIGN.md` (your pages) and `ARCHITECTURE.md`.
5. Commit hourly to `main` under your own git identity (`git config user.name/user.email` before first commit!); `npm run build` before every push.
