# Ankush's Phase 5 Plan — S1, S2, S3

Written at the same detail level as `PROMPT_DEV_PHASE5.md` for the project record. Executed
directly (no handoff needed).

## S1 — Security hardening

1. **Secrets audit.** `grep -rn "mongodb+srv://\|mongodb://" --include="*.ts" --include="*.md"`
   across the repo (excluding `node_modules`) — the only hits should be the placeholder in
   `.env.example` and prose references in docs, never a real connection string. Confirm
   `server/.env` is untracked: `git ls-files | grep "\.env$"` should return nothing. Confirm
   `.gitignore` covers `.env`, `.env.local`, and `*/.env` (already does, verify it still does
   after all the churn this session).
2. **Rate limiting on auth.** Install `express-rate-limit` and apply a limiter to
   `POST /api/auth/login` and `POST /api/auth/register` specifically (the brute-force /
   credential-stuffing targets) — something like 20 requests per 15 minutes per IP, returning
   a `429` with the same envelope shape (`{ success: false, error, code: "RATE_LIMITED" }`) so
   the client's existing `ApiError` handling picks it up without any client-side changes. Don't
   rate-limit every route; the hackathon's read-heavy GETs don't need it and over-limiting risks
   breaking the demo for judges clicking around quickly.
3. **CORS review.** `server/src/index.ts`'s CORS config only allows `process.env.CLIENT_ORIGIN`
   (default `http://localhost:5173`) — confirm this is still a single fixed origin, not
   accidentally opened to `*` anywhere.
4. **Error-message leakage check.** Re-read the central error handler and a sample of route
   catch blocks — confirm no route ever forwards a raw `err.message` or stack trace to the
   client; every failure path should produce a clean, pre-written message via `fail()`.
5. **Quick XSS sanity check.** Create a vehicle/driver/trip with a name containing
   `<script>alert(1)</script>` via the API, confirm it renders as inert text (not executed) on
   the relevant page — React's default JSX escaping should already guarantee this since the
   codebase has zero `dangerouslySetInnerHTML` calls, but worth one live confirmation rather
   than assuming.

## S2 — Adversarial QA on Fleet, Trips, Dashboard, Settings

Boundary and edge cases beyond the golden-path tests already run in Phase 2/3:

1. **Fleet**: create a vehicle with a registration number differing only in case from an
   existing one (e.g. `gj01ab4521` vs `GJ01AB4521`) — confirm the server's `.toUpperCase()`
   normalization still catches it as a duplicate. Try retiring an already-`RETIRED` vehicle
   (via direct API call, since the UI hides the Retire button once retired) — confirm it's
   idempotent (no error, no double side effects) rather than crashing.
2. **Trips**: cargo weight **exactly equal** to vehicle capacity (e.g. 500 kg cargo on a 500 kg
   vehicle) — the rule is "must not exceed," so this must be **allowed**, not rejected; confirm
   `checkCapacity` in `lib/rules.ts` uses `>` not `>=`. Try dispatching a trip whose driver has
   `licenseExpiry` exactly at the current moment (boundary) — should read as expired per the
   `< now` comparison. Try completing a trip with `endOdometer` exactly equal to
   `startOdometer` (zero-distance trip) — should be allowed (rule is "cannot be less than"),
   confirm fuel efficiency math doesn't divide by zero anywhere downstream.
3. **Dashboard**: apply a filter combination that matches zero vehicles (e.g. type=BIKE +
   region="Nonexistent") — confirm `fleetUtilizationPct` renders `0%` cleanly, not `NaN%` or a
   crash (the server already guards `activeVehicles === 0 ? 0 : ...`, confirm the client
   doesn't independently divide anywhere).
4. **Settings**: confirm the RBAC matrix table renders correctly and doesn't throw for a role
   with zero "full" access anywhere (there isn't one currently, but the component shouldn't
   assume every role has at least one full-access module).

Fix anything found, log it in `docs/AGENT_LOG.md` and `docs/DECISIONS.md` if it reflects a
judgment call.

## S3 — Docs & submission checklist

1. **Repo visibility.** Confirm on github.com that the repo is Public (I don't have `gh auth`
   in this session to check programmatically — flag this for a manual confirmation).
2. **Docs-vs-reality spot check.** Pick 3-4 endpoints from `AGENTS.md`'s API contract at random
   and confirm the actual route file matches the documented request/response shape exactly
   (contract drift is the kind of thing that accumulates silently across a long build).
3. **README accuracy.** After Dev's optional S6 (PDF export) lands or doesn't, do one final
   pass confirming the Features and Bonus Features Delivered lists match what's actually
   shipped — add or remove a line as needed.
4. **Commit hygiene.** Confirm no stray files made it into the repo (`.DS_Store`, leftover test
   scratch files, an accidentally-committed `node_modules`) — `git ls-files | grep -i "DS_Store\|\.local"`
   should return nothing unexpected.
5. **Task board accuracy.** After Dev pushes his Phase 5 work, `git pull`, then re-read
   `docs/TASKS.md` fully (not just diff it) to confirm every status reflects reality — Phase 3
   already taught us a fast-moving merge can silently revert doc status.

## When done

- Update `docs/TASKS.md`: S1, S2, S3 → `done`.
- Commit and push after each completes, not one giant commit at the end.
