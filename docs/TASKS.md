# Task Board & Module Ownership

Rule: **don't edit files in a module owned by the other member without a quick sync.**
Update status here as you go (`todo → doing → done`). Shared files (schema.prisma, rules.ts,
rbac.ts) — announce in team chat before editing.

## Ownership Split

| Module | Owner | Status |
|---|---|---|
| Phase 0: scaffold, docs, repo | Ankush | doing |
| Phase 1: schema + seed + auth + shell | Ankush | todo |
| Phase 2a: Vehicle Registry (`/fleet`) | Ankush | todo |
| Phase 2b: Drivers (`/drivers`) | Teammate | todo |
| Phase 3: Trips + rules engine (`/trips`, `lib/rules.ts`) | Ankush | todo |
| Phase 4a: Maintenance (`/maintenance`) | Teammate | todo |
| Phase 4b: Fuel & Expenses (`/expenses`) | Teammate | todo |
| Phase 5a: Dashboard (`/dashboard`) | Ankush | todo |
| Phase 5b: Analytics + CSV (`/analytics`) | Teammate | todo |
| Phase 6: polish, dark mode, GSAP, E2E | both | todo |

## Teammate Onboarding (Antigravity)

1. Clone, `npm install` (root — installs client + server workspaces), copy `.env.example` → `server/.env`, get `MONGODB_URI` + `JWT_SECRET` from Ankush.
2. `npm run seed && npm run dev` (API :5000, client :5173).
3. Read `AGENTS.md` (agent guide), `ARCHITECTURE.md` (REST API + models), `DESIGN.md` for your screens.
4. Commit hourly to `main` under your own git identity; `npm run build` before every push.
