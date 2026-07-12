# Task Board

Tasks are unowned — whoever picks one up marks it `doing` with their name, pushes the doc
change immediately (so the other member sees the claim), and moves it to `done` when merged
to `main` with a green build. Backend tasks come first; the frontend codes against the
**API Contract in AGENTS.md**, which is final once backend work starts.

## Backend (do first)

| ID | Task | Status |
|---|---|---|
| B1 | Mongoose models + status-enum constants (User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense) | todo |
| B2 | Auth: `POST /auth/login`, `GET /auth/me`, JWT issue/verify, `requireAuth` + `requireRole` middleware | todo |
| B3 | Vehicles routes: list/filters, `dispatchable`, get+cost summary, create (409 dup), update guards, soft retire | todo |
| B4 | Drivers routes: list/filters, `assignable` (license validity), create (409 dup), update + status guards | todo |
| B5 | `lib/rules.ts` — all 10 business rules as pure functions + unit-testable error objects | todo |
| B6 | Trips routes: create draft, edit draft, dispatch/complete/cancel with atomic status transitions + auto FuelLog on complete | todo |
| B7 | Maintenance routes: create (vehicle → IN_SHOP), close (→ AVAILABLE unless RETIRED) | todo |
| B8 | Fuel logs + expenses routes + `/expenses/summary` per-vehicle operational cost | todo |
| B9 | Dashboard KPIs + analytics endpoints + CSV export (`lib/metrics.ts`) | todo |
| B10 | Seed script: 4 users, ~8 vehicles, ~6 drivers (1 expired license, 1 suspended), trips/logs matching mockup data | todo |

## Frontend (after backend; contract in AGENTS.md is the spec)

| ID | Task | Status |
|---|---|---|
| F1 | `lib/api.ts` (axios + JWT interceptor + envelope unwrap), `lib/types.ts` (mirror contract), `lib/rbac.ts`, AuthContext + protected routes | todo |
| F2 | Login page (per DESIGN.md §0) with error state | todo |
| F3 | App shell: responsive sidebar (RBAC-filtered) + topbar + status badge components | todo |
| F4 | Dashboard: 7 KPI cards, filters, recent trips table, status donut | todo |
| F5 | Fleet page: vehicle table, add/edit dialog, filters, search, retire action | todo |
| F6 | Drivers page: table with expiry badge, add/edit dialog, status toggle | todo |
| F7 | Trips page: lifecycle stepper, create form with live capacity check, live board with dispatch/complete/cancel actions | todo |
| F8 | Maintenance page: service record form + log table + close action | todo |
| F9 | Fuel & Expenses page: both tables, add dialogs, operational cost banner | todo |
| F10 | Analytics page: 4 KPI cards, revenue chart, costliest vehicles, CSV export button | todo |
| F11 | Settings page: general form + RBAC matrix display | todo |

## Polish (last)

| ID | Task | Status |
|---|---|---|
| P1 | Responsive/mobile pass on all pages | todo |
| P2 | GSAP animations (login, KPI count-up) + dark mode | todo |
| P3 | E2E smoke of the Section-5 example workflow (agent-browser) | todo |
| P4 | Fresh-clone test + README demo script | todo |

## Teammate Onboarding (Antigravity)

1. Clone, `npm install` (root — installs client + server workspaces), copy `.env.example` → `server/.env`, get `MONGODB_URI` + `JWT_SECRET` from Ankush.
2. `npm run seed && npm run dev` (API :5000, client :5173).
3. Read `AGENTS.md` fully (agent guide + **binding API contract**), then `ARCHITECTURE.md` and `DESIGN.md` for your screens.
4. Commit hourly to `main` under your own git identity; `npm run build` before every push.
