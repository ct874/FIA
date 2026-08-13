// Ported from server/src/middleware/rateLimiters.js's `loginRateLimiter` —
// same limit (10 requests / 15 minutes), same message/status shape, same
// call sites (login endpoints + every "re-check a passcode" destructive
// endpoint), keyed by client IP exactly like the original (express-rate-
// limit's default keyGenerator is the request IP). The enforcement
// mechanism changed (Durable Object instead of an in-memory Node Map — see
// durable-objects/RateLimiter.ts for why), the semantics did not.
import type { Context, Next } from 'hono'
import type { AppEnv } from '../types'
import type { RateLimitCheckBody } from '../durable-objects/RateLimiter'

const WINDOW_MS = 15 * 60 * 1000
const LIMIT = 10

// `CF-Connecting-IP` is Cloudflare's authoritative client-IP header — unlike
// `X-Forwarded-For`, it cannot be spoofed by the client (Cloudflare sets it
// at the edge, stripping/overwriting any client-supplied value).
function getClientIp(c: Context<AppEnv>): string {
  return c.req.header('CF-Connecting-IP') ?? 'unknown'
}

// `routeKey` scopes the counter to a specific endpoint (e.g. 'auth-login',
// 'teacher-auth-login', 'schools-reset') so hitting one rate-limited route
// doesn't consume another's budget — same as the original applying a fresh
// `loginRateLimiter` instance's own internal Map per middleware usage site.
export function rateLimiter(routeKey: string) {
  return async function rateLimiterMiddleware(c: Context<AppEnv>, next: Next): Promise<void | Response> {
    const ip = getClientIp(c)
    const id = c.env.RATE_LIMITER.idFromName(`${routeKey}:${ip}`)
    const stub = c.env.RATE_LIMITER.get(id)

    const body: RateLimitCheckBody = { limit: LIMIT, windowMs: WINDOW_MS }
    const response = await stub.fetch('https://rate-limiter/check', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const result = (await response.json()) as { allowed: boolean; retryAfterMs?: number }

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil((result.retryAfterMs ?? WINDOW_MS) / 1000)
      c.header('Retry-After', String(retryAfterSeconds))
      return c.json(
        { success: false, message: 'Too many login attempts. Please try again in a few minutes.' },
        429,
      )
    }

    await next()
  }
}
