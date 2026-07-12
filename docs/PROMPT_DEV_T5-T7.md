# Prompt for Dev Panchal (Antigravity) — Tasks T5, T6, T7

Copy everything below the line into Antigravity as one prompt.

---

You are working in the TransitOps repo (`~/Odoo-Hackathon-2026`), a MERN monorepo for a fleet operations platform built in an 8-hour hackathon by two developers. Your teammate Ankush has already shipped: auth backend (User model, register/login/me, JWT, `requireAuth`/`requireRole` middleware), the client auth flow, the app shell, and a dashboard page that is currently waiting for your endpoint.

Your job in this session is exactly three tasks from `docs/TASKS.md`:

- **T5 — Core Mongoose models**: Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense
- **T6 — Seed script**: demo users + fleet data matching the design mockup
- **T7 — `GET /api/dashboard/kpis` endpoint**

## Before writing any code

1. `git pull origin main` — you need the latest tree (API port is 5001 now, auth files exist).
2. Read `AGENTS.md` fully. The **API CONTRACT** section is binding: entity shapes, enum strings, the `{ success, data } / { success: false, error, code, details? }` envelope, and error codes are non-negotiable. If anything you build differs from the contract, the contract wins.
3. Read `docs/DECISIONS.md` (settled decisions — do not re-litigate) and `docs/TASKS.md`.
4. In `docs/TASKS.md`, set T5/T6/T7 status to `doing`, commit and push that one-line change immediately so Ankush sees the claim.
5. Set your git identity before your first commit (commits are scored per member):
   `git config user.name "Dev Panchal"` and `git config user.email "<your GitHub email>"`.

## Codebase facts you must respect (do not guess)

- Node ESM with **NodeNext** module resolution: every relative import needs a `.js` extension, e.g. `import { ROLES } from "./constants.js"` even though the file is `constants.ts`.
- `server/src/models/constants.ts` **already exists** with all enum arrays and types (ROLES, VEHICLE_TYPES, VEHICLE_STATUSES, DRIVER_STATUSES, LICENSE_CATEGORIES, TRIP_STATUSES, MAINTENANCE_STATUSES, EXPENSE_CATEGORIES). Import from it; never redefine enums.
- `server/src/models/User.ts` already exists — follow its style (typed `Schema<Fields>`, `timestamps: true`, `toJSON.transform` deleting `__v`).
- `server/src/lib/respond.ts` has `ok(res, data, status?)` and `fail(res, status, code, error, details?)` — use them for every response.
- `server/src/middleware/auth.ts` has `requireAuth` and `requireRole(...roles)`.
- The API listens on **port 5001**. `server/.env` needs the real `MONGODB_URI` + `JWT_SECRET` from Ankush (if you see a placeholder error on startup, you skipped this).
- Files owned by Ankush — **do not modify** except where told: `server/src/routes/auth.ts`, `server/src/middleware/*`, everything under `client/` (the dashboard client page is already wired to your future endpoint).
- `server/src/index.ts` is shared: your only change there is importing and mounting your dashboard router. Keep the diff minimal.

## T5 — Models (`server/src/models/`)

One file per model. Field names must match the API contract in AGENTS.md exactly. Reference fields that the contract returns as populated objects must be named `vehicle` / `driver` (ObjectId refs), so `.populate("vehicle driver")` produces the contract shape directly. `tripId` stays a plain ObjectId (serialized as string, not populated).

