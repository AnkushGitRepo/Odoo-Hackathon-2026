# Ankush's Phase 3 Plan — N1, N2 (done), N4, N6, N7

Written at the same level of detail as `PROMPT_DEV_PHASE3.md` so the task board is fully
self-explanatory to either teammate or a judge reading the repo history. Executed directly
(no handoff needed), logged here for the record.

## N1 — Fix the `/api/trips` 404 regression (do first, blocks N6)

**Symptom found while dark-mode-testing the Trips page**: `GET /api/trips` returns
`{"success":false,"error":"No such endpoint.","code":"NOT_FOUND"}` even with a valid token,
while `/api/vehicles` on the same server works fine.

**Root cause to confirm**: `server/src/index.ts` currently only imports/mounts
`authRouter`, `dashboardRouter`, `vehiclesRouter`, `driversRouter`, `maintenanceRouter`,
`fuelLogsRouter`, `expensesRouter`, `analyticsRouter` — the `tripsRouter` import and
`app.use("/api/trips", tripsRouter)` line that existed when M3 was built are **missing**.
`server/src/routes/trips.ts` itself is untouched and intact on disk; only the mount in
`index.ts` was lost. Most likely cause: the `git pull` that merged Dev's M2/M4/M5/M6 branch
auto-merged `index.ts` (both branches touched the same import/mount block) and the trips
lines didn't survive the merge — worth confirming with `git log -p -- server/src/index.ts`
to see which commit dropped it, but the fix is the same regardless of cause.

