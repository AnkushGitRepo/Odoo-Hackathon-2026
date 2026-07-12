# TransitOps — Smart Transport Operations Platform

End-to-end transport operations platform that digitizes **vehicle, driver, dispatch, maintenance, and expense management** with enforced business rules and operational analytics.

Built in 8 hours for the Odoo Hackathon 2026.

## Tech Stack (MERN)

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (Atlas) via Mongoose |
| Auth | JWT (email/password, bcrypt) + role-based access control |
| Charts | Recharts |
| Animations | GSAP |

## Quick Start

```bash
# 1. Install dependencies (both workspaces)
npm install

# 2. Configure environment
cp .env.example server/.env
# Set MONGODB_URI (MongoDB Atlas free tier or local mongod)
# Set JWT_SECRET (generate with: openssl rand -base64 32)

# 3. Seed demo data
npm run seed

# 4. Run (starts API on :5001 and client on :5173)
npm run dev
```

Open http://localhost:5173

## Demo Logins (after seeding)

| Role | Email | Password |
|---|---|---|
| Fleet Manager | manager@transitops.in | password123 |
| Dispatcher | dispatcher@transitops.in | password123 |
| Safety Officer | safety@transitops.in | password123 |
| Financial Analyst | finance@transitops.in | password123 |

## Features

- **Auth + RBAC** — email/password login; four roles with scoped module access
- **Dashboard** — KPI cards (active/available/in-maintenance vehicles, active/pending trips, drivers on duty, fleet utilization %) with type/status/region filters
- **Vehicle Registry** — CRUD with unique registration numbers, capacity, odometer, acquisition cost, status lifecycle (Available / On Trip / In Shop / Retired)
- **Driver Management** — profiles with license category/expiry, safety score, status lifecycle (Available / On Trip / Off Duty / Suspended)
- **Trip Dispatcher** — Draft → Dispatched → Completed / Cancelled lifecycle with validated vehicle/driver pools and cargo-capacity enforcement
- **Maintenance** — service records auto-move vehicles In Shop and back
- **Fuel & Expenses** — fuel logs, tolls/misc expenses, auto-computed operational cost per vehicle
- **Analytics** — fuel efficiency (km/L), fleet utilization, operational cost, vehicle ROI, CSV export

## Business Rules (enforced server-side in `server/src/lib/rules.ts`)

1. Vehicle registration number is unique
2. Retired / In Shop vehicles never appear in dispatch selection
3. Drivers with expired licenses or Suspended status cannot be assigned
4. A vehicle/driver already On Trip cannot be double-booked
5. Cargo weight ≤ vehicle max load capacity
6. Dispatch ⇒ vehicle + driver become **On Trip**
7. Complete ⇒ both return to **Available** (odometer + fuel captured)
8. Cancel dispatched trip ⇒ both restored to **Available**
9. Active maintenance record ⇒ vehicle **In Shop**
10. Closing maintenance ⇒ vehicle **Available** (unless Retired)

## Project Docs

- [AGENTS.md](./AGENTS.md) — operating guide for AI coding agents (Claude Code / Antigravity)
- [ARCHITECTURE.md](./ARCHITECTURE.md) — entities, REST API, state machines, RBAC matrix
- [DESIGN.md](./DESIGN.md) — screen-by-screen UI spec from the Excalidraw mockup
- [docs/DECISIONS.md](./docs/DECISIONS.md) — decision log
- [docs/TASKS.md](./docs/TASKS.md) — live task split between team members
- [docs/AGENT_LOG.md](./docs/AGENT_LOG.md) — per-session agent work log

## Team

- Ankush Gupta ([@AnkushGitRepo](https://github.com/AnkushGitRepo), ankushgupta1806@gmail.com) — Claude Code
- Dev Panchal — Antigravity

Both members commit hourly to `main` per hackathon rules.
