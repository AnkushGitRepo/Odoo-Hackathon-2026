# AGENTS.md — Operating Guide for AI Coding Agents

This file is the single source of truth for **any** AI agent working in this repo
(Claude Code, Antigravity/Gemini, Cursor, etc.). Read this fully before writing code.

The **API Contract** section below is binding: the backend is built first and must implement
it exactly; the frontend is built second and must code against it without guessing. If the
contract must change, change it HERE first, log it in `docs/DECISIONS.md`, then change code.

## Project

TransitOps: fleet operations platform (vehicles, drivers, trips, maintenance, fuel/expenses,
analytics) with RBAC. 8-hour hackathon; two developers pushing hourly to `main`.

## Build Order

**Backend first, then frontend.** Full sequence in `docs/TASKS.md`. While backend work is in
progress, frontend agents can rely on this contract as final.

## Before You Start — Every Session

1. `git pull origin main` — teammate commits hourly; never work on a stale tree.
2. Read `docs/TASKS.md` — pick a `todo` task, mark it `doing` (with your name), push the doc change so the other member sees it.
3. Read `docs/DECISIONS.md` — decisions there are settled; do not re-litigate them.
4. **On every major decision or change: append to `docs/DECISIONS.md` (what + why) and `docs/AGENT_LOG.md` (who + when).** This is mandatory, not optional.
5. After each work block: update `docs/TASKS.md` status, append to `docs/AGENT_LOG.md`, commit, push.

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
    types.ts        # entity types + status unions (MUST mirror this contract)
server/src/
  models/           # Mongoose schemas: User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense
  routes/           # Express routers: auth, vehicles, drivers, trips, maintenance,
                    #   fuel-logs, expenses, dashboard, analytics
  middleware/       # requireAuth (JWT), requireRole (RBAC)
  lib/rules.ts      # ALL business rules (pure functions)
  lib/metrics.ts    # derived metrics (KPIs, ROI, efficiency)
  seed.ts           # demo data (mirrors design/mockup.svg examples)
design/mockup.svg   # Excalidraw mockup of all 9 screens
```

---

# API CONTRACT (binding)

## Conventions

- Base URL: `/api` (Vite dev proxy → `http://localhost:5000`).
- Every response uses the envelope:
  ```ts
  { success: true,  data: T }                                  // 2xx
  { success: false, error: string, code: string, details?: object } // 4xx/5xx
  ```
  `error` is a human-readable sentence for direct display in the UI. `code` is a stable
  machine string (listed per endpoint below). `details` carries numbers the UI can render
  (e.g. capacity breakdown).
- Auth: `Authorization: Bearer <jwt>` on every endpoint except `POST /api/auth/login`.
  Missing/invalid token → `401 { code: "UNAUTHORIZED" }`. Wrong role → `403 { code: "FORBIDDEN" }`.
- Validation: Zod on every write; failures → `400 { code: "VALIDATION", error: "<first issue>", details: { issues } }`.
- Unknown id → `404 { code: "NOT_FOUND" }`. Duplicate unique field → `409` (codes below).
- All dates are ISO-8601 strings (`"2026-07-12T09:00:00.000Z"`). All ids are Mongo ObjectId strings in field `_id`.
- Money is a plain number in INR rupees; weights kg; distances km; fuel liters.
- List endpoints return the **full filtered array** (no pagination — hackathon scale, seeded data is small).

## Enums (exact strings — never invent variants)

```ts
type Role          = "FLEET_MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";
type VehicleType   = "VAN" | "TRUCK" | "MINI" | "BIKE";
type VehicleStatus = "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "RETIRED";
type DriverStatus  = "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";
type LicenseCategory = "LMV" | "HMV";
type TripStatus    = "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
type MaintenanceStatus = "ACTIVE" | "COMPLETED";
type ExpenseCategory   = "TOLL" | "MISC";
```

## Entity Shapes (as returned by the API)

