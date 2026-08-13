// Strongly-consistent fixed-window request counter, one Durable Object
// instance per rate-limited key (route + client IP) — Cloudflare guarantees
// at most one `fetch` runs at a time per DO instance, so the read-check-
// increment below can never race the way a KV read-then-write could.
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
export interface RateLimitCheckBody {
  limit: number
  windowMs: number
}

interface StoredState {
  count: number
  windowStartMs: number
}

export class RateLimiter {
  state: DurableObjectState

  constructor(state: DurableObjectState) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const { limit, windowMs } = (await request.json()) as RateLimitCheckBody
    const now = Date.now()

    const stored = (await this.state.storage.get<StoredState>('state')) ?? { count: 0, windowStartMs: now }

    const windowExpired = now - stored.windowStartMs >= windowMs
    const current: StoredState = windowExpired ? { count: 0, windowStartMs: now } : stored

    if (current.count >= limit) {
      const retryAfterMs = Math.max(0, current.windowStartMs + windowMs - now)
      return Response.json({ allowed: false, retryAfterMs })
    }

    current.count += 1
    await this.state.storage.put('state', current)
    return Response.json({ allowed: true })
  }
}