**Fix**:
1. Add back `import tripsRouter from "./routes/trips.js";` and
   `app.use("/api/trips", tripsRouter);` in `server/src/index.ts`, in the same relative
   position as the other routers (alphabetical-ish grouping, doesn't matter functionally).
2. `npm run build -w server` — confirm clean compile.
3. Re-run the **full 15-case curl regression suite** from the original M3 verification
   (draft creation with no vehicle/driver, draft creation with a RETIRED vehicle expecting
   `VEHICLE_NOT_AVAILABLE`, draft creation exceeding capacity expecting `CAPACITY_EXCEEDED`,
   valid draft + dispatch, double-booking the same vehicle expecting `VEHICLE_NOT_AVAILABLE`
   on the second dispatch, dispatching with an expired-license driver expecting
   `DRIVER_LICENSE_EXPIRED`, completing with `endOdometer` below `startOdometer` expecting
   `ODOMETER_INVALID`, valid completion with FuelLog auto-creation, re-dispatching a
   completed trip expecting `TRIP_NOT_DRAFT`, cancelling a completed trip expecting
   `TRIP_ALREADY_CLOSED`, dispatching an unassigned draft expecting `TRIP_UNASSIGNED`,
   dispatch-then-cancel restoring vehicle+driver to `AVAILABLE`) against the live Atlas
   cluster — do not assume the fix works just because the route resolves; the whole point
   of the original verification was proving the rules engine, and a regression here means
   re-proving it.
4. Re-seed (`npm run seed`) to clear any test-created trips afterward.
5. Reload the Trips page in-browser and confirm the seeded trips (TR001-TR004) render on
   the Live Board again with correct statuses/badges.
6. Log this as a `D-0XX` decision (root cause + fix) and an `AGENT_LOG.md` line — a merge
   silently dropping a router mount is exactly the kind of thing future-me needs to remember
   to double check after every merge from now on (add a note to `AGENTS.md`'s merge/pull
   checklist: **after every `git pull` that touches `server/src/index.ts`, diff it and
   confirm every router that should be mounted still is**).

## N2 — Dark mode: shared infra + my pages (done this session)

Already shipped and merged:
- `client/src/lib/theme.ts` + `useTheme.ts`: light/dark state persisted to `localStorage`,
  respects `prefers-color-scheme` on first load.
- Tailwind v4 class-based dark mode: `@custom-variant dark (&:where(.dark, .dark *));` in
  `client/src/index.css`.
- Toggle button (sun/moon) in `AppShell.tsx` topbar.
- Dark variants on shared components: `AppShell.tsx` (sidebar, topbar, drawer, nav active/hover
  states), `Modal.tsx`, `StatusBadge.tsx` (all 5 tones).
- Dark variants on every page I own: `DashboardPage.tsx` + `StatusDonut.tsx`, `FleetPage.tsx`
  + `VehicleForm.tsx`, `TripsPage.tsx` + `TripForm.tsx` + `TripCard.tsx` +
  `LifecycleStepper.tsx` + `CompleteTripDialog.tsx`, `SettingsPage.tsx`.
- Landing (`/`) and auth pages (`/login`, `/signup`) **intentionally stay light-only** per
  DESIGN.md's Visual Language section ("Dark mode (bonus, app only): inverts content
  surfaces; landing/auth stay light") — no dark: classes needed there, this is correct as-is.
- Verified in-browser: toggled dark mode on, confirmed Dashboard/Fleet/Trips render with
  correct dark surfaces, legible text, and correctly-adjusted status badge tones; confirmed
  the toggle persists across page navigation and reload via `localStorage`.

## N4 — Responsive/mobile pass on my pages

Test at 375px (iPhone SE) and 768px (tablet). For each page:

- **Landing (`/`)**: already built mobile-first with `sm:`/`md:` breakpoints throughout
  (Hero, Features bento grid, Roles strip, Nav). Verify: nav center links collapse
  correctly (currently `hidden md:flex` — confirm no orphaned empty space on mobile), hero
  floating cards stack to 1 column below `md:`, feature bento grid collapses to 1 column.
- **Login / Signup**: `AuthLayout.tsx` already hides the indigo showcase panel below `md:`
  (`hidden ... md:flex`) — confirm the form panel alone looks complete and centered on a
  375px screen, no cut-off content, role-description text wraps cleanly on Signup.
- **Dashboard**: filter row (Vehicle Type/Status/Region selects) — confirm `flex-wrap`
  lets them wrap to multiple lines on narrow screens rather than overflowing; KPI grid
  already `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` — confirm 2-column mobile layout
  looks right; the Vehicle Status donut + Recent Trips grid (`lg:grid-cols-2`) should
  stack to 1 column below `lg:` — confirm the donut's `sm:flex-row` doesn't overflow at
  exactly 640px (the donut layout switches from stacked to side-by-side there).
- **Fleet**: filter/search row needs `flex-wrap` (same pattern as Dashboard); the vehicle
  table is wide (7-8 columns) — confirm `overflow-x-auto` on the table wrapper actually
  allows horizontal scroll on mobile rather than crushing columns; the Add/Edit modal
  (`VehicleForm` inside `Modal`) uses a 2-column grid for most fields — confirm it
  collapses to 1 column below `sm:` (check `grid-cols-2` usages in `VehicleForm.tsx`, add
  `sm:grid-cols-2` with base `grid-cols-1` if not already responsive).
- **Trips**: the Create Trip form + Live Board are `grid lg:grid-cols-2` — confirm clean
  single-column stacking below `lg:`; trip cards in the Live Board grid
  (`sm:grid-cols-2`) should go single-column below `sm:`; the Complete dialog's 2-column
  fuel fields (`grid-cols-2`) should collapse to 1 column on narrow screens — check and fix
  if not already responsive.
- **Settings**: General form is `sm:grid-cols-2` — confirm 1-column stacking below `sm:`;
  RBAC matrix table is wide (Role + 5 module columns) — confirm horizontal scroll works on
  mobile rather than the table forcing the whole page to overflow.

Fix any missing `flex-wrap`, `grid-cols-1 sm:grid-cols-2`, or `overflow-x-auto` gaps found
during the pass — these are the three recurring patterns; there shouldn't be exotic fixes
needed since the pages were built mobile-first from the start.

## N6 — E2E smoke test of the Section-5 example workflow

Re-enact the hackathon brief's example workflow end-to-end, once via curl (mechanical proof
against Atlas) and once via browser click-through (visual/UX proof), after N1 is fixed:

1. Register a vehicle "Van-06" with max capacity 500 kg → `POST /api/vehicles`, confirm
   `status: "AVAILABLE"`.
2. Register a driver "Alexa" with a valid (non-expired) license → `POST /api/drivers`,
   confirm `status: "AVAILABLE"`.
3. Create a trip with cargo weight 450 kg for Van-06/Alexa → `POST /api/trips`, confirm
   `201` with no rule violation (450 ≤ 500).
4. Dispatch it → `POST /api/trips/:id/dispatch`, confirm trip → `DISPATCHED`, vehicle → `ON_TRIP`, driver → `ON_TRIP`, `startOdometer` captured.
5. Complete it with a final odometer reading and fuel consumed →
   `POST /api/trips/:id/complete`, confirm trip → `COMPLETED`, vehicle → `AVAILABLE` with
   updated `odometerKm`, driver → `AVAILABLE`, and a `FuelLog` was auto-created
   (`GET /api/fuel-logs?vehicleId=...` shows the new entry with matching `tripId`).
6. Create a maintenance record (e.g. "Oil Change") for Van-06 →
   `POST /api/maintenance`, confirm vehicle → `IN_SHOP` and it disappears from
   `GET /api/vehicles/dispatchable`.
7. Confirm reports reflect the trip: `GET /api/dashboard/kpis` and `GET /api/analytics`
   both show the completed trip's revenue/fuel data flowing into fleet utilization,
   operational cost, and fuel efficiency numbers.
8. Also exercise the rule the brief calls out explicitly: create a second trip attempting
   700 kg cargo against Van-06's 500 kg capacity **before** step 3's trip is cleaned up (or
   against any AVAILABLE vehicle with a smaller capacity) and confirm the exact error
   message shape from the brief: capacity exceeded, dispatch blocked.
9. Browser pass: log in as `dispatcher@transitops.in`, repeat steps 3-4 through the Trip
   Dispatcher UI (confirm the live capacity-check banner fires correctly for an
   over-capacity attempt), then log in as `manager@transitops.in` and repeat step 6 through
   the Maintenance UI, confirming the vehicle disappears from the Trips page's vehicle
   picker while `IN_SHOP`.
10. Clean up test data with `npm run seed` afterward so the demo DB is back to its
    canonical state for judging.

Document this as a short checklist appended to `README.md`'s existing workflow section (or a
new `docs/DEMO_SCRIPT.md`) so it doubles as the literal script to run live for judges.

## N7 — Fresh-clone test + README polish

1. In a scratch directory outside the repo, `git clone` the repo fresh (or simulate via a
   throwaway copy with `node_modules` and `.env` deleted) to catch any onboarding step that
   only works because of leftover local state.
2. Follow `README.md`'s Quick Start literally, line by line: `npm install`, copy
   `.env.example` → `server/.env`, fill in `MONGODB_URI`/`JWT_SECRET`, `npm run seed`,
   `npm run dev`. Confirm zero deviation is needed from what's written.
3. Confirm the four demo logins in the README table actually work against the freshly
   seeded database.
4. Polish `README.md`: make sure the Features list and Business Rules list match what's
   actually shipped (they were written in Phase 0 before any code existed — sanity check
   against the real app now that everything is built), and add the judge-facing demo script
   from N6 as a "Demo Walkthrough" section so a judge (or teammate) can run the exact
   example workflow without guessing.
5. Confirm `npm run build` (root) is clean on the freshly cloned copy — this is the
   ultimate proof that nothing depends on uncommitted local state.

## When done

- Update `docs/TASKS.md`: N1, N4, N6, N7 → `done` (N2 already `done`).
- Append lines to `docs/AGENT_LOG.md` for each.
- Commit and push after each numbered task completes (not one giant commit at the end) so
  Dev sees incremental progress if he checks in mid-session.
