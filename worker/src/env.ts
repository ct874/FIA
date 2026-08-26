// Cloudflare bindings + vars available to every request. Mirrors what used
// to live in server/src/config/env.js, but Workers has no `process.env` /
// `dotenv` — everything arrives via the `env` object passed into `fetch()`.
// Non-secret values are set in wrangler.jsonc's `vars`; secrets are set via
// `wrangler secret put <NAME>` (production) or `.dev.vars` (local dev, both
// gitignored) — see docs/MIGRATION.md for the full list and how to set them.
export interface Env {
  // --- Bindings ---
  ASSETS: Fetcher
  RATE_LIMITER: DurableObjectNamespace

  // --- Non-secret vars (wrangler.jsonc `vars`) ---
  NODE_ENV: string
  FIREBASE_PROJECT_ID: string
  FIRESTORE_DATABASE_ID: string
  SUPER_ADMIN_LOGIN_ID: string
  JWT_EXPIRES_IN: string
  JWT_EXPIRES_IN_REMEMBER_ME: string
  CLIENT_ORIGIN: string

  // --- Secrets (`wrangler secret put`, never in wrangler.jsonc) ---
  FIREBASE_CLIENT_EMAIL: string
  FIREBASE_PRIVATE_KEY: string
  JWT_SECRET: string
  SUPER_ADMIN_PASSWORD: string

  // --- Local-dev-only, set in worker/.dev.vars, never in production ---
  // Routes every Firestore call at the Firestore Emulator instead of real
  // Firestore (see firestore/client.ts) — optional because it's genuinely
  // absent in production and in the "real Firebase project locally" setup.
  FIRESTORE_EMULATOR_HOST?: string
}

export function isProduction(env: Env): boolean {
  return env.NODE_ENV === 'production'
}

export function getFirestoreEmulatorHost(env: Env): string | undefined {
  return env.FIRESTORE_EMULATOR_HOST
}

// --- Startup configuration validation ------------------------------------
// Called once per isolate, before any login/bootstrap logic runs (see
// index.ts's ensureBootstrapped) — turns a missing secret into one clear,
// named error instead of a downstream crash (e.g. a bcrypt compare against
// `undefined`, or jose signing with an empty key) that surfaces as an
// unexplained 500 with no indication of which value is actually missing.
//
// This throws a plain Error (not ApiError) so the existing errorHandler
// masking still applies automatically: full message (which vars, and how to
// set them) in development, generic "Internal server error" in production —
// this function never needs its own prod/dev branching to "fail safely".
export function validateEnv(env: Env): void {
  const required: Array<[string, unknown]> = [
    ['FIREBASE_PROJECT_ID', env.FIREBASE_PROJECT_ID],
    ['FIRESTORE_DATABASE_ID', env.FIRESTORE_DATABASE_ID],
    ['SUPER_ADMIN_LOGIN_ID', env.SUPER_ADMIN_LOGIN_ID],
    ['JWT_EXPIRES_IN', env.JWT_EXPIRES_IN],
    ['JWT_EXPIRES_IN_REMEMBER_ME', env.JWT_EXPIRES_IN_REMEMBER_ME],
    ['JWT_SECRET', env.JWT_SECRET],
    ['SUPER_ADMIN_PASSWORD', env.SUPER_ADMIN_PASSWORD],
  ]
  const missing = required.filter(([, value]) => !value).map(([name]) => name)

  // Firestore credentials: either the emulator (local dev) or a real
  // service account (production, or a real Firebase project locally) —
  // never both required at once.
  const hasEmulator = Boolean(getFirestoreEmulatorHost(env))
  const hasServiceAccount = Boolean(env.FIREBASE_CLIENT_EMAIL) && Boolean(env.FIREBASE_PRIVATE_KEY)
  if (!hasEmulator && !hasServiceAccount) {
    missing.push('FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (or FIRESTORE_EMULATOR_HOST for local dev)')
  }

  if (missing.length === 0) return

  const hint = isProduction(env)
    ? 'Set these with `wrangler secret put <NAME>` (secrets) or in wrangler.jsonc `vars` (non-secret config).'
    : 'Set these in worker/.dev.vars — see worker/.dev.vars.example for the full list.'
  throw new Error(`Missing required Worker configuration: ${missing.join(', ')}. ${hint}`)
}

// Dev-only startup log of which required config is present — booleans only,
// NEVER the actual secret values, so this is safe to leave enabled. Skipped
// entirely in production to keep prod logs quiet (Workers Logs already
// capture unhandled errors regardless — see wrangler.jsonc's `observability`).
export function logConfigStatus(env: Env): void {
  if (isProduction(env)) return
  const hasEmulator = Boolean(getFirestoreEmulatorHost(env))
  console.log('[config] NODE_ENV:', env.NODE_ENV)
  console.log('[config] FIREBASE_PROJECT_ID:', env.FIREBASE_PROJECT_ID || '(missing)')
  console.log('[config] Firestore mode:', hasEmulator ? `emulator @ ${env.FIRESTORE_EMULATOR_HOST}` : 'real Firestore (service account)')
  console.log('[config] JWT_SECRET configured:', Boolean(env.JWT_SECRET))
  console.log('[config] SUPER_ADMIN_PASSWORD configured:', Boolean(env.SUPER_ADMIN_PASSWORD))
  console.log('[config] FIREBASE_CLIENT_EMAIL configured:', Boolean(env.FIREBASE_CLIENT_EMAIL))
  console.log('[config] FIREBASE_PRIVATE_KEY configured:', Boolean(env.FIREBASE_PRIVATE_KEY))
}

// Same CORS shape as the current Express app: an explicit allow-list plus
// (in non-production) any localhost/127.0.0.1 origin, since Vite's dev
// server auto-increments its port. Same-origin requests (the production
// SPA calling its own /api) send no meaningful cross-origin preflight at
// all, so this mostly matters during local dev and any transitional period
// where the old Vercel frontend still points at this Worker.
export function getAllowedOrigins(env: Env): string[] {
  return (env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

export function isOriginAllowed(env: Env, origin: string | null): boolean {
  if (!origin) return true // server-to-server / same-origin requests send no Origin header
  if (getAllowedOrigins(env).includes(origin)) return true
  if (!isProduction(env) && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return true
  return false
}
