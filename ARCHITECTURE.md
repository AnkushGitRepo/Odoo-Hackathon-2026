# ARCHITECTURE.md — TransitOps

## System Shape

MERN monorepo (npm workspaces). React SPA talks to an Express REST API; Mongoose models
MongoDB. In dev, Vite proxies `/api/*` to the server, so the client code never hardcodes hosts.

```
client (Vite React SPA, :5173)
   │  axios, JWT in Authorization header
   ▼
server (Express, :5000)
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

## REST API (all JSON, envelope `{ success, data?, error? }`)

```
POST   /api/auth/login                 → { token, user }        public
GET    /api/auth/me                                             auth

GET|POST        /api/vehicles          list (filters) | create  FM full; D, FA view
GET|PUT|DELETE  /api/vehicles/:id      read | update | retire
GET    /api/vehicles/dispatchable      AVAILABLE only (rule 2)

GET|POST        /api/drivers                                    FM, SO full
PUT             /api/drivers/:id       incl. status toggle
GET    /api/drivers/assignable         AVAILABLE + valid license (rule 3)

GET|POST        /api/trips                                      D full; SO view
POST   /api/trips/:id/dispatch         rules 2-6, atomic
POST   /api/trips/:id/complete         rule 7 (+ odometer, fuel, revenue)
POST   /api/trips/:id/cancel           rule 8

GET|POST        /api/maintenance       rule 9 on create         FM full
POST   /api/maintenance/:id/close      rule 10

GET|POST        /api/fuel-logs                                  FA full
GET|POST        /api/expenses                                   FA full

GET    /api/dashboard/kpis             counts + utilization     all roles
GET    /api/analytics                  efficiency, cost, ROI    FM view, FA full
GET    /api/analytics/export.csv       CSV download
```

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

## RBAC (spec = mockup screen 8; enforced by `requireRole` middleware)

| Role | Fleet | Drivers | Trips | Fuel/Exp | Analytics | Maintenance | Dashboard |
|---|---|---|---|---|---|---|---|
| Fleet Manager | full | full | – | – | view | full | view |
| Dispatcher | view | – | full | – | – | – | view |
| Safety Officer | – | full | view | – | – | – | view |
| Financial Analyst | view | – | – | full | full | – | view |

`can(role, module) → "full" | "view" | null`, defined once on the server and mirrored in
`client/src/lib/rbac.ts` (client copy only drives nav visibility; server is authoritative).

## Derived Metrics (computed in `server/src/lib/metrics.ts`, no stored aggregates)

- **Operational cost** (per vehicle) = Σ FuelLog.cost + Σ MaintenanceLog.cost
- **Fuel efficiency** = Σ trip distance (completed) / Σ fuelUsedL
- **Fleet utilization** = ON_TRIP / (total − RETIRED)
- **Vehicle ROI** = (Σ trip revenue − operational cost) / acquisitionCost

## Key Decisions

See [docs/DECISIONS.md](./docs/DECISIONS.md). Highlights: MERN over Next.js (team choice,
D-010), Mongoose over Prisma/native driver (D-011), role as enum on User, rules centralized
in `server/src/lib/rules.ts`.
