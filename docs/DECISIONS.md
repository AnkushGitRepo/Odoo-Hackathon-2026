# Decision Log

Append-only. Newest at the bottom. Decisions here are settled — don't re-litigate; add a new
entry if one must be reversed.

| ID | Date | Decision | Why |
|---|---|---|---|
| D-001 | 2026-07-12 | Next.js 15 monolith (App Router), no separate backend | One repo/process for 2-dev 8h team; server actions remove API boilerplate |
| D-002 | 2026-07-12 | MongoDB Atlas via Prisma (team choice, replaced SQLite proposal) | Team preference; Atlas gives replica set (required by Prisma Mongo connector for transactions) with zero setup |
| D-003 | 2026-07-12 | Role stored as enum on User; no separate Roles collection | 4 fixed roles; a join collection adds cost with no benefit in 8h. "Roles" entity from brief is satisfied by the enum |
| D-004 | 2026-07-12 | All business rules as pure functions in `src/lib/rules.ts` | Single testable source; server actions + UI share it; judges test rules hardest |
| D-005 | 2026-07-12 | Server actions (not REST API routes) for all mutations | Less code, typed end-to-end; nothing external consumes an API |
| D-006 | 2026-07-12 | Maintenance cost read from MaintenanceLog, never copied into Expense | Avoids double counting in operational cost |
| D-007 | 2026-07-12 | Login does NOT let the user pick a role (mockup shows a role dropdown) | Selectable role defeats RBAC; role comes from the seeded account. Judges get 4 demo logins instead |
| D-008 | 2026-07-12 | Work directly on `main`, hourly pushes, module ownership in docs/TASKS.md | Hackathon requires latest code on main + per-member commits; ownership prevents conflicts |
| D-009 | 2026-07-12 | Trip codes TR001… generated from a counter query at creation | Human-readable ids matching mockup; Mongo ObjectIds stay internal |
| D-010 | 2026-07-12 | **Reverses D-001/D-005**: MERN stack — React SPA (Vite) + Express REST API monorepo, not Next.js | Team choice (Ankush). Client and server split cleanly between two devs; npm workspaces keep one repo |
| D-011 | 2026-07-12 | **Reverses D-002 (partially)**: Mongoose ODM instead of Prisma; MongoDB stays | Team wanted plain MongoDB without Prisma; Mongoose confirmed over native driver for schema validation + unique indexes |
| D-012 | 2026-07-12 | Auth = JWT (jsonwebtoken) + bcryptjs, `Authorization: Bearer` header; Auth.js dropped with Next.js | Standard MERN pattern; requireAuth/requireRole middleware enforce RBAC server-side |
| D-013 | 2026-07-12 | API envelope `{ success, data?, error? }` on every endpoint | Consistent client handling + matches team convention |
