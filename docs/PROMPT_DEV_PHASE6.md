# Prompt for Dev Panchal (Antigravity) — Phase 6: V8, V9

Copy everything below the line into Antigravity as one prompt.

---

You are working in the TransitOps repo (`~/Odoo-Hackathon-2026`). The app is functionally
complete — every module, dark mode, responsive design, and a full security/QA pass (Phase 5,
S1-S6, including your RBAC fix and the PDF export) are all done and merged. Phase 6 is the very
last phase: Ankush is deploying a live URL (client + API to Vercel), and your job is a
**live-environment verification pass** once that's up, plus closing out your own submission
side. This is deliberately light — there is no new feature work in this phase.

## Before you start

1. `git pull origin main`.
2. In `docs/TASKS.md`, check whether V1-V7 (Ankush's deployment chain) show `done` with a live
   URL noted. **If they're not done yet, your V8 is blocked — don't start it early.** Do V9
   (which doesn't depend on deployment) while you wait, then come back to V8 once Ankush's
   deployment is confirmed live.

## V9 — Final submission check on your own side (do this first, no dependency)

1. Look at your own commit history (`git log --author="Dev Panchal" --oneline`, or however your
   commits are attributed) — confirm every commit message is clear and describes what it did.
   The hackathon grades individual contribution from commit history, so this is worth a few
   minutes: squash-worthy typo commits aren't a problem, but a commit message like "fixes" or
   "wip" doesn't communicate your actual work. You don't need to rewrite history — just make
   sure your most recent/substantial commits (M2, M4, M5, M6, N3, N5, N8, S4, S5, S6) are
   clearly described, since they're not going to be rewritten this late anyway.
2. Re-read `docs/AGENT_LOG.md` and confirm every session of yours has an entry — if anything's
   missing, add it now (time, "Dev · Antigravity", what shipped) for an accurate record.
3. Do one final click-through of your four pages (Drivers, Maintenance, Fuel & Expenses,
   Analytics) against **localhost** as a last local sanity check before the live version is up
   — you've already done this thoroughly in S4, this is just a quick "nothing regressed since
   then" pass, not a repeat of the full adversarial QA.

## V8 — Live-environment QA (only once Ankush's V1-V7 are marked done)

Once `docs/TASKS.md` shows the live URLs, this is specifically about bugs that **only show up
in production**, not things you already tested locally in S4:

1. **CORS**: open the live client URL, log in as each of your relevant roles, and confirm every
   API call on your four pages succeeds — a CORS misconfiguration would show up as network
   errors in the browser console (not a clean error message in the UI), so check the browser
   dev tools console specifically, not just whether the page "looks right."
2. **Cold starts**: the API is a Vercel serverless function — the very first request after a
   period of inactivity can be slow (a few seconds) while the function cold-starts and
   reconnects to MongoDB. Confirm the UI doesn't show a broken/empty state during that delay
   (loading skeletons should cover it) and that it resolves correctly once warm.
3. **Absolute vs. relative URLs**: specifically stress-test anything that constructs a URL
   client-side — the CSV export on Analytics, the PDF export you built in S6 (uses
   `window.print()`, should be unaffected, but confirm), and any place that might have
   hardcoded `localhost` instead of using the deployed API's actual origin.
4. **Full CRUD round-trip on live data**: create a driver, log a fuel entry, log a maintenance
   record, confirm they appear correctly — this proves the live API is actually writing to and
   reading from the same MongoDB Atlas cluster as local dev (it should be — same connection
   string), not some accidentally-different database.
5. Confirm dark mode toggle and responsive layout both still work correctly on the live URL —
   these are pure client-side behaviors so they should be unaffected by deployment, but worth
   one confirmation since this is the last check before submission.

If you find anything, fix it, verify the fix, and redeploy is **not your job** — flag it in
`docs/AGENT_LOG.md` and `docs/DECISIONS.md` and let Ankush redeploy after pulling your fix,
since he owns the deployment pipeline end to end.

## When done

- Update `docs/TASKS.md`: V8, V9 → `done`.
- Append lines to `docs/AGENT_LOG.md`.
- Commit under your own git identity and push.

This is the last task of the hackathon — thank you for the work across every phase.
