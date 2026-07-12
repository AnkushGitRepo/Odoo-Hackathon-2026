# CLAUDE.md

**Read [AGENTS.md](./AGENTS.md) first — it is the canonical agent guide for this repo.**
Everything there (conventions, business rules, git workflow, session ritual) applies verbatim.

Claude-specific notes:

- Team sync: teammate uses Antigravity and reads AGENTS.md; keep the two files consistent by
  putting shared guidance in AGENTS.md only. This file stays a thin pointer.
- Skills available in this project: `gsap` (animations), `design-taste-frontend` (UI polish),
  impeccable (frontend quality). Use them for Phase 6 polish work.
- Verification: use `agent-browser` / Playwright to smoke-test the Section-5 example workflow
  (register vehicle → driver → trip 450/500 kg → dispatch → complete → maintenance → analytics).
- Business-rule changes require updating: `server/src/lib/rules.ts`, its unit tests, and the
  rules tables in README.md + AGENTS.md. All four together.
