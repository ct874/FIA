// Two rate-limiting strategies, both backed by the same per-key Durable
// Object (see durable-objects/RateLimiter.ts):
//
// `rateLimiter(routeKey)` — the original strategy. Every request against
// this key (success or failure alike) consumes a shared per-IP budget. Kept
// as-is for the low-frequency, already-authenticated "re-check a passcode"
// destructive endpoints (tours create/delete, school reset/delete, etc.) —
// these aren't brute-force targets (they require a valid session token to
// even reach the passcode check), so a simple per-route/per-IP ceiling is
// adequate defense in depth.
//
// `loginRateLimiter(routeKey, identifierField)` — for the actual login
// endpoints. CRITICAL property: correct credentials must succeed no matter
// how many prior failed attempts exist against this identifier or IP. This
// middleware never rejects a request before real authentication has run —
// it always calls `next()` first, and only after seeing the real outcome
// does it touch any counter:
//   - a genuine ApiError(401) (wrong loginId/UDISE or password) is the
//     *only* thing that increments a failure count, against both the
//     normalized identifier (loginId/udise) and a much more generous
//     secondary per-IP budget;
//   - once an identifier/IP is over budget, a SUBSEQUENT wrong attempt's
//     401 is rewritten to 429 (via `c.res`, which Hono lets a wrapping
//     middleware overwrite after `next()` resolves) — but a request that
//     turns out to have the CORRECT password is a 2xx and is never
//     touched, regardless of how over-budget the identifier is;
//   - a successful login immediately resets the identifier's counter, so
//     an earlier typo never lingers.
// This is deliberately NOT a "peek and reject before checking credentials"
// gate (which is what most rate limiters, including the previous version
// of this one, do) — that shape is exactly what can lock out a legitimate
// user who knows the correct password, and is the wrong trade-off for a
// low-volume admin/teacher login endpoint where the real cost of "always
// check" is one bcrypt compare + one Firestore read.
import type { Context, Next } from 'hono'
import type { AppEnv } from '../types'
import type { RateLimitCheckBody } from '../durable-objects/RateLimiter'
import { ApiError } from '../utils/ApiError'

const WINDOW_MS = 15 * 60 * 1000
const LIMIT = 10

const LOGIN_IDENTIFIER_WINDOW_MS = 10 * 60 * 1000
const LOGIN_IDENTIFIER_LIMIT = 5
const LOGIN_IP_WINDOW_MS = 15 * 60 * 1000
const LOGIN_IP_LIMIT = 50

// `CF-Connecting-IP` is Cloudflare's authoritative client-IP header — unlike
// `X-Forwarded-For`, it cannot be spoofed by the client (Cloudflare sets it
// at the edge, stripping/overwriting any client-supplied value). Note this
// middleware is only ever reached for POST /login — the CORS middleware in
// index.ts answers `OPTIONS` requests directly and never routes them here,
// so a preflight can never affect (or be affected by) this limiter.
function getClientIp(c: Context<AppEnv>): string {
  return c.req.header('CF-Connecting-IP') ?? 'unknown'
}

function normalizeIdentifier(value: unknown): string | null {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized || null
}

interface RateLimitResult {
  allowed: boolean
  retryAfterMs?: number
}