```ts
interface User {            // passwordHash is NEVER returned
  _id: string; name: string; email: string; role: Role; createdAt: string;
}

interface Vehicle {
  _id: string;
  registrationNumber: string;   // unique, uppercase, e.g. "GJ01AB4521"
  name: string;                 // e.g. "VAN-05"
  type: VehicleType;
  maxLoadCapacityKg: number;    // > 0
  odometerKm: number;           // >= 0, auto-updated on trip completion
  acquisitionCost: number;      // INR
  region: string;               // free text, e.g. "Gandhinagar"
  status: VehicleStatus;
  createdAt: string; updatedAt: string;
}

interface Driver {
  _id: string;
  name: string;
  licenseNumber: string;        // unique, e.g. "DL-88213"
  licenseCategory: LicenseCategory;
  licenseExpiry: string;        // ISO date; expired ⇒ not assignable
  contact: string;              // phone
  safetyScore: number;          // 0–100
  tripCompletionRate: number;   // 0–100, percentage
  status: DriverStatus;
  createdAt: string; updatedAt: string;
}

interface Trip {
  _id: string;
  code: string;                 // "TR001", server-generated, sequential
  source: string; destination: string;
  vehicle: Vehicle | null;      // POPULATED object (not a bare id), null on unassigned drafts
  driver: Driver | null;        // POPULATED object, null on unassigned drafts
  cargoWeightKg: number;
  plannedDistanceKm: number;
  status: TripStatus;
  revenue: number | null;       // set on completion
  startOdometer: number | null; // snapshot of vehicle odometer at dispatch
  endOdometer: number | null;   // entered on completion
  fuelUsedL: number | null;     // entered on completion
  cancelReason: string | null;
  dispatchedAt: string | null; completedAt: string | null;
  createdAt: string; updatedAt: string;
}

interface MaintenanceLog {
  _id: string;
  vehicle: Vehicle;             // POPULATED
  serviceType: string;          // e.g. "Oil Change"
  cost: number; date: string;
  status: MaintenanceStatus;
  closedAt: string | null;
  createdAt: string;
}

interface FuelLog {
  _id: string;
  vehicle: Vehicle;             // POPULATED
  tripId: string | null;        // set when auto-created by trip completion
  liters: number; cost: number; date: string;
  createdAt: string;
}

interface Expense {
  _id: string;
  vehicle: Vehicle;             // POPULATED
  tripId: string | null;
  category: ExpenseCategory;
  amount: number; date: string; note: string | null;
  createdAt: string;
}
```

## Endpoints

### Auth

| Method & Path | Roles | Purpose |
|---|---|---|
| `POST /api/auth/register` | public | Signup with role selection |
| `POST /api/auth/login` | public | Login |
| `GET /api/auth/me` | any authed | Current user |

**POST /api/auth/register**
Request: `{ name: string, email: string, password: string (min 8), role: Role }`
Role is chosen at signup (hackathon simplification — see D-020); email is trimmed + lowercased.
201: `{ success: true, data: { token: string, user: User } }` — same shape as login; the client is signed in immediately.
409 `DUPLICATE_EMAIL` — "An account with this email already exists."

**POST /api/auth/login**
Request: `{ email: string, password: string }`
200: `{ success: true, data: { token: string, user: User } }` — token is a JWT valid 24h, payload `{ sub: userId, role }`.
401 `INVALID_CREDENTIALS` — "Invalid email or password." (same message for unknown email vs wrong password).
**No role field at login** — role comes from the account (D-007).

**GET /api/auth/me** → 200 `{ data: User }`. Used by the client on refresh to restore session.

### Vehicles

| Method & Path | Roles (write) | Purpose |
|---|---|---|
| `GET /api/vehicles?type=&status=&region=&q=` | any authed | List; all filters optional; `q` matches registrationNumber/name (case-insensitive substring) |
| `GET /api/vehicles/dispatchable` | any authed | **Rule 2/4**: only `status === "AVAILABLE"` |
| `GET /api/vehicles/:id` | any authed | Single vehicle + cost summary |
| `POST /api/vehicles` | FLEET_MANAGER | Create |
| `PUT /api/vehicles/:id` | FLEET_MANAGER | Update (partial body accepted) |
| `DELETE /api/vehicles/:id` | FLEET_MANAGER | **Soft retire** — sets status `RETIRED`, never deletes the document |

**POST /api/vehicles**
Request: `{ registrationNumber: string, name: string, type: VehicleType, maxLoadCapacityKg: number, odometerKm?: number = 0, acquisitionCost: number, region?: string = "" }`
`registrationNumber` is trimmed + uppercased server-side. New vehicles start `status: "AVAILABLE"`.
201: `{ data: Vehicle }` · 409 `DUPLICATE_REGISTRATION` — "A vehicle with registration number GJ01AB4521 already exists."

**PUT /api/vehicles/:id** — any subset of the POST fields plus `status`. Guards:
`status: "ON_TRIP"` cannot be set manually (400 `INVALID_STATUS_CHANGE`); setting `AVAILABLE`
while an ACTIVE maintenance log exists → 400 `VEHICLE_IN_SHOP`.

