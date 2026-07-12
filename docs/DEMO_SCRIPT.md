# Demo Script — Section-5 Example Workflow

This is the literal script to run live for judges. It re-enacts the hackathon brief's example
workflow exactly, and doubles as the project's end-to-end regression test (N6, run against a
freshly seeded database, verified via curl against the live API and via browser click-through).

Demo logins (after `npm run seed`): see the table in `README.md`.

## The walkthrough

1. **Register a vehicle** — sign in as `manager@transitops.in` → Fleet → "Add Vehicle" →
   registration `GJ01ZZ0006`, name `Van-06`, type Van, max capacity **500 kg**, acquisition
   cost 600000, region Gandhinagar. Status starts `AVAILABLE`.
2. **Register a driver** — sign in as `safety@transitops.in` → Drivers → "Add Driver" →
   name `Alexa`, license `DL-99999`, category LMV, expiry a future date, contact any number.
   Status starts `AVAILABLE`.
3. **Create a trip** — sign in as `dispatcher@transitops.in` → Trips → Create Trip → source
   "Gandhinagar Depot", destination "Ahmedabad Hub", vehicle Van-06, driver Alexa, cargo
   **450 kg**, distance 38 km. 450 ≤ 500, so the live capacity banner stays green and the
   Dispatch button is enabled.
4. **Dispatch** — click Dispatch on the new trip card. Trip → `DISPATCHED`, Van-06 → `ON_TRIP`,
   Alexa → `ON_TRIP`, `startOdometer` captured from the vehicle's current reading.
5. **Complete** — click Complete, enter the final odometer, fuel used, fuel cost, and revenue.
   Trip → `COMPLETED`, Van-06 → `AVAILABLE` with the odometer updated, Alexa → `AVAILABLE`,
   and a FuelLog is auto-created (visible on the Fuel & Expenses page).
6. **Maintenance** — sign in as `manager@transitops.in` → Maintenance → "Log Service Record" →
   vehicle Van-06, service "Oil Change", any cost. Van-06 → `IN_SHOP` immediately, and
   disappears from the Vehicle picker on the Trips page (try creating a new trip and confirm
   Van-06 is not in the dropdown).
7. **Reports update** — Dashboard shows the completed trip's contribution to active/pending
   trip counts; Analytics (as `manager@transitops.in` or `finance@transitops.in`) shows Van-06's
   revenue, fuel cost, and maintenance cost feeding into its ROI row and the fleet-wide
   operational cost and fuel efficiency figures.
8. **The capacity rule, called out explicitly in the brief** — back on Trips, start a new trip
   with any 500 kg-capacity vehicle (e.g. VAN-02) and enter cargo weight **700 kg**. The banner
   reads exactly: *"Vehicle Capacity: 500 kg / Cargo Weight: 700 kg — Capacity exceeded by
   200 kg — dispatch blocked"*, and the Dispatch button is disabled. The same request against
   the API returns `400 CAPACITY_EXCEEDED`.

## Re-running as an automated check

Every step above was scripted against the live API with curl before being confirmed in the
browser, covering: vehicle/driver registration, capacity-respecting trip creation, dispatch
(atomic status flip + odometer capture), completion (atomic status flip + auto FuelLog),
maintenance (atomic vehicle status flip + dispatch-pool exclusion), report figures reflecting
the new data, and the exact brief-quoted capacity error. See `docs/AGENT_LOG.md` (N6 entry) and
`docs/PROMPT_ANKUSH_PHASE3.md` for the full curl transcript this script was derived from.

After a demo or test run, `npm run seed` restores the canonical seeded state.
