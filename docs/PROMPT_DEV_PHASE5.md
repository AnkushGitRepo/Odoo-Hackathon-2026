# Prompt for Dev Panchal (Antigravity) — Phase 5: S4, S5, (optional S6)

Copy everything below the line into Antigravity as one prompt.

---

You are working in the TransitOps repo (`~/Odoo-Hackathon-2026`). Every module is done, dark
mode and responsive are done on every page (yours included — thank you, and the
`text-mist-500`/`text-mist-800` fix landed clean, confirmed via `grep`). This session is **not**
new features — it's an adversarial QA pass and a security self-check on the four pages/routes
you own (Drivers, Maintenance, Fuel & Expenses, Analytics), plus one optional bonus if you have
time left over. Deployment is explicitly **not** part of this phase — it's deferred to a final
phase after everything else is settled, so don't spend time on hosting/build configs here.

Ankush is doing the equivalent pass on his own pages/routes (Fleet, Trips, Dashboard, Settings)
plus server-wide security hardening (rate limiting on auth, secrets audit) and the submission
checklist. **None of that touches your files or blocks you** — start immediately.

## Before you start

1. `git pull origin main`.
2. Set your git identity if this is a new session.
3. In `docs/TASKS.md`, mark S4 and S5 `doing` with your name, commit and push that one-line
   change immediately. **Note**: your last merge accidentally reverted Ankush's N4/N6/N7 status
   from `done` back to `todo` in this same file (already fixed by Ankush in a follow-up commit)
   — when you pull this time, do a quick look at `docs/TASKS.md` before editing it to make sure
   you're editing the current version, not an older cached one.

## S4 — Adversarial QA pass on Drivers, Maintenance, Fuel & Expenses, Analytics

This is different from a normal test-the-happy-path click-through. For each of your four pages,
actively try to break it. Log in as each of the four demo accounts
(`manager@transitops.in` / `dispatcher@transitops.in` / `safety@transitops.in` /
`finance@transitops.in`, password `password123` for all) and check:

### RBAC boundaries (per AGENTS.md's matrix)
- Drivers: `FLEET_MANAGER` and `SAFETY_OFFICER` get full access (Add Driver button, status
  toggle work); `DISPATCHER` and `FINANCIAL_ANALYST` get view-only (no Add button, no status
  toggle control, table still visible).
- Maintenance: only `FLEET_MANAGER` gets full access; the other three roles see the table
  read-only, no "Log Service Record" button, no "Close" action.
- Fuel & Expenses: only `FINANCIAL_ANALYST` gets full access; the other three roles see both
  tables read-only, no "Log Fuel" / "Add Expense" buttons.
- Analytics: only `FLEET_MANAGER` and `FINANCIAL_ANALYST` can even reach the page (it's hidden
  from `DISPATCHER`/`SAFETY_OFFICER` in the sidebar) — confirm navigating there directly by URL
  as one of those two roles is blocked or redirected, not just hidden from the nav.

If any role sees a button or control it shouldn't, or a role that should have access is missing
one, that's a real bug — fix it in the relevant `*Page.tsx` (client-side gating via
`can(user.role, module)`) and double check the matching server route's `requireRole(...)` call
matches.

### Input validation & error handling
- Try submitting each Add form (Driver, Maintenance record, Fuel log, Expense) with a required
  field empty — confirm the browser's native `required` validation or a clean inline error
  fires, not a silent failure or an unhandled exception in the console.
- Try a negative number in Cost/Liters/Amount fields — the server has `min(0)` (or `min(0.1)`
  for liters) in its Zod schemas, so it should reject with a `400 VALIDATION` error; confirm the
  UI surfaces that error message to the user rather than just failing silently.
- Try adding a driver with a `licenseNumber` that already exists — confirm the
  `409 DUPLICATE_LICENSE` error shows in the modal, not a generic failure.
- Try closing an already-`COMPLETED` maintenance record (if you can trigger the Close button
  twice quickly, or via a second browser tab) — confirm `400 MAINTENANCE_ALREADY_CLOSED` is
  handled cleanly, not a crash.