**GET /api/vehicles/:id**
200: `{ data: { vehicle: Vehicle, costs: { fuelCost: number, maintenanceCost: number, operationalCost: number } } }`
(`operationalCost = fuelCost + maintenanceCost`, computed live from FuelLog + MaintenanceLog).

### Drivers

| Method & Path | Roles (write) | Purpose |
|---|---|---|
| `GET /api/drivers?status=&q=` | any authed | List; `q` matches name/licenseNumber |
| `GET /api/drivers/assignable` | any authed | **Rule 3/4**: `status === "AVAILABLE"` AND `licenseExpiry > now` |
| `GET /api/drivers/:id` | any authed | Single driver |
| `POST /api/drivers` | FLEET_MANAGER, SAFETY_OFFICER | Create |
| `PUT /api/drivers/:id` | FLEET_MANAGER, SAFETY_OFFICER | Update incl. status toggle |

**POST /api/drivers**
Request: `{ name: string, licenseNumber: string, licenseCategory: LicenseCategory, licenseExpiry: string (ISO), contact: string, safetyScore?: number = 100, tripCompletionRate?: number = 100 }`
New drivers start `status: "AVAILABLE"`.
201: `{ data: Driver }` · 409 `DUPLICATE_LICENSE`.

**PUT /api/drivers/:id** — partial update. Status guard: `ON_TRIP` cannot be set manually
(400 `INVALID_STATUS_CHANGE`); a driver currently `ON_TRIP` cannot be edited to another
status until their trip completes/cancels (400 `DRIVER_ON_TRIP`).

### Trips

| Method & Path | Roles (write) | Purpose |
|---|---|---|
| `GET /api/trips?status=&q=` | any authed | List, newest first, vehicle+driver populated |
| `GET /api/trips/:id` | any authed | Single trip |
| `POST /api/trips` | DISPATCHER | Create draft |
| `PUT /api/trips/:id` | DISPATCHER | Edit draft only (400 `TRIP_NOT_DRAFT` otherwise) |
| `POST /api/trips/:id/dispatch` | DISPATCHER | Draft → Dispatched (rules 2–6) |
| `POST /api/trips/:id/complete` | DISPATCHER | Dispatched → Completed (rule 7) |
| `POST /api/trips/:id/cancel` | DISPATCHER | Draft/Dispatched → Cancelled (rule 8) |

**POST /api/trips**
Request: `{ source: string, destination: string, vehicleId?: string, driverId?: string, cargoWeightKg: number, plannedDistanceKm: number }`
Vehicle/driver optional at draft stage (mockup shows drafts "Awaiting vehicle"). If provided,
eligibility + capacity are validated immediately (same errors as dispatch). Server assigns `code`.
201: `{ data: Trip }` (status `DRAFT`).

**POST /api/trips/:id/dispatch**
Request: `{}` — or `{ vehicleId, driverId }` to (re)assign at dispatch time.
Validations in order, each its own error:
1. trip status must be `DRAFT` → else 400 `TRIP_NOT_DRAFT`
2. vehicle+driver must be assigned → 400 `TRIP_UNASSIGNED`
3. vehicle status must be `AVAILABLE` → 400 `VEHICLE_NOT_AVAILABLE`, `details: { vehicleStatus }` (covers Retired/In Shop/On Trip — rules 2 & 4)
4. driver: license valid → 400 `DRIVER_LICENSE_EXPIRED`, `details: { licenseExpiry }`; not suspended → 400 `DRIVER_SUSPENDED`; status `AVAILABLE` → 400 `DRIVER_NOT_AVAILABLE`, `details: { driverStatus }` (rules 3 & 4)
5. capacity (rule 5) → 400 `CAPACITY_EXCEEDED`, error: "Capacity exceeded by 200 kg — dispatch blocked", `details: { capacityKg: 500, cargoWeightKg: 700, excessKg: 200 }`
Success (rule 6, atomic): trip → `DISPATCHED` (+`dispatchedAt`, `startOdometer` = vehicle odometer), vehicle → `ON_TRIP`, driver → `ON_TRIP`.
200: `{ data: Trip }`.

