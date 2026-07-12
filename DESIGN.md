# DESIGN.md — UI Spec (from design/mockup.svg, Excalidraw)

Source of truth: `design/mockup.svg` (9 screens). This file translates it into buildable specs.
Every screen is **responsive**: sidebar collapses to a hamburger drawer < `lg`; tables become
stacked cards < `md` where practical.

## Global Shell (screens 1–8)

- **Sidebar** (left, dark): logo "TransitOps", nav — Dashboard, Fleet, Drivers, Trips,
  Maintenance, Fuel & Expenses, Analytics, Settings. Items hidden per RBAC.
- **Topbar**: global search input, user chip (avatar initials + name + role, e.g. "Raven K. · Dispatcher").
- **Status badges** (used everywhere, consistent colors):
  - Vehicle: Available=green, On Trip=blue, In Shop=amber, Retired=gray
  - Driver: Available=green, On Trip=blue, Off Duty=gray, Suspended=red
  - Trip: Draft=gray, Dispatched=blue, Completed=green, Cancelled=red
  - License expired: red "EXPIRED" tag next to date

## 0 · Login (`/login`)

Split layout: left brand panel (TransitOps, tagline, four-role list, GSAP entrance animation),
right card: "Sign in to your account" — email, password, remember-me, Sign In button.
Role is **derived from the account**, not user-selectable (mockup shows a role dropdown, but a
selectable role would defeat RBAC — see DECISIONS.md D-007). Error state: "❌ Invalid credentials."
Footer: "TRANSITOPS © 2026 · RBAC ENABLED".

## 1 · Dashboard (`/dashboard`)

- Filter row: Vehicle Type / Status / Region selects.
- 7 KPI cards (2 rows, responsive grid): Active Vehicles, Available Vehicles, Vehicles in
  Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization %.
- **Recent Trips** table: Trip, Vehicle, Driver, Status, ETA.
- **Vehicle Status** donut (Available / On Trip / In Shop / Retired).

## 2 · Vehicle Registry (`/fleet`)

- Header: "+ Add Vehicle" button; filters Type/Status; search by reg no.
- Table: Reg No (unique), Name/Model, Type, Capacity, Odometer, Acq. Cost, Status, row actions (edit/retire).
- Add/Edit dialog with Zod validation; duplicate reg no → inline error.
- Footer rule note: "Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher".

## 3 · Drivers (`/drivers`)

- "+ Add Driver"; table: Driver, License No, Category, Expiry (red EXPIRED badge when past),
  Contact, Trip Compl. %, Safety score, Status.
- Status toggle menu per row: Available / On Trip / Off Duty / Suspended (On Trip is
  system-set, not manually selectable).
- Rule note: "Expired license or Suspended status → blocked from trip assignment".

## 4 · Trip Dispatcher (`/trips`)

- **Lifecycle stepper** at top: Draft → Dispatched → Completed | Cancelled.
- **Create Trip card**: Source, Destination, Vehicle select (**AVAILABLE only**, shows
  "VAN-05 – 500 kg capacity"), Driver select (**AVAILABLE + valid license only**), Cargo
  Weight (kg), Planned Distance (km).
  - Live capacity check: e.g. "Vehicle Capacity: 500 kg / Cargo Weight: 700 kg →
    ❌ Capacity exceeded by 200 kg — dispatch blocked", Dispatch button disabled.
  - Buttons: Save Draft, Dispatch, Cancel.
- **Live Board**: trip cards — code, "VAN-05 / ALEX", route "A → B", status badge, ETA/note.
  Card actions: Dispatch (draft), Complete / Cancel (dispatched).
- **Complete dialog**: end odometer, fuel used (L), revenue → creates FuelLog, frees vehicle+driver.
- Footer: "On Complete: odometer → fuel log → expenses → Vehicle & Driver Available".

## 5 · Maintenance (`/maintenance`)

- **Log Service Record** form: Vehicle select, Service Type, Cost, Date, Status (Active) → Save.
- Status flow strip: Available →(create active)→ In Shop →(close, not retired)→ Available.
- **Service Log** table: Vehicle, Service, Cost, Status (In Shop / Completed) + Close action.
- Note: "In Shop vehicles are removed from the dispatch pool."

## 6 · Fuel & Expenses (`/expenses`)

- Buttons: "+ Log Fuel", "+ Add Expense".
- **Fuel Logs** table: Vehicle, Date, Liters, Fuel Cost.
- **Other Expenses** table: Trip, Vehicle, Toll, Other, Maint. (linked, read-only), Total.
- Banner: "TOTAL OPERATIONAL COST (AUTO) = FUEL + MAINTENANCE" + amount (₹, `en-IN` formatting).

## 7 · Analytics (`/analytics`)

- "Export CSV" button (all report tables).
- 4 KPI cards: Fuel Efficiency (km/L), Fleet Utilization %, Operational Cost, Vehicle ROI %
  with formula caption "ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost".
- **Monthly Revenue** bar chart (Recharts); **Top Costliest Vehicles** horizontal bars.

## 8 · Settings (`/settings`)

- **General**: Depot Name, Currency (INR ₹), Distance Unit (km) → Save.
- **RBAC matrix** table (read-only display of the permission spec — see ARCHITECTURE.md).

## Visual Language

- Tailwind; dark sidebar (#0f172a slate-900 range) + light content area; dark mode inverts content area.
- Rounded-xl cards, soft shadows, generous whitespace; INR amounts formatted `toLocaleString("en-IN")`.
- GSAP: login entrance, KPI number count-up, subtle page/stagger transitions (Phase 6).
- Use the `design-taste-frontend` skill + impeccable for the polish pass.