- **Vehicle.ts**: `registrationNumber` (String, required, unique, uppercase, trim), `name` (required), `type` (enum VEHICLE_TYPES), `maxLoadCapacityKg` (Number, required, min 1), `odometerKm` (default 0, min 0), `acquisitionCost` (required, min 0), `region` (default ""), `status` (enum VEHICLE_STATUSES, default "AVAILABLE"). Timestamps.
- **Driver.ts**: `name` (required), `licenseNumber` (required, unique, trim), `licenseCategory` (array of LICENSE_CATEGORIES, non-empty — a license can cover both LMV and HMV), `licenseExpiry` (Date, required), `contact` (required), `safetyScore` (default 100, 0–100), `tripCompletionRate` (default 100, 0–100), `status` (enum DRIVER_STATUSES, default "AVAILABLE"). Timestamps.
- **Trip.ts**: `code` (required, unique — "TR001" style), `source`, `destination` (required), `vehicle` (ObjectId ref "Vehicle", default null), `driver` (ObjectId ref "Driver", default null), `cargoWeightKg` (required, min 1), `plannedDistanceKm` (required, min 1), `status` (enum TRIP_STATUSES, default "DRAFT"), and nullable-with-default-null: `revenue`, `startOdometer`, `endOdometer`, `fuelUsedL`, `cancelReason`, `dispatchedAt`, `completedAt`. Timestamps.
- **MaintenanceLog.ts**: `vehicle` (ref, required), `serviceType` (required), `cost` (required, min 0), `date` (Date, default now), `status` (enum MAINTENANCE_STATUSES, default "ACTIVE"), `closedAt` (default null). Timestamps.
- **FuelLog.ts**: `vehicle` (ref, required), `tripId` (ObjectId, default null), `liters` (required, min 0), `cost` (required, min 0), `date` (Date, default now). Timestamps.
- **Expense.ts**: `vehicle` (ref, required), `tripId` (default null), `category` (enum EXPENSE_CATEGORIES), `amount` (required, min 0), `date` (default now), `note` (String, default null). Timestamps.

## T6 — Seed (`server/src/seed.ts`)

`npm run seed` (already wired to `tsx src/seed.ts`) must: connect via `MONGODB_URI`, **delete all documents** in all 7 collections, insert the data below, log a summary, and `process.exit(0)`.

Users (password for all: `password123`, hashed with `bcryptjs.hash(pw, 10)`):
| name | email | role |
|---|---|---|
| Raven K | manager@transitops.in | FLEET_MANAGER |
| Ankush Gupta | dispatcher@transitops.in | DISPATCHER |
| Dev Panchal | safety@transitops.in | SAFETY_OFFICER |
| Meera Shah | finance@transitops.in | FINANCIAL_ANALYST |

Vehicles (8, region "Gandhinagar" unless noted) — mirror the mockup:
- GJ01AB4521 "VAN-05", VAN, 500 kg, odo 74000, cost 620000, **ON_TRIP**
- GJ01AB9981 "TRUCK-11", TRUCK, 5000 kg, odo 182000, cost 2450000, AVAILABLE
- GJ01AB1120 "MINI-03", MINI, 1000 kg, odo 66000, cost 410000, **IN_SHOP**
- GJ01AB0087 "VAN-09", VAN, 750 kg, odo 241900, cost 590000, **RETIRED**
- GJ01CD2210 "TRK-12", TRUCK, 4000 kg, odo 98000, cost 1980000, AVAILABLE
- GJ01CD7745 "MINI-08", MINI, 1000 kg, odo 31000, cost 450000, AVAILABLE (region "Ahmedabad")
- GJ01EF3301 "VAN-02", VAN, 500 kg, odo 12000, cost 640000, AVAILABLE (region "Ahmedabad")
- GJ01EF8892 "BIKE-01", BIKE, 40 kg, odo 8000, cost 95000, AVAILABLE

Drivers (6) — `licenseCategory` is an array; a license can cover both classes:
- Alex, DL-88213, [LMV], expiry 2028-12-31, 98765xxxxx, safety 96, completion 96, **ON_TRIP**
- John, DL-44120, [HMV], expiry **2025-03-31 (expired)**, 98220xxxxx, safety 81, completion 81, **SUSPENDED**
- Priya, DL-77031, [LMV, HMV], expiry 2027-08-31, 99110xxxxx, safety 99, completion 99, AVAILABLE
- Suresh, DL-90045, [HMV], expiry 2027-01-31, 97440xxxxx, safety 88, completion 88, OFF_DUTY
- Kavita, DL-55672, [LMV], expiry 2029-05-31, 98010xxxxx, safety 94, completion 92, AVAILABLE
- Ramesh, DL-33208, [LMV, HMV], expiry 2026-11-30, 97650xxxxx, safety 90, completion 87, AVAILABLE