**POST /api/trips/:id/complete**
Request: `{ endOdometer: number, fuelUsedL: number, fuelCost: number, revenue: number }`
Validations: status `DISPATCHED` → 400 `TRIP_NOT_DISPATCHED`; `endOdometer >= startOdometer` → 400 `ODOMETER_INVALID`, `details: { startOdometer }`.
Success (rule 7, atomic): trip → `COMPLETED` (+`completedAt`, `endOdometer`, `fuelUsedL`, `revenue`); vehicle → `AVAILABLE` with `odometerKm = endOdometer`; driver → `AVAILABLE`; a **FuelLog is auto-created** (`{ vehicleId, tripId, liters: fuelUsedL, cost: fuelCost, date: now }`).
200: `{ data: Trip }`.

**POST /api/trips/:id/cancel**
Request: `{ reason?: string }`
Draft → just `CANCELLED`. Dispatched → `CANCELLED` + vehicle & driver restored to `AVAILABLE` (rule 8, atomic). Completed/Cancelled → 400 `TRIP_ALREADY_CLOSED`.
200: `{ data: Trip }`.

### Maintenance

| Method & Path | Roles (write) | Purpose |
|---|---|---|
| `GET /api/maintenance?vehicleId=&status=` | any authed | Service log, newest first, vehicle populated |
| `POST /api/maintenance` | FLEET_MANAGER | Create record (rule 9) |
| `POST /api/maintenance/:id/close` | FLEET_MANAGER | Close record (rule 10) |

**POST /api/maintenance**
Request: `{ vehicleId: string, serviceType: string, cost: number, date?: string = now }`
Guards: vehicle `ON_TRIP` → 400 `VEHICLE_ON_TRIP` ("Complete or cancel its trip first.");
vehicle `RETIRED` → 400 `VEHICLE_RETIRED`; vehicle already has an ACTIVE record → 400 `MAINTENANCE_ALREADY_ACTIVE`.
Success (atomic): record created `status: "ACTIVE"`, vehicle → `IN_SHOP`.
201: `{ data: MaintenanceLog }`.

**POST /api/maintenance/:id/close**
Request: `{}` — record must be `ACTIVE` → else 400 `MAINTENANCE_ALREADY_CLOSED`.
Success (atomic): record → `COMPLETED` (+`closedAt`), vehicle → `AVAILABLE` **unless** its status is `RETIRED` (then left untouched).
200: `{ data: MaintenanceLog }`.

### Fuel Logs & Expenses

| Method & Path | Roles (write) | Purpose |
|---|---|---|
| `GET /api/fuel-logs?vehicleId=` | any authed | List, newest first |
| `POST /api/fuel-logs` | FINANCIAL_ANALYST | Manual fuel entry |
| `GET /api/expenses?vehicleId=` | any authed | List, newest first |
| `POST /api/expenses` | FINANCIAL_ANALYST | Toll/misc entry |
| `GET /api/expenses/summary` | any authed | Per-vehicle operational cost |

**POST /api/fuel-logs** — Request: `{ vehicleId: string, tripId?: string, liters: number, cost: number, date?: string = now }` → 201 `{ data: FuelLog }`.

**POST /api/expenses** — Request: `{ vehicleId: string, tripId?: string, category: ExpenseCategory, amount: number, date?: string = now, note?: string }` → 201 `{ data: Expense }`.

**GET /api/expenses/summary**
200: `{ data: { rows: Array<{ vehicleId: string, registrationNumber: string, name: string, fuelCost: number, maintenanceCost: number, tollMiscCost: number, operationalCost: number }>, totalOperationalCost: number } }`
`operationalCost = fuelCost + maintenanceCost` (spec formula; tolls shown as their own column).

### Dashboard & Analytics

| Method & Path | Roles | Purpose |
|---|---|---|
| `GET /api/dashboard/kpis?type=&status=&region=` | any authed | Dashboard KPIs + recent trips |
| `GET /api/analytics` | FLEET_MANAGER, FINANCIAL_ANALYST | Reports page data |
| `GET /api/analytics/export.csv` | FLEET_MANAGER, FINANCIAL_ANALYST | CSV download |

**GET /api/dashboard/kpis** — filters apply to the vehicle-derived numbers.
200:
```ts
{ data: {
  activeVehicles: number;        // status !== "RETIRED"
  availableVehicles: number;     // status === "AVAILABLE"
  inMaintenance: number;         // status === "IN_SHOP"
  activeTrips: number;           // trip status === "DISPATCHED"
  pendingTrips: number;          // trip status === "DRAFT"
  driversOnDuty: number;         // driver status "AVAILABLE" | "ON_TRIP"
  fleetUtilizationPct: number;   // round(ON_TRIP / activeVehicles * 100), 0 if none
  vehicleStatusBreakdown: { AVAILABLE: number; ON_TRIP: number; IN_SHOP: number; RETIRED: number };
  recentTrips: Trip[];           // latest 5, populated
} }
```

