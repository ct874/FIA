# FIA Platform

FIA (Foundation for Innovation & Action) Career Tours platform — Super Admin
dashboard, School/Teacher Portal login, Teacher Feedback, Student Feedback,
and reporting (CSAT/ITP/NPS, exports) for AWS/Robotics/Music career tours.

## Architecture

```
React/Vite Frontend  →  Cloudflare Worker (Hono)  →  Firebase Firestore
```

One frontend, one backend. There is no Node/Express server and no MongoDB —
both were fully replaced by the Cloudflare Worker + Firestore stack below
(see [docs/MIGRATION.md](docs/MIGRATION.md) for how that migration happened).

- **Frontend**: React (Vite), Tailwind CSS, React Router DOM, Axios
- **Backend**: Cloudflare Workers, [Hono](https://hono.dev)
- **Database**: Firebase Firestore, accessed via its REST API directly from
  the Worker (no Admin SDK — Workers isolates can't run it)
- **Auth**: JWT (HS256, via `jose`), passwords hashed with `bcryptjs`

## Project Structure

```
FIA/
├─ src/                        # Frontend (Vite React app)
│  ├─ api/                     # Axios clients (admin + teacher, separate auth domains)
│  ├─ components/               # Reusable UI primitives + branding
│  ├─ context/, hooks/          # AuthContext/TeacherAuthContext + hooks
│  ├─ features/                 # auth, home, schools, teacherAuth, teacherPortal, ...
│  ├─ routes/                   # AppRoutes, ProtectedRoute, GuestRoute
│  └─ utils/                    # constants (single API_BASE_URL source), tokenStorage
│
├─ worker/                     # THE backend — Cloudflare Worker
│  ├─ src/
│  │  ├─ routes/, controllers/, services/, repositories/   # REST API layers
│  │  ├─ firestore/            # REST client, codec, OAuth token minting
│  │  ├─ auth/                 # JWT sign/verify, bcrypt
│  │  ├─ middleware/           # authenticate, CORS/error handling, rate limiting
│  │  ├─ durable-objects/      # RateLimiter (per-identifier login throttling)
│  │  └─ env.ts, index.ts, types.ts
│  ├─ package.json, tsconfig.json, wrangler.jsonc
│  └─ .dev.vars                # local secrets (gitignored) — see .dev.vars.example
│
├─ docs/MIGRATION.md           # history of the Express/Mongo -> Worker/Firestore migration
├─ firestore.rules, firestore.indexes.json
├─ .env.development / .env.production / .env.example
└─ vite.config.js, vercel.json
```

## Getting Started (local development)

Local dev runs **three** processes:

```bash
# 1. Firestore Emulator (no real Firebase project needed)
firebase emulators:start --only firestore

# 2. Cloudflare Worker (reads worker/.dev.vars for local secrets)
cd worker
cp .dev.vars.example .dev.vars   # then fill in values — see comments in that file
npm install
npm run dev                       # http://127.0.0.1:8787

# 3. Frontend
cd ..
npm install
npm run dev                       # http://localhost:5173
```

Open `http://localhost:5173/` — this is the Super Admin login page.
`.env.development` already points the frontend at `http://127.0.0.1:8787/api`;
`.env.production` (used by `vite build`) points it at same-origin `/api`
instead, since the deployed Worker serves both the built SPA and the API
from one Cloudflare deployment — see `src/utils/constants.js`, the single
place `VITE_API_BASE_URL` is read.

On first request, the Worker automatically creates the default Super Admin
account if it doesn't already exist (idempotent):

- Login ID: `fia@admin.com`
- Password: `fia@123`

These come from `SUPER_ADMIN_LOGIN_ID` (wrangler.jsonc) / `SUPER_ADMIN_PASSWORD`
(`worker/.dev.vars` locally, a `wrangler secret` in production).

## Deploying

```bash
npm run build                 # vite build -> dist/
npm run worker:typecheck      # cd worker && tsc --noEmit
npm run worker:deploy:dry-run # cd worker && wrangler deploy --dry-run
npm run deploy                # vite build && wrangler deploy (from worker/)
```

`wrangler.jsonc`'s `vars.FIREBASE_PROJECT_ID` must always match the real,
live Firebase project — see the comment on that field before ever changing
it.

## Auth Flow Summary

- `POST /api/auth/login` — validates credentials, returns `{ token, admin }`
- `GET /api/auth/me` — returns the current Super Admin if the bearer token is valid
- `POST /api/auth/logout` — stateless no-op (JWTs expire on their own)
- The Axios client attaches `Authorization: Bearer <token>` to every request
  and, on any `401` response, clears stored auth data and fires an
  `auth:unauthorized` event that logs the user out reactively
- Both **Remember Me** on and off store the token in `localStorage` (so
  every tab shares one session) — what actually differs is the JWT's expiry
  (`JWT_EXPIRES_IN` vs `JWT_EXPIRES_IN_REMEMBER_ME`) and a 30-hour
  inactivity timeout tracked client-side (see `src/utils/authSession.js`)
- On app load, `AuthProvider` looks for a stored token and calls `/api/auth/me`
  to validate it before deciding whether to treat the user as authenticated
- The frontend `ProtectedRoute` redirects unauthenticated users to `/`;
  `GuestRoute` redirects already-authenticated users away from the login
  page to `/home`
- The Teacher Portal (`/teacher/*`) is a separate auth domain — its own
  axios client, token storage, and context — so an admin and a school never
  share or clobber each other's session