async function callLimiter(c: Context<AppEnv>, action: '' | 'fail' | 'reset', key: string, body: RateLimitCheckBody): Promise<RateLimitResult> {
  const id = c.env.RATE_LIMITER.idFromName(key)
  const stub = c.env.RATE_LIMITER.get(id)
  const path = action ? `/${action}` : '/check'
  const response = await stub.fetch(`https://rate-limiter${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return (await response.json()) as RateLimitResult
}

function tooManyRequests(c: Context<AppEnv>, retryAfterMs: number | undefined) {
  const retryAfterSeconds = Math.ceil((retryAfterMs ?? WINDOW_MS) / 1000)
  c.header('Retry-After', String(retryAfterSeconds))
  return c.json(
    { success: false, message: 'Too many failed attempts. Please try again in a few minutes.' },
    429,
  )
}

// `routeKey` scopes the counter to a specific endpoint (e.g. 'auth-login',
// 'schools-reset') so hitting one rate-limited route doesn't consume
// another's budget — each usage site gets its own Durable Object key
// (`idFromName` is a pure function of the key string), so unrelated
// routes/users never contend on the same DO instance.
export function rateLimiter(routeKey: string) {
  return async function rateLimiterMiddleware(c: Context<AppEnv>, next: Next): Promise<void | Response> {
    const ip = getClientIp(c)
    const body: RateLimitCheckBody = { limit: LIMIT, windowMs: WINDOW_MS }
    const result = await callLimiter(c, '', `${routeKey}:${ip}`, body)

    if (!result.allowed) {
      return tooManyRequests(c, result.retryAfterMs)
    }

    await next()
  }
}

// See file header. `identifierField` is the request-body field holding the
// login identifier (`loginId` for Super Admin, `udise` for the Teacher
// Portal).
export function loginRateLimiter(routeKey: string, identifierField: string) {
  return async function loginRateLimiterMiddleware(c: Context<AppEnv>, next: Next): Promise<void | Response> {
    const ip = getClientIp(c)

    let identifier: string | null = null
    try {
      const parsedBody = await c.req.json()
      identifier = normalizeIdentifier((parsedBody as Record<string, unknown>)?.[identifierField])
    } catch {
      // Malformed/missing JSON body — the controller will reject it with its
      // own 400 shortly; that's not a credential failure, so it never
      // touches either budget below.
    }

    const identifierKey = identifier ? `${routeKey}:id:${identifier}` : null
    const ipKey = `${routeKey}:ip:${ip}`

    // Always run the real authentication check FIRST. No pre-check, no
    // gate — this is what guarantees a correct password can never be
    // blocked by a prior failure count, on this identifier or this IP,
    // no matter how large.
    //
    // NOTE: Hono's `compose()` converts a downstream throw into a Response
    // via `app.onError` at the exact dispatch level where it's thrown, then
    // returns normally — it does NOT re-throw past this middleware's own
    // `next()` call. So the reliable way to observe the controller's
    // outcome is `c.res.status` after `next()` resolves, not a `catch`
    // here. The `catch` below is only a defensive fallback for the
    // (in normal operation, unreachable) case of a raw throw that bypasses
    // `onError` entirely.
    let caught: unknown = null
    try {
      await next()
    } catch (error) {
      caught = error
    }

    const status = c.res?.status ?? (caught instanceof ApiError ? caught.statusCode : undefined)

    if (status === 401) {
      // A wrong loginId/UDISE or password. This is the ONLY outcome that
      // ever counts against either budget. Everything else (2xx, 400
      // validation, 500s) is left alone so a flaky dependency, a typo'd
      // request body, or — the point of this whole design — a CORRECT
      // password never contributes to or is blocked by a lockout.
      const [idResult, ipResult] = await Promise.all([
        identifierKey
          ? callLimiter(c, 'fail', identifierKey, { limit: LOGIN_IDENTIFIER_LIMIT, windowMs: LOGIN_IDENTIFIER_WINDOW_MS })
          : Promise.resolve<RateLimitResult>({ allowed: true }),
        callLimiter(c, 'fail', ipKey, { limit: LOGIN_IP_LIMIT, windowMs: LOGIN_IP_WINDOW_MS }),
      ])

      if (!idResult.allowed || !ipResult.allowed) {
        // Rewrite THIS already-wrong attempt's response from 401 to 429 —
        // we're not retroactively blocking a success, we're re-labeling a
        // real credential failure that also happens to be the one that
        // tipped (or continued) an existing lockout.
        const retryAfterMs = Math.max(idResult.retryAfterMs ?? 0, ipResult.retryAfterMs ?? 0)
        c.res = tooManyRequests(c, retryAfterMs)
        return
      }
    } else if (status !== undefined && status < 400 && identifierKey) {
      // Successful login — clear this identifier's failure history
      // immediately so an earlier mistake never lingers.
      await callLimiter(c, 'reset', identifierKey, { limit: LOGIN_IDENTIFIER_LIMIT, windowMs: LOGIN_IDENTIFIER_WINDOW_MS })
    }

    if (caught) throw caught
  }
}