**GET /api/analytics**
200:
```ts
{ data: {
  fuelEfficiencyKmPerL: number | null;   // Σ(endOdometer-startOdometer) of COMPLETED trips / Σ fuelUsedL; null if no fuel data
  fleetUtilizationPct: number;
  totalOperationalCost: number;          // Σ fuel + Σ maintenance, whole fleet
  avgVehicleRoiPct: number | null;       // mean of per-vehicle roiPct (vehicles with acquisitionCost > 0)
  monthlyRevenue: Array<{ month: string; revenue: number }>;  // "2026-07", last 6 months, COMPLETED trips
  costliestVehicles: Array<{ vehicleId: string; registrationNumber: string; name: string; operationalCost: number }>; // top 5 desc
  vehicleRoi: Array<{ vehicleId: string; registrationNumber: string; name: string;
    revenue: number; fuelCost: number; maintenanceCost: number; acquisitionCost: number;
    roiPct: number }>;                   // (revenue − (maintenance+fuel)) / acquisitionCost * 100
} }
```

**GET /api/analytics/export.csv** — `Content-Type: text/csv`, `Content-Disposition: attachment; filename="transitops-report.csv"`. One row per vehicle: registrationNumber, name, type, status, revenue, fuelCost, maintenanceCost, operationalCost, roiPct.

## Error Code Index

`UNAUTHORIZED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `VALIDATION` 400 ·
`INVALID_CREDENTIALS` 401 · `DUPLICATE_EMAIL` 409 · `DUPLICATE_REGISTRATION` 409 · `DUPLICATE_LICENSE` 409 ·
`INVALID_STATUS_CHANGE` 400 · `VEHICLE_IN_SHOP` 400 · `VEHICLE_ON_TRIP` 400 ·
`VEHICLE_RETIRED` 400 · `VEHICLE_NOT_AVAILABLE` 400 · `DRIVER_ON_TRIP` 400 ·
`DRIVER_LICENSE_EXPIRED` 400 · `DRIVER_SUSPENDED` 400 · `DRIVER_NOT_AVAILABLE` 400 ·
`TRIP_NOT_DRAFT` 400 · `TRIP_UNASSIGNED` 400 · `TRIP_NOT_DISPATCHED` 400 ·
`TRIP_ALREADY_CLOSED` 400 · `ODOMETER_INVALID` 400 · `CAPACITY_EXCEEDED` 400 ·
`MAINTENANCE_ALREADY_ACTIVE` 400 · `MAINTENANCE_ALREADY_CLOSED` 400

## RBAC Matrix (module → role access; "view" = GET only, "full" = GET + writes)

| Role | Fleet | Drivers | Trips | Fuel/Exp | Analytics | Maintenance | Dashboard |
|---|---|---|---|---|---|---|---|
| FLEET_MANAGER | full | full | view | view | view | full | view |
| DISPATCHER | view | view | full | view | – | view | view |
| SAFETY_OFFICER | view | full | view | – | – | view | view |
| FINANCIAL_ANALYST | view | view | view | full | full | view | view |

Reads are broadly shared (every module needs vehicle/driver names to render); writes are
strictly scoped as in the endpoint tables above. The sidebar shows a module iff the role has
at least "view"; Analytics is hidden for DISPATCHER and SAFETY_OFFICER.

---

## Non-Negotiable Conventions

1. **Business rules live ONLY in `server/src/lib/rules.ts`** as pure functions. Routes call
   them; never duplicate a rule inline. The client may pre-check for UX (e.g. live capacity
   warning) but the server is the authority.
2. **All writes validated with Zod** at the route boundary; reject before touching the DB.
3. **Status transitions are atomic** — dispatch/complete/cancel and maintenance open/close
   update trip + vehicle + driver together (Mongoose transactions on Atlas; otherwise
   ordered writes with compensating rollback).
4. **Status strings** come from this contract's enums, exported as constants from
   `server/src/models` and mirrored in `client/src/lib/types.ts`. Never hardcode variants.
5. **API envelope** exactly as specified above, on every endpoint.
6. **RBAC enforced server-side** via `requireRole`; the client only hides nav.
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
- Pull before starting; claim tasks in `docs/TASKS.md` before touching their files.
