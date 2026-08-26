# FIA Platform: Cloudflare Workers + Firestore Migration

Status: **migration complete and deployed**. The Worker is live at
`fia.ct-cb1.workers.dev` against the real `fia-career-tours` Firestore
project, and `server/` (the original Express/Mongoose backend this
document describes migrating away from) has been deleted from the repo —
the Cloudflare Worker below is the only backend. The rest of this document
is kept as a historical record of how that migration was done; treat any
"not yet deployed" / "server/ still exists" language below as describing
that point in time, not the current state.

## 1. Final folder structure

```
/
├── src/                        # React frontend (unchanged except constants.js)
├── worker/                     # THE Cloudflare Worker backend (server/ has been deleted)
│   ├── src/
│   │   ├── index.ts             # Worker entry: /api/* + /health -> Hono, else -> ASSETS (SPA)
│   │   ├── env.ts               # Env/bindings typing, CORS allow-list logic
│   │   ├── types.ts             # Hono app typing (Bindings/Variables)
│   │   ├── routes/              # 7 route files + index.ts, mirrors server/src/routes/*
│   │   ├── controllers/         # 11 controllers, mirrors server/src/controllers/*
│   │   ├── services/            # 15 services + tourCatalog.service.ts, business logic
│   │   ├── repositories/        # 1 per Firestore collection — the only files that call firestore/client.ts
│   │   ├── firestore/           # client.ts (REST ops), codec.ts (typed-value <-> JSON), auth.ts (OAuth token mint)
│   │   ├── auth/                # jwt.ts (jose HS256), password.ts (bcryptjs)
│   │   ├── middleware/          # authenticate, authenticateSchool, errorHandler, rateLimiter
│   │   ├── durable-objects/     # RateLimiter.ts
│   │   └── constants/           # grades, tours, afeOfficialColumns, afeExport
│   ├── scripts/                 # migration script goes here (see §11) — not yet created
│   ├── package.json
│   ├── tsconfig.json
│   └── wrangler.jsonc
├── firestore.rules             # deny-all (see §10)
├── firestore.indexes.json      # the 2 composite indexes this app actually needs (see §9)
└── docs/MIGRATION.md           # this file
```

## 2. Required npm packages

**`worker/package.json`** (already created):
- `hono` — Workers-native router/middleware, replaces Express
- `jose` — HS256 JWT sign/verify via Web Crypto, replaces `jsonwebtoken`
- `bcryptjs` — kept as-is (pure JS) so existing password hashes keep verifying
- `xlsx` (SheetJS) — school-list upload parsing, operates on `ArrayBuffer` (already the case in the original code)
- dev: `typescript`, `wrangler`, `@cloudflare/workers-types`

Root `package.json` gained convenience scripts only (`worker:*`, `deploy`) — no new frontend dependencies were needed; the frontend's existing `axios`/`xlsx`/etc. are untouched.

## 3. Required environment variables

