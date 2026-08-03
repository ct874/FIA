# FIA Platform — Super Admin Authentication Module

This module implements Super Admin authentication for the FIA (Foundation for
Innovation & Action) platform. It is the first of many modules planned for
this application (Teacher Panel, School Management, District Management,
Video Management, Reports, Analytics, Settings, and more), so the folder
structure on both the frontend and backend is organized to scale.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, React Router DOM, Axios
- Backend: Node.js, Express, MongoDB (Mongoose)
- Auth: JWT (Bearer token), passwords hashed with bcrypt

## Project Structure

```
FIA/
├─ src/                        # Frontend (Vite React app)
│  ├─ api/                     # Axios client (with auth interceptors) + API calls
│  ├─ components/
│  │  ├─ ui/                   # Reusable primitives (Button, TextInput, ...)
│  │  └─ branding/             # Logo and brand elements
│  ├─ context/                 # AuthContext + AuthProvider
│  ├─ hooks/                   # useAuth, ...
│  ├─ features/
│  │  ├─ auth/                 # Login page, form, validation
│  │  └─ home/                 # Empty /home placeholder (post-login landing)
│  ├─ routes/                  # AppRoutes, ProtectedRoute, GuestRoute
│  └─ utils/                   # constants, tokenStorage (localStorage/sessionStorage)
│
└─ server/                     # Backend (Express API)
   ├─ src/
   │  ├─ config/               # env.js, db.js
   │  ├─ models/                # SuperAdmin (more models to come)
   │  ├─ services/              # Business logic + default admin bootstrap
   │  ├─ controllers/           # Request handlers
   │  ├─ routes/                 # index.js mounts feature routers
   │  ├─ middleware/             # authenticate (Bearer JWT), error handler, rate limiter
   │  └─ utils/                  # ApiError, ApiResponse, asyncHandler, JWT
   └─ scripts/
      └─ seedSuperAdmin.js      # Manually re-runs the default Super Admin bootstrap
```

Future modules should follow the same pattern: a new folder under
`src/features/<module>` on the frontend, and new
model/service/controller/route files under `server/src/` mounted in
`server/src/routes/index.js` on the backend.

## Getting Started

### 1. Backend

```bash
cd server
cp .env.example .env   # then edit values, especially JWT_SECRET
npm install
npm run dev             # http://https://fia-bnum.onrender.com
```

Make sure MongoDB is running and `MONGO_URI` in `server/.env` points to it.
On startup the server automatically creates the default Super Admin account
if it doesn't already exist yet (idempotent — it will not create duplicates):

- Login ID: `fia@admin.com`
- Password: `fia@123`

These come from `SUPER_ADMIN_LOGIN_ID` / `SUPER_ADMIN_PASSWORD` in
`server/.env` (defaulting to the above if unset). You can also trigger the
same bootstrap manually at any time with `npm run seed:super-admin`.

### 2. Frontend

From the project root:

```bash
cp .env.example .env   # VITE_API_BASE_URL defaults to https://fia-bnum.onrender.com/api
npm install
npm run dev             # http://https://fia-nu.vercel.app/
```

Open `https://fia-nu.vercel.app/` — this is the Super Admin login page. After a
successful login you are redirected to `/home`, which is protected and
requires a valid session.

## Auth Flow Summary

- `POST /api/auth/login` — validates credentials, returns `{ token, admin }`
- `GET /api/auth/me` — returns the current Super Admin if the bearer token is valid
- `POST /api/auth/logout` — stateless no-op today (JWTs expire on their own); a
  stable hook point for future server-side token invalidation
- The Axios client attaches `Authorization: Bearer <token>` to every request
  and, on any `401` response, clears stored auth data and fires an
  `auth:unauthorized` event that logs the user out reactively
- **Remember Me** checked → token is stored in `localStorage` (survives
  browser close/reopen); unchecked → token is stored in `sessionStorage`
  (cleared when the browser/tab closes)
- On app load, `AuthProvider` looks for a stored token and calls `/api/auth/me`
  to validate it before deciding whether to treat the user as authenticated
- The frontend `ProtectedRoute` redirects unauthenticated users to `/`
- The frontend `GuestRoute` redirects already-authenticated users away from
  the login page to `/home`
