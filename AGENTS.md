# AGENTS.md — Operating Guide for AI Coding Agents

This file is the single source of truth for **any** AI agent working in this repo
(Claude Code, Antigravity/Gemini, Cursor, etc.). Read this fully before writing code.

## Project

TransitOps: fleet operations platform (vehicles, drivers, trips, maintenance, fuel/expenses, analytics)
with RBAC. 8-hour hackathon; two developers pushing hourly to `main`.

## Before You Start — Every Session

1. `git pull origin main` — teammate commits hourly; never work on a stale tree.
2. Read `docs/TASKS.md` — check which modules are owned by whom. **Do not edit files owned by the other member without coordinating.**
3. Read `docs/DECISIONS.md` — decisions there are settled; do not re-litigate them.
4. After each work block: append a line to `docs/AGENT_LOG.md`, commit with a conventional message, push.

## Stack & Commands

MERN monorepo (npm workspaces): **client/** Vite + React 19 + TypeScript + Tailwind v4 + React Router,
**server/** Express 4 + TypeScript + Mongoose 8 + JWT auth. Charts: Recharts. Animations: GSAP.

- `npm install` (root) — installs both workspaces
- `npm run dev` (root) — server (:5000) + client (:5173, proxies `/api` → server) via concurrently
- `npm run build` (root) — **must pass before every push**
- `npm run seed` — reset demo data (`server/src/seed.ts`)
- Env: copy `.env.example` → `server/.env` (`MONGODB_URI`, `JWT_SECRET`)

## Repository Map

```
client/src/
  pages/            # one folder per screen: login, dashboard, fleet, drivers, trips,
                    #   maintenance, expenses, analytics, settings
  components/       # shared UI (layout/sidebar/topbar, table, dialog, badge, kpi-card)
  lib/
    api.ts          # axios instance (JWT header) + typed API helpers
    auth.tsx        # AuthContext: user, role, login/logout
    rbac.ts         # role → module permission matrix (mirrors server)
    types.ts        # shared entity types + status unions (mirrors server models)
server/src/
  models/           # Mongoose schemas: User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense
  routes/           # Express routers per module: auth, vehicles, drivers, trips,
                    #   maintenance, expenses, analytics
  middleware/       # requireAuth (JWT), requireRole (RBAC)
  lib/rules.ts      # ALL business rules (pure functions) — see below
  seed.ts           # demo data (mirrors design/mockup.svg examples)
design/mockup.svg   # Excalidraw mockup of all 9 screens
```

## Non-Negotiable Conventions

1. **Business rules live ONLY in `server/src/lib/rules.ts`** as pure functions. Routes call
   them; never duplicate a rule inline. The client may pre-check for UX (e.g. live capacity
   warning) but the server is the authority.
2. **All writes validated with Zod** at the route boundary; reject before touching the DB.
3. **Status transitions are atomic** — trip dispatch/complete/cancel and maintenance
   open/close update trip + vehicle + driver together (Mongoose transactions when the
   cluster supports them — Atlas does; otherwise ordered writes with rollback).
4. **Status strings are shared constants** in `server/src/models` and mirrored in
   `client/src/lib/types.ts` (`"AVAILABLE" | "ON_TRIP" | ...`). Never hardcode ad-hoc strings.
5. **API envelope**: `{ success: boolean, data?: T, error?: string }` on every endpoint.
6. **RBAC enforced server-side** via `requireRole` middleware; the client only hides nav.
   The permission matrix in DESIGN.md §8 / ARCHITECTURE.md is the spec.
7. Small files (<300 lines), typed props, no `any`. Immutable patterns — no in-place mutation.
8. UI must match `DESIGN.md` (screen-by-screen spec) and be responsive (mobile drawer nav).

## The 10 Mandatory Business Rules (judges test these)

1. `registrationNumber` unique (unique index + friendly duplicate error)
2. Dispatch vehicle pool = status `AVAILABLE` only (never Retired/In Shop)
3. Driver pool excludes expired license + `SUSPENDED`
4. No double-booking: `ON_TRIP` vehicle/driver not selectable
5. `cargoWeightKg <= vehicle.maxLoadCapacityKg` — block dispatch with explicit message
6. Dispatch → vehicle & driver `ON_TRIP`
7. Complete → both `AVAILABLE`, capture end odometer + fuel
8. Cancel dispatched trip → both `AVAILABLE`
9. Maintenance record `ACTIVE` → vehicle `IN_SHOP`
10. Maintenance closed → vehicle `AVAILABLE` unless `RETIRED`

## Git Workflow

- Work directly on `main` (hackathon rule: latest code on main, hourly pushes).
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- Each member commits their **own** work under their own git identity (contribution scoring).
- Before push: `npm run build` must succeed. Never push broken builds — teammate pulls hourly.
- Pull before starting; if conflict, the module owner in `docs/TASKS.md` wins.