**Non-secret** (`worker/wrangler.jsonc` → `vars`, already set with placeholders where a real value is needed):

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `production` / `staging` — controls error-message masking |
| `FIREBASE_PROJECT_ID` | your Firebase project ID — **replace the placeholder before deploying** |
| `FIRESTORE_DATABASE_ID` | `(default)` unless you created a named database |
| `SUPER_ADMIN_LOGIN_ID` | seed Super Admin login ID (matches `server/.env`'s `SUPER_ADMIN_LOGIN_ID`) |
| `JWT_EXPIRES_IN` | `1d` |
| `JWT_EXPIRES_IN_REMEMBER_ME` | `30d` |
| `CLIENT_ORIGIN` | comma-separated CORS allow-list (only matters pre-cutover / local dev — production is same-origin) |

**Secrets** (see §7 for exact commands — never put these in `wrangler.jsonc` or commit them):

| Secret | Purpose |
|---|---|
| `FIREBASE_CLIENT_EMAIL` | service account's `client_email` |
| `FIREBASE_PRIVATE_KEY` | service account's `private_key` (PEM, see §5 for the newline gotcha) |
| `JWT_SECRET` | same value as `server/.env`'s `JWT_SECRET` if you want existing tokens to keep verifying across both backends during cutover |
| `SUPER_ADMIN_PASSWORD` | seed Super Admin password (matches `server/.env`'s `SUPER_ADMIN_PASSWORD`) — only used the very first time `ensureDefaultSuperAdmin` runs against an empty `superAdmins` collection |

**Frontend** (`.env` / `.env.local`, already updated):
- Production: leave `VITE_API_BASE_URL` unset — `src/utils/constants.js` now defaults to `/api` (same-origin).
- Local dev: `.env.local` now points at `http://127.0.0.1:8787/api` (wrangler dev's default port).

## 4. Firebase setup instructions

1. Create a Firebase project (console.firebase.google.com) — or reuse an existing one if the client already has one.
2. Enable **Firestore** (Native mode, not Datastore mode). Pick a region close to your users (e.g. `asia-south1` for India) — Firestore round-trips from the Worker add real latency, more so if the Worker and the database are on opposite sides of the world.
3. **Create two projects if possible: one for production, one for development/testing.** This is what lets local `wrangler dev` and any staging environment exercise real Firestore behavior without ever touching production data. If a second project isn't available yet, use the **Firestore Emulator** instead (`firebase emulators:start --only firestore`) — `worker/src/firestore/client.ts` already has an emulator switch built in: set `FIRESTORE_EMULATOR_HOST=localhost:8080` in `worker/.dev.vars` and every Firestore call routes to the emulator over plain HTTP with no OAuth token needed.
4. Create a **service account** scoped as narrowly as possible: IAM & Admin → Service Accounts → Create → grant only `roles/datastore.user` (not Editor/Owner). Create a JSON key for it.
5. From that JSON key, you need exactly three values for the Worker secrets: `project_id`, `client_email`, `private_key`.
6. Deploy Firestore Security Rules and indexes (this repo already has both files at the root):
   ```
   firebase deploy --only firestore:rules,firestore:indexes --project <your-project-id>
   ```
   (Requires the Firebase CLI: `npm install -g firebase-tools`, `firebase login`.)

## 5. Cloudflare setup instructions

1. Cloudflare account with **Workers Paid** enabled. This is not optional: `bcryptjs` at cost-12 and the AFE CSV export both use real CPU time per request, well past the free plan's 10ms/request budget; Durable Objects (used for rate limiting) also require a paid plan.
2. If you want the production URL to be your own domain (`fia-domain.com`), that domain's DNS must be on Cloudflare (nameservers pointed at Cloudflare) before you can attach it to a Worker via a custom domain/route. This is a prerequisite outside this repo's scope — do it in the Cloudflare dashboard (Workers & Pages → your worker → Settings → Domains & Routes) once you're ready to cut over.
3. `wrangler login` (or set `CLOUDFLARE_API_TOKEN` for CI).
4. Edit `worker/wrangler.jsonc`: replace `FIREBASE_PROJECT_ID`'s placeholder with your real Firebase project ID.
5. Set secrets (see §7 below).
6. First deploy creates the Durable Object class and the Worker; subsequent deploys reuse them (the `migrations` block in `wrangler.jsonc` only runs once).

## 6. Wrangler commands

```bash
# from worker/
npm install                    # install Worker dependencies
npm run typecheck              # tsc --noEmit — already verified clean
npm run dev                    # wrangler dev — local Worker on http://127.0.0.1:8787
npm run deploy:dry-run         # bundles + validates config without deploying — already verified clean
npm run deploy                 # wrangler deploy — ACTUAL production deploy (not run yet)

# from repo root (convenience wrappers added to package.json)
npm run worker:install
npm run worker:dev
npm run worker:typecheck
npm run worker:deploy:dry-run
npm run deploy                 # vite build && wrangler deploy (frontend + worker together)
```

## 7. Cloudflare Worker secrets required

Run these from `worker/` before the first real deploy (each prompts for the value interactively, so nothing sensitive touches shell history):

```bash
npx wrangler secret put FIREBASE_CLIENT_EMAIL
npx wrangler secret put FIREBASE_PRIVATE_KEY   # paste the full PEM, including -----BEGIN/END----- lines
npx wrangler secret put JWT_SECRET
npx wrangler secret put SUPER_ADMIN_PASSWORD
```

For local dev, create `worker/.dev.vars` (already gitignored via the standard Wrangler pattern — **do not commit it**):
```
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
JWT_SECRET=...
SUPER_ADMIN_PASSWORD=...
# Optional — point at the Firestore Emulator instead of a real project:
# FIRESTORE_EMULATOR_HOST=localhost:8080
```
Note: if you paste the private key as a single line with literal `\n` sequences (common when copy-pasting out of the downloaded JSON), `worker/src/firestore/auth.ts` already unescapes them before parsing — this exact gotcha is called out in that file's comments because it's a very easy silent failure otherwise.

## 8. Local development

```bash
# terminal 1 — Worker (API)
cd worker
npm install
npm run dev            # http://127.0.0.1:8787

# terminal 2 — frontend
npm install
npm run dev             # http://localhost:5173, calls http://127.0.0.1:8787/api via .env.local
```

By default this talks to whatever Firebase project `worker/.dev.vars` points at. **Use a separate dev Firebase project or the emulator** (see §4) so local testing/poking never touches production data.

## 9. Firestore indexes

Only two composite indexes are needed — everything else in this app is either a single-field equality filter (covered by Firestore's automatic per-field indexes) or a query with no filter at all (the 4 AFE-export full-collection scans):

| Collection | Query | Why |
|---|---|---|
| `tours` | `deletedAt == null` + `orderBy code` | Active-tours list, sorted by numeric ID |
| `studentFeedbacks` | `udise == X` + `grade == Y` (via aggregation `count()`) | The 40% rule's per-submission quota check |

Both are already declared in `firestore.indexes.json` at the repo root. Deploy them with:
```bash
firebase deploy --only firestore:indexes --project <your-project-id>
```
Index builds take a few minutes on a non-empty collection — deploy indexes **before** pointing real traffic at the Worker. If a query you add later needs one Firestore doesn't have yet, Firestore's own error message includes a direct link to create it — that's the standard way to discover missing indexes during testing, in addition to the two predicted here.

We deliberately did **not** add composite indexes for `financialYear+month+district` (Targets), `udise+grade` (Student Feedback Batches), or `udise+tourId+month+financialYear` (Teacher Feedback) — those collections are looked up by their deterministic document ID directly (see §10), never queried with a matching filter+orderBy combination that would need one.

## 10. Firestore data model & security rules

Deterministic document IDs replace Mongo's compound unique indexes — the ID itself enforces uniqueness, with no separate index concept needed:

```
superAdmins/{normalizedLoginId}
schools/{udise}
tours/{tourId}                          + meta/tourCounter (highestCode counter doc)
targets/{financialYear}_{month}_{normalizedDistrict}
districtFeedbackTargets/{normalizedDistrict}
studentFeedbacks/{udise}_{studentDummyId}
studentFeedbackBatches/{udise}_{grade}
teacherFeedbacks/{udise}_{tourId}_{month}_{financialYear}
```

`normalizedLoginId`/`normalizedDistrict` = trimmed + lowercased (see `worker/src/firestore/codec.ts`'s `normalizeDistrict`) and every free-text ID segment is `encodeURIComponent`-escaped before being joined, so a district/login value containing spaces or punctuation can never collide with or invalidate a document ID. Important nuance: normalization is used **only** for the document ID — every business-logic comparison (e.g. the 40% rule's per-district lookup) still reads/matches the field's original stored casing, exactly like the Mongo version did, so this doesn't change which district a school's target resolves to.

**`firestore.rules`** (already created, deny-all): this Worker never talks to Firestore as an end-user client — every request goes through the REST API authenticated as the service account (see `worker/src/firestore/auth.ts`), which bypasses Security Rules entirely. The deny-all rule is defense in depth only, in case a Firebase Web API key for this project ever leaks.

## 11. Migration steps required (not yet run — no live data was touched)

This repo does not include an automated Mongo → Firestore data-copy script yet, since running it means writing to a real Firestore project and should happen deliberately, once, under your supervision. When you're ready to migrate real data:

1. Write a one-time Node script (run locally, using `mongoose` + the Firebase **Admin SDK** — that's fine outside the Worker, only the Worker itself can't use it) that reads all 8 Mongo collections and writes them into Firestore using the exact ID scheme in §10.
2. For every tour, write `deletedAt: null` **explicitly** (never omit it) — Firestore's `deletedAt == null` query does not match a document where the field is simply absent, so an omitted field would silently make the active-tours list empty.
3. Seed `meta/tourCounter` to the true historical highest `code` (at least `3`) before any new tour is created against Firestore.
4. Seed every school's `studentDummyIdSequence` to its current value (`0` if unset) — the atomic `increment` transform errors on a field that doesn't exist yet.
5. Rewrite every `school: ObjectId` reference across the 4 feedback collections to a plain `udise` string field.
6. After migrating, **generate the AFE Official CSV export from both the old (`server/`) and new (`worker/`) backends against the same underlying data, and diff the two files byte-for-byte.** This is the single best acceptance test for the whole migration — the AFE export exercises nearly every business rule in one deterministic output.
7. Only after that diff is clean should you point the frontend's `VITE_API_BASE_URL` (or DNS) at the Worker.

## 12. Known limitations / things to decide before going live

These don't block having a working, buildable Worker today, but they're real decisions for you before production traffic hits it:

- **Workers Paid plan is required**, not optional (see §5).
- **Region latency**: create the Firestore database close to your users' region; a Worker and a database on opposite sides of the world adds real per-request latency that a co-located Mongo Atlas + Render setup didn't have.
- **Timezone**: all date/month/financial-year derivation (`worker/src/utils/academicPeriod.ts`) is explicitly pinned to Asia/Kolkata regardless of the Worker's own UTC runtime clock — verify this matches your actual users' timezone if that's ever not India.
- **Domain/session continuity**: JWTs are stored in `localStorage`/`sessionStorage`, which is origin-scoped — if the production hostname changes as part of cutover (not just re-pointing the same domain's DNS), every logged-in user gets logged out. `jose` and `jsonwebtoken` produce byte-identical HS256 tokens for the same secret, so as long as the domain and `JWT_SECRET` both stay the same, sessions (and a rollback) survive cutover with no forced logout.
- **CORS** is still wired up (scoped to `/api/*`) for the transition window where an old Vercel-hosted frontend might still call this Worker cross-origin — safe to leave in place indefinitely, since a same-origin production request never triggers a preflight anyway.
- `vercel.json` is now dead configuration (no longer used once this Worker is live) — left in place rather than deleted, since removing it isn't required for this repo to work correctly either way.
