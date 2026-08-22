// Strongly-consistent fixed-window request counter, one Durable Object
// instance per rate-limited key (route + client IP, or route + login
// identifier) — Cloudflare guarantees at most one `fetch` runs at a time per
// DO instance, so every read-modify-write below can never race the way a
// KV read-then-write could.
//
// This replaces express-rate-limit's in-memory MemoryStore (which cannot
// survive a stateless/ephemeral Workers isolate) AND deliberately avoids
// Workers KV for this specific job: KV throttles to roughly 1 write/sec per
// key and is only eventually consistent across Cloudflare's edge locations,
// which would let a brute-force burst blow past the limit before the
// counter even catches up — i.e. KV "fails open" under exactly the load
// this exists to stop. A Durable Object has neither problem.
//
// State is persisted via `state.storage` (not just in-memory fields) so the
// count survives the DO being evicted/recreated between requests.
//
// Three request "actions", dispatched by pathname (chosen for both backward
// compatibility with the original single-action design and clarity over a
// generic action string):
//   /check (default) — atomically check-and-increment. Used by the generic
//     per-route action limiter (middleware/rateLimiter.ts's `rateLimiter`),
//     where every request — success or failure — consumes the budget.
//   /fail  — increment the key's failure count. Used by the login limiter
//     (middleware/rateLimiter.ts's `loginRateLimiter`), called only AFTER
//     real authentication has already run and come back wrong — never
//     pre-emptively, and never on success. This is deliberately the only
//     way a login attempt can ever count against a budget, so a correct
//     password is structurally incapable of being blocked by it.
//   /reset — clear the key's window entirely. Used by the login limiter on
//     a successful login, so one earlier mistyped password doesn't linger
//     against a teacher who then signs in correctly.
export interface RateLimitCheckBody {
  limit: number
  windowMs: number
}

interface StoredState {
  count: number
  windowStartMs: number
}

interface RateLimitResult {
  allowed: boolean
  retryAfterMs: number
}

export class RateLimiter {
  state: DurableObjectState

  constructor(state: DurableObjectState) {
    this.state = state
  }

  private async getCurrentWindow(now: number, windowMs: number): Promise<StoredState> {
    const stored = (await this.state.storage.get<StoredState>('state')) ?? { count: 0, windowStartMs: now }
    const windowExpired = now - stored.windowStartMs >= windowMs
    return windowExpired ? { count: 0, windowStartMs: now } : stored
  }

  private resultFor(current: StoredState, limit: number, windowMs: number, now: number): RateLimitResult {
    const allowed = current.count < limit
    const retryAfterMs = allowed ? 0 : Math.max(0, current.windowStartMs + windowMs - now)
    return { allowed, retryAfterMs }
  }

  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url)
    const { limit, windowMs } = (await request.json()) as RateLimitCheckBody
    const now = Date.now()

    if (pathname === '/fail') {
      const current = await this.getCurrentWindow(now, windowMs)
      current.count += 1
      await this.state.storage.put('state', current)
      return Response.json(this.resultFor(current, limit, windowMs, now))
    }

    if (pathname === '/reset') {
      await this.state.storage.deleteAll()
      return Response.json({ allowed: true, retryAfterMs: 0 })
    }

    // Default (/check): atomic check-and-increment, unchanged from the
    // original single-purpose implementation.
    const current = await this.getCurrentWindow(now, windowMs)
    if (current.count >= limit) {
      return Response.json(this.resultFor(current, limit, windowMs, now))
    }
    current.count += 1
    await this.state.storage.put('state', current)
    return Response.json({ allowed: true, retryAfterMs: 0 })
  }
}
