# Prompt for Dev Panchal (Antigravity) — Phase 2: M2, M4, M5, M6

Copy everything below the line into Antigravity as one prompt.

---

You are working in the TransitOps repo (`~/Odoo-Hackathon-2026`). Phase 1 (auth, landing, app shell, basic dashboard, all Mongoose models, seed data) is done and merged — you built the models, seed script, and dashboard KPI endpoint yourself in the last session, and Ankush reviewed and fixed one bug in your dashboard route (async errors weren't forwarded to Express's error handler) and changed `Driver.licenseCategory` from a single value to a non-empty array (`["LMV"]`, `["HMV"]`, or `["LMV","HMV"]` — a license can cover both classes). Pull first so you have both fixes.

Your job this session is four full page slices from `docs/TASKS.md` Phase 2 — each slice is its backend routes **and** its UI page:

- **M2 — Drivers** (`/api/drivers` + `/drivers`)
- **M4 — Maintenance** (`/api/maintenance` + `/maintenance`)
- **M5 — Fuel & Expenses** (`/api/fuel-logs`, `/api/expenses` + `/expenses`)
- **M6 — Analytics + CSV** (`/api/analytics` + `/analytics`)

Ankush is building M1 (Fleet/`/api/vehicles`), M3 (Trips + the business-rules engine), M7 (dashboard finishers), M8 (Settings) in parallel. **None of your four tasks need his routes to start** — the Vehicle, Trip, MaintenanceLog, FuelLog, and Expense Mongoose models already exist (you built them), so you read/write them directly. The only soft dependency: your Maintenance and Fuel/Expense forms need a vehicle picker, which calls `GET /api/vehicles` (Ankush's M1). If it isn't merged yet when you get there, `git pull` again in a bit — we're both committing hourly to `main`. Do not build your own vehicles route; that would collide with his work.

## Before writing any code

1. `git pull origin main`.
2. Re-read `AGENTS.md` end to end — same binding contract as last time, now with the `licenseCategory` array fix. Sections `### Drivers`, `### Maintenance`, `### Fuel Logs & Expenses`, `### Dashboard & Analytics` under **## Endpoints** are your exact spec; do not deviate.
3. Read `DESIGN.md` sections `## 3 · Drivers`, `## 5 · Maintenance`, `## 6 · Fuel & Expenses`, `## 7 · Analytics`, and `## Visual Language` at the top (mist canvas, slate ink, indigo accent, rounded-2xl/3xl cards, soft shadows — match what's already in `DashboardPage.tsx`).
4. In `docs/TASKS.md`, set M2/M4/M5/M6 to `doing`, commit and push that one-line change immediately.
5. Confirm your git identity is still set (`git config user.name` / `user.email` — should already be from last session).

## Codebase facts you must respect

- Same NodeNext ESM rule: every relative server import needs `.js` (e.g. `from "../models/index.js"`).
- Reuse what exists, don't rebuild it:
  - `server/src/lib/respond.ts` → `ok(res, data, status?)`, `fail(res, status, code, error, details?)`.
  - `server/src/middleware/auth.ts` → `requireAuth`, `requireRole(...roles)`.
  - `server/src/models/index.ts` re-exports every model and every constant/type from `constants.ts`. Import from `../models/index.js`, not individual model files, to match the pattern you used in `dashboard.ts`.
  - **Async route handlers must call `next(error)` in their catch block, never `throw error`.** Express 4 does not auto-forward async rejections — this was the exact bug Ankush fixed in your dashboard route. Copy the pattern from the now-fixed `server/src/routes/dashboard.ts` or `server/src/routes/auth.ts`.
  - Zod for request validation, same style as `server/src/routes/auth.ts` (`schema.safeParse(req.body)`, first issue message on 400).
- Client conventions already in place, reuse them:
  - `client/src/lib/api.ts` → `apiGet<T>(url)`, `apiPost<T>(url, body)`, `apiPut<T>(url, body)`, `apiDelete<T>(url)`. All throw a typed `ApiError` (`{ code, message, status?, details? }`) on failure — catch it and show `err.message`.
  - `client/src/lib/auth.tsx` → `useAuth()` gives `{ user }`. `client/src/lib/rbac.ts` → `can(user.role, "drivers" | "maintenance" | "expenses" | "analytics")` returns `"full" | "view" | null`. **Gate every write action (Add/Edit/Close/Toggle button) behind `can(...) === "full"`** — hide or disable it otherwise. The nav already hides pages with `null` access, but a `DISPATCHER` has `"view"` on Drivers, for example, and must not see a working "+ Add Driver" button.
  - `client/src/lib/types.ts` currently has `User`, `Vehicle`, `Driver`, `Trip`, `DashboardKpis`. **Append** (don't touch existing entries) the interfaces for `MaintenanceLog`, `FuelLog`, `Expense`, and an `AnalyticsData` type — shapes are given per task below, copied from the AGENTS.md contract.
  - Page-swap pattern: `client/src/pages/modules.tsx` currently exports placeholder `DriversPage`, `MaintenancePage`, `ExpensesPage`, `AnalyticsPage` (each rendering `<PlaceholderPage .../>`). Build your real pages as new files (see paths below), then in `client/src/App.tsx` change the four import lines for those components to point at your new files instead of `./pages/modules`. **Do not touch** the `FleetPage`, `TripsPage`, `SettingsPage` exports/imports — those are Ankush's, and `modules.tsx` will keep serving those three placeholders until his M1/M3/M8 land.
  - Styling: reuse the card idiom from `client/src/pages/dashboard/DashboardPage.tsx` (`rounded-2xl bg-white p-5 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)]`), `lucide-react` icons (already a dependency), Tailwind theme tokens `mist-50/100/200/300` and `ink-500/700/900` defined in `client/src/index.css`. Status badge colors per DESIGN.md: Available=green, On Trip=blue, In Shop=amber, Retired=gray, Suspended=red, Off Duty=gray, Draft=gray, Dispatched=blue, Completed=green, Cancelled=red — pill badges (`rounded-full px-3 py-1 text-xs font-semibold`) like the ones already in `Hero.tsx`'s live-board preview.
  - Money: `amount.toLocaleString("en-IN")` with a ₹ prefix, per DESIGN.md.

## M2 — Drivers

**Backend** (`server/src/routes/drivers.ts`, mount at `app.use("/api/drivers", driversRouter)` in `index.ts` — that one import + one line is your only edit there):

- `GET /api/drivers?status=&q=` — auth only. `q` case-insensitive matches `name` or `licenseNumber`.
- `GET /api/drivers/assignable` — auth only. Returns drivers where `status === "AVAILABLE"` AND `licenseExpiry > now`. **Put this route before `/:id`** in the router so Express doesn't treat `"assignable"` as an `:id` param.
- `GET /api/drivers/:id` — auth only.
- `POST /api/drivers` — `requireRole("FLEET_MANAGER", "SAFETY_OFFICER")`. Body: `{ name, licenseNumber, licenseCategory: LicenseCategory[] (non-empty), licenseExpiry (ISO string), contact, safetyScore? = 100, tripCompletionRate? = 100 }`. New driver starts `status: "AVAILABLE"`. Duplicate `licenseNumber` → `409 DUPLICATE_LICENSE`. Empty `licenseCategory` array → `400 VALIDATION`.
- `PUT /api/drivers/:id` — same roles. Partial update. If `status` is in the body and equals `"ON_TRIP"`, reject with `400 INVALID_STATUS_CHANGE` (that transition only happens via trip dispatch, which is Ankush's M3). If the driver's **current** status in the DB is `"ON_TRIP"` and the request tries to change status to anything else, reject with `400 DRIVER_ON_TRIP`.

**Frontend** (`client/src/pages/drivers/DriversPage.tsx`, per DESIGN.md §3):

- "+ Add Driver" button (only if `can(role, "drivers") === "full"`) opening a modal/dialog form matching the POST body above — multi-select or checkboxes for LMV/HMV (it's an array now).
- Table columns: Driver, License No., Category (render the array, e.g. "LMV, HMV"), Expiry (red "EXPIRED" pill if `licenseExpiry < now`), Contact, Trip Compl. %, Safety Score, Status (colored pill).
- Status toggle control per row (Available / Off Duty / Suspended — never let the UI offer "On Trip", it's system-set) calling `PUT /api/drivers/:id`, visible only when `can(role, "drivers") === "full"`.
- Footer note text: "Expired license or Suspended status → blocked from trip assignment."
- Add to `client/src/lib/types.ts`: nothing new needed, `Driver` already exists there with the array `licenseCategory`.

## M4 — Maintenance

**Backend** (`server/src/routes/maintenance.ts`, mount at `/api/maintenance`):

- `GET /api/maintenance?vehicleId=&status=` — auth only, newest first, `.populate("vehicle")`.
- `POST /api/maintenance` — `requireRole("FLEET_MANAGER")`. Body: `{ vehicleId, serviceType, cost, date? = now }`. Look up the vehicle first: if `status === "ON_TRIP"` → `400 VEHICLE_ON_TRIP` ("Complete or cancel its trip first."); if `status === "RETIRED"` → `400 VEHICLE_RETIRED`; if an `ACTIVE` MaintenanceLog already exists for that vehicle → `400 MAINTENANCE_ALREADY_ACTIVE`. Otherwise create the log with `status: "ACTIVE"` **and** set the vehicle's `status` to `"IN_SHOP"` — do both writes together (sequential awaits are fine; a Mongoose `.session()` transaction is a bonus if you have time, not required for the hackathon).
- `POST /api/maintenance/:id/close` — same role. If the record's `status !== "ACTIVE"` → `400 MAINTENANCE_ALREADY_CLOSED`. Otherwise set `status: "COMPLETED"`, `closedAt: now`, and set the vehicle's `status` back to `"AVAILABLE"` **unless** the vehicle's current status is `"RETIRED"` (leave retired vehicles alone).

**Frontend** (`client/src/pages/maintenance/MaintenancePage.tsx`, per DESIGN.md §5):

- "Log Service Record" form: Vehicle select (fetch `GET /api/vehicles` for the options — label each option `"${name} (${registrationNumber})"`), Service Type (text), Cost (number), Date (date input, default today), Save button. Gate visibility behind `can(role, "maintenance") === "full"`.
- Service Log table: Vehicle, Service, Cost, Status (pill: In Shop-styled for `ACTIVE`, green for `COMPLETED`), and a "Close" action button per `ACTIVE` row (same RBAC gate).
- Note text: "In Shop vehicles are removed from the dispatch pool."
- Append to `client/src/lib/types.ts`:
  ```ts
  export interface MaintenanceLog {
    _id: string;
    vehicle: Vehicle;
    serviceType: string;
    cost: number;
    date: string;
    status: MaintenanceStatus;
    closedAt: string | null;
    createdAt: string;
  }
  ```
  (`MaintenanceStatus` type already exists in that file.)

## M5 — Fuel & Expenses

**Backend** (`server/src/routes/fuelLogs.ts` and `server/src/routes/expenses.ts`, or combine in one `expenses.ts` file with two routers — your call; mount at `/api/fuel-logs` and `/api/expenses` respectively):

- `GET /api/fuel-logs?vehicleId=` — auth only, newest first, `.populate("vehicle")`.
- `POST /api/fuel-logs` — `requireRole("FINANCIAL_ANALYST")`. Body: `{ vehicleId, tripId?, liters, cost, date? = now }`.
- `GET /api/expenses?vehicleId=` — auth only, newest first, `.populate("vehicle")`.
- `POST /api/expenses` — `requireRole("FINANCIAL_ANALYST")`. Body: `{ vehicleId, tripId?, category: "TOLL" | "MISC", amount, date? = now, note? }`.
- `GET /api/expenses/summary` — auth only. For every non-retired vehicle, compute `fuelCost` (Σ FuelLog.cost), `maintenanceCost` (Σ MaintenanceLog.cost, all statuses), `tollMiscCost` (Σ Expense.amount), `operationalCost = fuelCost + maintenanceCost` (tolls are **not** part of operational cost per the spec formula, they're shown separately). Response:
  ```ts
  { data: {
    rows: Array<{ vehicleId: string; registrationNumber: string; name: string;
      fuelCost: number; maintenanceCost: number; tollMiscCost: number; operationalCost: number }>;
    totalOperationalCost: number;
  } }
  ```

**Frontend** (`client/src/pages/expenses/ExpensesPage.tsx`, per DESIGN.md §6):

- "+ Log Fuel" and "+ Add Expense" buttons (gate behind `can(role, "expenses") === "full"`), each opening a small form matching the POST bodies above (vehicle select same pattern as Maintenance).
- Fuel Logs table: Vehicle, Date, Liters, Fuel Cost.
- Other Expenses table: pull from `GET /api/expenses/summary` — columns Vehicle, Toll (tollMiscCost), Maint. (maintenanceCost, read-only, linked), Total (operationalCost).
- Banner: "TOTAL OPERATIONAL COST (AUTO) = FUEL + MAINTENANCE" with `totalOperationalCost.toLocaleString("en-IN")`.
- Append to `client/src/lib/types.ts`:
  ```ts
  export interface FuelLog {
    _id: string;
    vehicle: Vehicle;
    tripId: string | null;
    liters: number;
    cost: number;
    date: string;
    createdAt: string;
  }

  export interface Expense {
    _id: string;
    vehicle: Vehicle;
    tripId: string | null;
    category: ExpenseCategory;
    amount: number;
    date: string;
    note: string | null;
    createdAt: string;
  }

  export interface ExpenseSummaryRow {
    vehicleId: string;
    registrationNumber: string;
    name: string;
    fuelCost: number;
    maintenanceCost: number;
    tollMiscCost: number;
    operationalCost: number;
  }
  ```
  (`ExpenseCategory` type already exists in that file.)

## M6 — Analytics + CSV

**Backend** (`server/src/routes/analytics.ts`, mount at `/api/analytics`):

- `GET /api/analytics` — `requireRole("FLEET_MANAGER", "FINANCIAL_ANALYST")`. Compute across the whole fleet:
  - `fuelEfficiencyKmPerL`: for all `COMPLETED` trips, sum `(endOdometer - startOdometer)` and divide by the sum of `fuelUsedL` across those same trips. `null` if no completed trips have fuel data (avoid divide-by-zero).
  - `fleetUtilizationPct`: same formula as the dashboard KPI (`ON_TRIP / (total - RETIRED) * 100`, rounded, 0 if no active vehicles) — reuse the logic, don't diverge from `dashboard.ts`.
  - `totalOperationalCost`: Σ all FuelLog.cost + Σ all MaintenanceLog.cost, whole fleet.
  - `avgVehicleRoiPct`: for each vehicle with `acquisitionCost > 0`, `roiPct = (revenue - (maintenanceCost + fuelCost)) / acquisitionCost * 100` where `revenue` is the sum of `revenue` from that vehicle's `COMPLETED` trips; average across those vehicles. `null` if none qualify.
  - `monthlyRevenue`: group `COMPLETED` trips by `completedAt`'s `"YYYY-MM"`, sum `revenue`, for the last 6 months (include months with 0 even if no trips, so the chart has 6 bars).
  - `costliestVehicles`: top 5 vehicles by `operationalCost` (fuel + maintenance) descending.
  - `vehicleRoi`: full array, one entry per vehicle with `acquisitionCost > 0`, same `roiPct` formula as above, per-vehicle breakdown.
  - Exact response shape is in AGENTS.md under `### Dashboard & Analytics` — match it field-for-field, the client will type against it verbatim.
- `GET /api/analytics/export.csv` — same roles. Set `Content-Type: text/csv` and `Content-Disposition: attachment; filename="transitops-report.csv"`. One row per non-retired vehicle: `registrationNumber, name, type, status, revenue, fuelCost, maintenanceCost, operationalCost, roiPct`. Use a simple manual CSV join (`rows.map(r => Object.values(r).join(",")).join("\n")`) with a header row — no need for a CSV library at this scale.

**Frontend** (`client/src/pages/analytics/AnalyticsPage.tsx`, per DESIGN.md §7):

- "Export CSV" button — simplest approach: `<a href="/api/analytics/export.csv" download>`, but that won't carry the JWT header. Instead, fetch via `apiGet` won't work for a raw CSV blob (it unwraps JSON). Use `axios` directly (or a small `fetch` with the `Authorization` header from `getToken()` in `lib/api.ts`) to get the response as a blob, then trigger a download via a temporary `<a>` + `URL.createObjectURL`.
- 4 KPI cards: Fuel Efficiency (`X.X km/L` or "—" if null), Fleet Utilization (`X%`), Operational Cost (₹, en-IN), Vehicle ROI (`X.X%` or "—" if null) — caption under the ROI card: "ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost".
- Monthly Revenue bar chart using `recharts` (already a dependency — `BarChart`, `Bar`, `XAxis`, `YAxis`, `ResponsiveContainer` from `"recharts"`).
- Top Costliest Vehicles as horizontal bars (a simple `<div>` width-percentage bar per vehicle is fine, doesn't need to be a recharts component).
- Append to `client/src/lib/types.ts`:
  ```ts
  export interface AnalyticsData {
    fuelEfficiencyKmPerL: number | null;
    fleetUtilizationPct: number;
    totalOperationalCost: number;
    avgVehicleRoiPct: number | null;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    costliestVehicles: Array<{ vehicleId: string; registrationNumber: string; name: string; operationalCost: number }>;
    vehicleRoi: Array<{
      vehicleId: string; registrationNumber: string; name: string;
      revenue: number; fuelCost: number; maintenanceCost: number; acquisitionCost: number; roiPct: number;
    }>;
  }
  ```

## Verify before pushing (all must pass)

1. `npm run build` from the repo root — zero TypeScript errors, both workspaces.
2. Restart the dev server (`npm run dev` from root) and re-run `npm run seed` if you changed any model.
3. Log in as each relevant role and click through all four of your pages — confirm write buttons are hidden/disabled for roles with only `"view"` access (e.g. log in as `dispatcher@transitops.in` and confirm the Drivers page has no working "+ Add Driver").
4. curl checks (get a token first, same pattern as last session):
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" \
     -d '{"email":"manager@transitops.in","password":"password123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).data.token")
   curl -s http://localhost:5001/api/drivers -H "Authorization: Bearer $TOKEN"
   curl -s http://localhost:5001/api/maintenance -H "Authorization: Bearer $TOKEN"
   curl -s http://localhost:5001/api/expenses/summary -H "Authorization: Bearer $TOKEN"
   curl -s http://localhost:5001/api/analytics -H "Authorization: Bearer $TOKEN"
   curl -s http://localhost:5001/api/analytics/export.csv -H "Authorization: Bearer $TOKEN"
   ```
   All should return `success: true` envelopes (or a valid CSV body for the last one) using the seeded data — sanity check the numbers make sense (e.g. MINI-03's maintenance cost should include the seeded 6200 "Tyre Replace" record).
5. Try triggering each error path at least once (duplicate license, closing an already-closed maintenance record, creating maintenance on a RETIRED vehicle) and confirm the error banner shows the right message.

## When done

- Update `docs/TASKS.md`: M2/M4/M5/M6 → `done`.
- Append one line to `docs/AGENT_LOG.md` (time, "Dev · Antigravity", what shipped).
- **If you made any decision not covered by this prompt** (a UI detail, an edge case), log it in `docs/DECISIONS.md` with a `D-0XX` entry — check the last entry number first so you don't collide with Ankush's.
- Commit with conventional messages under your git identity (e.g. `feat: drivers module`, `feat: maintenance module`, `feat: fuel and expenses module`, `feat: analytics module with CSV export`) — one commit per module is fine, or bundle if you built them together. Run `npm run build` one final time before the push.
