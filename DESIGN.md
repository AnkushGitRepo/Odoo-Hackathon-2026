# DESIGN.md — UI Spec

Sources of truth: `design/mockup.svg` (Excalidraw, 9 app screens — layout/content) plus two
style references: `design/reference-landing.png` (landing) and `design/reference-auth.png`
(auth pages). This file translates them into buildable specs. Every screen is **responsive**:
sidebar collapses to a hamburger drawer < `lg`; tables become stacked cards < `md` where
practical. Build pages with the `impeccable` + `design-taste-frontend` skills; animate with GSAP.

## Visual Language (from the reference images)

- **Canvas**: mist ice-blue (`#dbe4ea`-range) page background on landing/auth; near-white
  (`slate-50`) content areas in the app. Generous whitespace everywhere.
- **Ink**: deep slate-teal (`#16323c` / `slate-900`) for headlines and primary text; muted
  `slate-500` secondary text.
- **Accent**: royal indigo (`indigo-600`, ≈`#4353ff`) for primary buttons, links, focus
  rings, active nav. Landing CTAs may use the dark slate pill instead (per reference 1).
- **Surfaces**: white cards, `rounded-2xl`/`rounded-3xl`, soft diffuse shadows
  (`shadow-[0_20px_60px_-15px_rgba(22,50,60,0.15)]`), no hard borders.
- **Buttons**: pill (`rounded-full`) on landing/marketing; `rounded-xl` in app forms.
- **Type**: geometric sans (Inter or Plus Jakarta Sans via fontsource); display sizes are
  huge and tight (`tracking-tight`, `text-5xl–7xl`) on the landing hero.
- **Inputs**: labeled above, `rounded-xl` border `slate-200`, focus ring indigo (reference 2).
- **Status colors** (app, unchanged): Available=green, On Trip=blue, In Shop=amber,
  Retired=gray, Suspended/Cancelled=red, Draft=gray, Completed=green — badges always carry
  text, never color alone.
- **Motion (GSAP)**: hero headline rise+fade, floating cards stagger in with slight y-drift,
  KPI count-up, subtle page transitions. Respect `prefers-reduced-motion` via `gsap.matchMedia`.
- **Dark mode** (bonus, app only): inverts content surfaces; landing/auth stay light.

## L · Landing (`/`, public)

Style = reference-landing.png, content = TransitOps:
- **Nav**: logo "TransitOps" left; center links Features · Roles · Analytics; right "Sign in"
  ghost link + "Get Started" pill (→ `/signup`). Sticky, blurs on scroll.
- **Hero**: huge centered headline ("Dispatch. Track. Optimize.") + 2-line subcopy
  ("TransitOps replaces spreadsheets and logbooks with one platform for vehicles, drivers,
  trips, maintenance and costs.") + CTA pills ("Get Started" primary, "View Dashboard" ghost).
  Small dotted-connector motif under the hero (reference 1's lock strip → we use
  truck→route→check icons).
- **Floating preview row** (3 cards, like reference 1): (1) mini KPI card "Fleet Utilization
  81%" with sparkline; (2) center card "Live dispatch" with a toggle + vehicle avatars; (3)
  chat-style card with rule callouts ("❌ Capacity exceeded by 200 kg", "✅ License valid").
  GSAP: cards float in staggered, gentle parallax on scroll.
- **Feature grid**: 6 tiles (Vehicle Registry, Driver Compliance, Trip Dispatcher,
  Maintenance, Fuel & Expenses, Analytics) with lucide icons + one-liners.
- **Roles strip**: the four RBAC roles with a one-line job description each.
- **Footer**: "TRANSITOPS © 2026 · RBAC ENABLED", GitHub link.

## 0 · Auth — Login (`/login`) & Signup (`/signup`)

Style = reference-auth.png: full-height split card (`rounded-3xl` outer, mist canvas).
- **Left (white)**: form panel.
  - Signup: "Get Started Now" + name, email, password (min 8), **Role select** (the four
    roles, with one-line description under the select — RBAC is chosen at account creation),
    terms checkbox, indigo "Create account" button, "Have an account? Sign in".
  - Login: "Sign in to your account" + email, password, remember-me, indigo "Sign In"
    button, "New here? Get started". **No role field** — role comes from the account (D-007).
  - Inline error banner for `INVALID_CREDENTIALS` / `DUPLICATE_EMAIL`; field-level Zod errors.
- **Right (indigo, rounded-3xl, hidden < `md`)**: tagline "The simplest way to run your
  fleet." + subcopy; floating dashboard preview card (screenshot-style mock of our KPI
  cards/table, slight tilt + GSAP float); four role names as a logo-strip analogue.
- No social login buttons (no OAuth in scope — never ship dead buttons).
- After auth: store JWT, redirect to `/dashboard`.

## Global Shell (screens 1–8)

- **Sidebar** (left, dark): logo "TransitOps", nav — Dashboard, Fleet, Drivers, Trips,
  Maintenance, Fuel & Expenses, Analytics, Settings. Items hidden per RBAC.
- **Topbar**: global search input, user chip (avatar initials + name + role, e.g. "Raven K. · Dispatcher").
- **Status badges** (used everywhere, consistent colors):
  - Vehicle: Available=green, On Trip=blue, In Shop=amber, Retired=gray
  - Driver: Available=green, On Trip=blue, Off Duty=gray, Suspended=red
  - Trip: Draft=gray, Dispatched=blue, Completed=green, Cancelled=red
  - License expired: red "EXPIRED" tag next to date

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

## App Shell Styling Notes

- Sidebar: white/`slate-50` with slate text, indigo active-item pill (modernized from the
  mockup's dark sidebar to match the reference style); content on `slate-50`.
- INR amounts formatted `toLocaleString("en-IN")`.
- Use the `design-taste-frontend` + `impeccable` skills for every page build and polish pass.
