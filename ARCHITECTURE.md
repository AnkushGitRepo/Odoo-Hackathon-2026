# ARCHITECTURE.md — TransitOps

## System Shape

MERN monorepo (npm workspaces). React SPA talks to an Express REST API; Mongoose models
MongoDB. In dev, Vite proxies `/api/*` to the server, so the client code never hardcodes hosts.

```
client (Vite React SPA, :5173)
   │  axios, JWT in Authorization header
   ▼
server (Express, :5001)
   ├─ middleware: requireAuth (JWT verify) → requireRole (RBAC)
   ├─ routes/* : Zod-validate input → lib/rules.ts (business rules) → models
   └─ Mongoose ──► MongoDB (Atlas)
```

## Entities (server/src/models)

| Model | Key fields | Notes |
|---|---|---|
| **User** | email (unique), passwordHash, name, role | role: `FLEET_MANAGER` \| `DISPATCHER` \| `SAFETY_OFFICER` \| `FINANCIAL_ANALYST` (string enum — no separate Roles collection) |
| **Vehicle** | registrationNumber (unique index), name, type (VAN/TRUCK/MINI/BIKE), maxLoadCapacityKg, odometerKm, acquisitionCost, region, status | status: `AVAILABLE` \| `ON_TRIP` \| `IN_SHOP` \| `RETIRED` |
| **Driver** | name, licenseNumber (unique), licenseCategory (LMV/HMV), licenseExpiry (Date), contact, safetyScore, tripCompletionRate, status | status: `AVAILABLE` \| `ON_TRIP` \| `OFF_DUTY` \| `SUSPENDED` |
| **Trip** | code (TR001…), source, destination, vehicleId?, driverId?, cargoWeightKg, plannedDistanceKm, status, revenue?, startOdometer?, endOdometer?, fuelUsedL?, dispatchedAt?, completedAt? | status: `DRAFT` \| `DISPATCHED` \| `COMPLETED` \| `CANCELLED` |
| **MaintenanceLog** | vehicleId, serviceType, cost, date, status | status: `ACTIVE` \| `COMPLETED`; open/close drives vehicle status |
| **FuelLog** | vehicleId, tripId?, liters, cost, date | feeds fuel efficiency + operational cost |
| **Expense** | tripId?, vehicleId, category (`TOLL` \| `MISC`), amount, date, note? | maintenance cost is **not** duplicated here — read from MaintenanceLog |

## REST API

**The complete, binding endpoint contract (request/response shapes, error codes, RBAC per
endpoint) lives in [AGENTS.md — API CONTRACT](./AGENTS.md).** It is maintained there and only
there so the backend and frontend agents can never diverge. Summary of surface area:
`/api/auth`, `/api/vehicles` (+`/dispatchable`), `/api/drivers` (+`/assignable`), `/api/trips`
(+`/dispatch`, `/complete`, `/cancel`), `/api/maintenance` (+`/close`), `/api/fuel-logs`,
`/api/expenses` (+`/summary`), `/api/dashboard/kpis`, `/api/analytics` (+`/export.csv`).

## State Machines

```
Vehicle: AVAILABLE ⇄ ON_TRIP        (dispatch / complete·cancel)
         AVAILABLE ⇄ IN_SHOP        (maintenance open / close)
         any ──► RETIRED            (manual, terminal)

Driver:  AVAILABLE ⇄ ON_TRIP        (dispatch / complete·cancel)
         AVAILABLE ⇄ OFF_DUTY       (manual toggle)
         any ⇄ SUSPENDED            (safety officer)

Trip:    DRAFT ──► DISPATCHED ──► COMPLETED
                        └────────► CANCELLED   (restores vehicle+driver)
           └──► CANCELLED (draft cancel: no status side effects)
```

Multi-document transitions (dispatch/complete/cancel, maintenance open/close) are atomic:
Mongoose transactions on Atlas (replica set); fallback is ordered writes with compensating
rollback if a step fails.

## RBAC

Enforced by `requireRole` middleware; the authoritative matrix lives in
[AGENTS.md — RBAC Matrix](./AGENTS.md) (writes strictly scoped per the mockup, reads broadly
shared — see D-016). `can(role, module) → "full" | "view" | null`, defined once on the server
and mirrored in `client/src/lib/rbac.ts` (client copy only drives nav visibility).

## Derived Metrics (computed in `server/src/lib/metrics.ts`, no stored aggregates)

- **Operational cost** (per vehicle) = Σ FuelLog.cost + Σ MaintenanceLog.cost
- **Fuel efficiency** = Σ trip distance (completed) / Σ fuelUsedL
- **Fleet utilization** = ON_TRIP / (total − RETIRED)
- **Vehicle ROI** = (Σ trip revenue − operational cost) / acquisitionCost

## Key Decisions

See [docs/DECISIONS.md](./docs/DECISIONS.md). Highlights: MERN over Next.js (team choice,
D-010), Mongoose over Prisma/native driver (D-011), role as enum on User, rules centralized
in `server/src/lib/rules.ts`.
