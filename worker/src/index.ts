// Cloudflare Worker entry point. Two responsibilities, split cleanly:
//   1. `/api/*` and `/health` -> the Hono app (all REST API logic below).
//   2. Everything else -> `env.ASSETS.fetch()`, which serves the Vite build
//      (see wrangler.jsonc's `assets` config) and, thanks to
//      `not_found_handling: "single-page-application"`, returns index.html
//      (200, not 404) for any path that isn't a real static file — this is
//      what makes a hard refresh on /teacher/dashboard work instead of
//      404ing, without the Worker needing to know the SPA's route list.
//
// The Durable Object class backing the rate limiter (see
// durable-objects/RateLimiter.ts) MUST be exported from this file — it's
// the module wrangler.jsonc's `main` points at, which is where Wrangler's
// `durable_objects`/`migrations` config looks for the named class.
import { Hono } from 'hono'
import type { AppEnv } from './types'
import type { Env } from './env'
import { isOriginAllowed } from './env'
import apiRoutes from './routes/index'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { ensureDefaultSuperAdmin } from './services/superAdminBootstrap.service'
import { ensureSeedTours } from './repositories/tours.repository'

export { RateLimiter } from './durable-objects/RateLimiter'

const app = new Hono<AppEnv>()

// Cached at module scope so this only runs once per warm isolate (see
// comment below) instead of on every single request. A failed attempt
// clears the cache so the very next request retries cleanly.
let bootstrapPromise: Promise<void> | null = null

async function ensureBootstrapped(env: Env): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await ensureDefaultSuperAdmin(env)
      await ensureSeedTours(env)
    })().catch((error) => {
      bootstrapPromise = null
      throw error
    })
  }
  await bootstrapPromise
}

// --- One-time-per-isolate bootstrap -------------------------------------
// Express ran connectDB() -> ensureDefaultSuperAdmin() -> ensureSeedTours()
// once at process startup, before accepting any request. Workers has no
// equivalent "startup phase" — instead, the first request on a fresh
// isolate pays this (idempotent) cost once, cached via this module-level
// promise; every subsequent request on the same warm isolate skips it
// entirely. A failed attempt clears the cache so the very next request
// retries rather than being permanently stuck.

// /health deliberately skips this — it must reflect the Worker process
// itself being up (a liveness check), not whether Firestore happens to be
// reachable right now (that's a readiness concern). Coupling health to a
// Firestore-dependent bootstrap also made local debugging harder: a
// misconfigured/unreachable Firestore made even /health 500, hiding the
// distinction between "the Worker didn't start" and "a downstream
// dependency is unavailable" — exactly the confusion hit while diagnosing
// the login 500 locally.
app.use('*', async (c, next) => {
  if (c.req.path === '/health') return next()
  await ensureBootstrapped(c.env)
  await next()
})

// --- Security headers (helmet-equivalent) -------------------------------
app.use('*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'no-referrer')
  c.header('Cross-Origin-Resource-Policy', 'same-origin')
})

// --- CORS (scoped to /api — same-origin production requests don't need it
// at all; this matters during local dev, where Vite's dev server runs on a
// different port than `wrangler dev`, and during any transitional period
// where an old Vercel-hosted frontend still points at this Worker) --------
app.use('/api/*', async (c, next) => {
  const origin = c.req.header('Origin') ?? null
  const allowed = isOriginAllowed(c.env, origin)

  if (c.req.method === 'OPTIONS') {
    if (allowed && origin) {
      c.header('Access-Control-Allow-Origin', origin)
      c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }
    return c.body(null, 204)
  }

  if (allowed && origin) {
    c.header('Access-Control-Allow-Origin', origin)
  }

  await next()
})

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/api', apiRoutes)

app.onError(errorHandler)
app.notFound(notFoundHandler)

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/health' || url.pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx)
    }
    return env.ASSETS.fetch(request)
  },
}