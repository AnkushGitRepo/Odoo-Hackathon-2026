# Ankush's Phase 6 Plan — V1-V7

Written at the same detail level as `PROMPT_DEV_PHASE6.md` for the project record. Executed
directly. **Pauses for explicit confirmation before setting real production secrets and before
the `target: "production"` deploy calls** — those are the two genuinely hard-to-reverse,
external-facing steps in this phase.

## Architecture (confirmed via the Vercel MCP tool before writing this plan)

- Team `ankushgupta` (`team_F6sTLc1Ej8RTK2NFW1YUCU8b`) has working access, no existing
  TransitOps project. The account already runs other apps as separate `*-client` + `*-api`
  Vercel project pairs — same pattern here: **`transitops-api`** (Express as a Vercel
  serverless function) and **`transitops-client`** (static Vite build), same account, no new
  credentials needed from Dev or anyone else.
- Deploying `client/` and `server/` as two independent Vercel projects (rather than one combined
  project with a mixed static+function build) is simpler to reason about and lower-risk this
  late, at the cost of needing explicit CORS + an absolute API URL — both already supported by
  the existing codebase design (CORS middleware already reads `CLIENT_ORIGIN` from env; just
  needs the client's env-driven base URL added).

## V1 — Client: environment-driven API base URL

`client/src/lib/api.ts` currently hardcodes `axios.create({ baseURL: "/api" })`, relying on
Vite's dev-only proxy (`vite.config.ts`'s `server.proxy`) to reach `localhost:5001`. In
production, client and API are different domains, so a relative path would hit the client's own
domain and 404. Change to:

```ts
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "/api" });
```

Local dev is **unaffected** — `VITE_API_URL` won't be set locally, so it falls back to `/api`
and the existing Vite proxy keeps working exactly as before. In production, Vercel's build sets
`VITE_API_URL` to the deployed API's URL (e.g. `https://transitops-api.vercel.app/api`).

## V2 — Server: Vercel-compatible serverless entry point

Vercel's Node.js runtime expects a file under `api/` that exports a request handler (or an
Express app directly — Vercel's builder recognizes and wraps Express apps without needing
`app.listen`). Plan:

1. Extract the Express app **construction** (middleware, route mounts, error handler — currently
   inline in `server/src/index.ts`'s top-level code) into a reusable function/module that both
   the existing local-dev entry and the new serverless entry can import, so there's exactly one
   source of truth for "what the app is," not two copies that can drift.
2. `server/src/index.ts` (existing) keeps its `main()` with `mongoose.connect()` +
   `app.listen()` — **this file is untouched in behavior**, `npm run dev` and `npm run build -w server` keep working exactly as they do today for local development.
3. New `server/api/index.ts` (Vercel's convention: files in `api/` become functions) imports the
   shared app-construction function, and on each invocation lazily connects to MongoDB using a
   **cached connection promise at module scope** (the standard serverless+Mongoose pattern —
   `mongoose.connect()` is only called once per warm container, reused across invocations,
   because a fresh connection per request would exhaust MongoDB's connection limit under load
   and add latency to every single request).
4. A `vercel.json` in `server/` (or `projectSettings` passed to the deploy tool) routes all
   incoming paths to that function.

## V3 — Deploy `transitops-api` (pauses for confirmation before production + secrets)

1. First deploy as `target: "preview"` with placeholder/test env vars to confirm the build
   succeeds and the function boots without errors — catches config mistakes before they matter.
2. **Stop and confirm with Ankush** before setting the real `MONGODB_URI` and `JWT_SECRET` as
   production environment variables in the Vercel project (these are the same secrets already
   in `server/.env` locally — reusing them means the deployed API talks to the same Atlas
   cluster and issues tokens compatible with the same user accounts).
3. **Stop and confirm** again before the `target: "production"` deploy call itself.
4. Note the resulting production URL (something like `https://transitops-api.vercel.app`).

## V4 — Deploy `transitops-client` (pauses for confirmation before production)

1. Set `VITE_API_URL` to `<transitops-api production URL>/api` as a build-time env var for this
   Vercel project.
2. Preview deploy first, click through a couple of pages against the preview URL to confirm the
   API calls actually resolve (not just that the static build succeeded).
3. **Stop and confirm** before the `target: "production"` deploy.
4. Note the resulting production URL (something like `https://transitops-client.vercel.app`).

## V5 — Close the CORS loop

The API's `CLIENT_ORIGIN` env var was set to a placeholder in V3 (the client's URL wasn't known
yet). Now that it is: update `CLIENT_ORIGIN` on the `transitops-api` project to the real
`transitops-client` production URL, and redeploy the API once more so CORS actually allows the
live client's requests through.

## V6 — Post-deploy smoke test against the live URLs

Re-run the N6 example workflow (register vehicle → driver → trip → dispatch → complete →
maintenance → analytics), this time against the **live** URLs, not `localhost:5001`/`:5173`.
This is the step that actually proves deployment worked end to end — a clean build and a
successful deploy don't guarantee CORS, env vars, and the Mongoose connection caching are all
correctly wired together; only a real request round-trip does.

## V7 — README + final submission pass

1. Add a "Live Demo" section near the top of `README.md` with both URLs.
2. Confirm the demo logins work against the live deployment (not just localhost).
3. One final `docs/TASKS.md` read-through to confirm every phase shows accurate status.

## When done

- Update `docs/TASKS.md`: V1-V7 → `done`, with the live URLs noted directly in the table or in
  README.
- Commit and push after each major step, not one giant commit at the end — if something breaks
  partway through the deploy chain, smaller commits make it easier to see exactly where.