- Rapid-double-click every "Save"/"Add" button in your modals once — confirm it doesn't create
  two records from one submit (the buttons should already disable while `saving`/`busy` is
  true; verify that's actually working, not just present in the code).

### Data correctness
- After adding a new fuel log or expense on the Fuel & Expenses page, confirm the "Operational
  Cost by Vehicle" table and the "Total Operational Cost" banner both update to reflect it
  (they refetch via `fetchData()` after `onAdded` — confirm this actually happens, not just
  that the modal closes).
- On Analytics, confirm the numbers you see match what a quick `GET /api/analytics` call
  returns for the same login (spot check 2-3 figures, not everything).
- On Drivers, confirm a driver with `licenseExpiry` in the past shows the red "EXPIRED" badge,
  and a driver with `status: "SUSPENDED"` shows the correct badge tone in both light and dark
  mode.

Document anything you find (even small things) as a line in `docs/AGENT_LOG.md` when you fix
it — "found X, fixed by Y" is exactly the kind of entry that belongs there.

## S5 — Security self-check on your own server routes

Re-review `server/src/routes/drivers.ts`, `maintenance.ts`, `fuelLogs.ts`, `expenses.ts`,
`analytics.ts` against this checklist (all of these should already be correct from Phase 2 —
this is a final confirmation pass, not an expectation of finding major problems):

1. Every route that writes data has `requireAuth` **and** the correct `requireRole(...)` list
   matching the RBAC matrix in AGENTS.md exactly (re-read the matrix table there, don't rely on
   memory).
2. Every `POST`/`PUT` route validates its body with a Zod schema before touching the database —
   `grep -n "safeParse" server/src/routes/{drivers,maintenance,fuelLogs,expenses,analytics}.ts`
   should show a match in every file.
3. `grep -rn ": any" server/src/routes/{drivers,maintenance,fuelLogs,expenses,analytics}.ts` —
   should return nothing (the `Record<string, any>` filter objects were already fixed to
   `Record<string, unknown>` in an earlier review; confirm that's still true).
4. `grep -rn "console.log" server/src/routes/{drivers,maintenance,fuelLogs,expenses,analytics}.ts client/src/pages/{drivers,maintenance,expenses,analytics}` —
   should return nothing. Remove any you find (use `console.error` only inside actual catch
   blocks if genuinely needed for debugging, and only temporarily).
5. Confirm no route ever returns a raw Mongoose error message or stack trace to the client —
   every error path should go through `fail(res, status, code, message)` with a clean,
   human-written message, never `err.message` from a caught exception passed straight through.

## S6 — Optional stretch: PDF export on Analytics (only if S4 and S5 are fully done)

Add a "Export PDF" button next to the existing "Export CSV" button on the Analytics page.
**Recommended approach given the time budget**: don't add a server-side PDF library (extra
dependency, extra route, more surface area to get wrong this late) — instead use the browser's
native print-to-PDF via a dedicated print stylesheet:

1. Add a `@media print` block (in `client/src/index.css` or a new `print.css` imported there)
   that hides the sidebar, topbar, and the "Export CSV"/"Export PDF" buttons themselves, and
   makes the KPI cards, chart, and tables print cleanly on a light background (dark mode should
   not print dark — force light colors under `@media print` regardless of the current theme).
2. The "Export PDF" button just calls `window.print()` — the browser's own print dialog lets
   the user choose "Save as PDF" as the destination.
3. Test it: click Export PDF, confirm the print preview shows a clean report without app chrome,
   save as PDF, open the file, confirm it's legible.

This is explicitly optional and lowest priority — skip it entirely if S4/S5 aren't both
finished with time to spare.

## Verify before pushing

1. `npm run build` from the repo root — zero errors.
2. Confirm every bug you found and fixed is actually fixed by re-testing that specific
   scenario, not just by reading the diff.
3. `grep -rn "console.log"` and `grep -rn ": any"` across your files — both should return
   nothing.

## When done

- Update `docs/TASKS.md`: S4, S5 (and S6 if you did it) → `done`. **Check the file's current
  content before editing** — see the note in "Before you start" above.
- Append lines to `docs/AGENT_LOG.md` for what you found and fixed.
- Log any judgment call in `docs/DECISIONS.md` with a new `D-0XX` entry — check the last entry
  number first.
- Commit under your own git identity and push. Run `npm run build` one final time before the
  push.