Trips — statuses must stay **coherent** with the vehicle/driver statuses above:
- TR001: Gandhinagar Depot → Ahmedabad Hub, **VAN-05 + Alex** (the two ON_TRIP records), 450 kg, 38 km, **DISPATCHED**, `dispatchedAt` today, `startOdometer` 74000
- TR002: Vatva Industrial Area → Sanand Warehouse, TRK-12 + Priya, 2200 kg, 52 km, **COMPLETED** yesterday: startOdometer 97940, endOdometer 98000 (60 km), fuelUsedL 9, revenue 8500 — but since TRK-12/Priya are back to AVAILABLE, that is consistent
- TR003: Mansa → Kalol Depot, no vehicle/driver (null), 300 kg, 25 km, **DRAFT**
- TR004: Ahmedabad Hub → Gandhinagar Depot, MINI-08 + Kavita, 800 kg, 40 km, **CANCELLED**, cancelReason "Vehicle went to shop" (both back to AVAILABLE — consistent)

MaintenanceLogs: MINI-03 "Tyre Replace" 6200, **ACTIVE** (this is why MINI-03 is IN_SHOP); TRUCK-11 "Engine Repair" 18000, COMPLETED with `closedAt` set.

FuelLogs: TR002's auto log (TRK-12, tripId of TR002, 9 L, 810, yesterday) plus manual logs: VAN-05 42 L / 3150; MINI-08 28 L / 2050.

Expenses: TR002 toll 340 (TRK-12); TR001 toll 120 (VAN-05); one MISC 150 for MINI-08 with a note.

## T7 — Dashboard KPIs (`server/src/routes/dashboard.ts`)

`GET /api/dashboard/kpis` — auth: `requireAuth` only (all roles may view). Optional query filters `type`, `status`, `region` apply to the **vehicle-derived** numbers (validate against the enum arrays; ignore invalid values). Response `data` shape, exactly per the contract:

```ts
{
  activeVehicles,        // vehicles with status !== "RETIRED" (after filters)
  availableVehicles,     // status === "AVAILABLE"
  inMaintenance,         // status === "IN_SHOP"
  activeTrips,           // trips DISPATCHED
  pendingTrips,          // trips DRAFT
  driversOnDuty,         // drivers AVAILABLE or ON_TRIP
  fleetUtilizationPct,   // Math.round(ON_TRIP / activeVehicles * 100), 0 when activeVehicles is 0
  vehicleStatusBreakdown: { AVAILABLE, ON_TRIP, IN_SHOP, RETIRED },  // after filters
  recentTrips            // latest 5 by createdAt desc, .populate("vehicle driver")
}
```

Mount it in `server/src/index.ts` with `app.use("/api/dashboard", dashboardRouter);` right after the auth router — that line and its import are your only edits to that file.

## Verify before pushing (all must pass)

1. `npm run build` from the repo root — zero TypeScript errors.
2. `npm run seed` — runs clean, logs counts.
3. ```
   TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" \
     -d '{"email":"manager@transitops.in","password":"password123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).data.token")
   curl -s http://localhost:5001/api/dashboard/kpis -H "Authorization: Bearer $TOKEN"
   ```
   Expected with the seed: activeVehicles 7, availableVehicles 5, inMaintenance 1, activeTrips 1, pendingTrips 1, driversOnDuty 4, fleetUtilizationPct 14, and 4 recentTrips with populated vehicle/driver.
4. `curl -s http://localhost:5001/api/dashboard/kpis` with no token → `401 UNAUTHORIZED` envelope.
5. Open http://localhost:5173, log in as manager@transitops.in — the dashboard KPI cards must show live numbers and the "waiting for data" banner must be gone.

## When done

- Update `docs/TASKS.md`: T5/T6/T7 → `done`.
- Append one line to `docs/AGENT_LOG.md` (time, "Dev · Antigravity", what shipped).
- Commit with conventional messages under YOUR git identity (e.g. `feat: core mongoose models`, `feat: seed script with mockup demo data`, `feat: dashboard KPIs endpoint`) and push to `main`. Run `npm run build` one final time before the push.
