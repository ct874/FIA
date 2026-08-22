import { rateLimit, ipKeyGenerator } from 'express-rate-limit'

// Destructive "re-check a passcode" admin actions (tour create/delete,
// school reset/delete, target verify-access, district target create) — low
// frequency, already behind a valid session token, so a simple per-route
// ceiling is adequate defense in depth. Not a brute-force target the way
// login is, so every request (success or failure) counts, and it's fine to
// reject before the handler runs (express-rate-limit's normal shape).
const ACTION_WINDOW_MS = 15 * 60 * 1000
const ACTION_LIMIT = 10

// Login brute-force protection is split into two independent budgets — see
// createLoginRateLimiters() below for why.
const LOGIN_IDENTIFIER_WINDOW_MS = 10 * 60 * 1000
const LOGIN_IDENTIFIER_LIMIT = 5
const LOGIN_IP_WINDOW_MS = 15 * 60 * 1000
const LOGIN_IP_LIMIT = 50

const TOO_MANY_ATTEMPTS_MESSAGE = {
  success: false,
  message: 'Too many failed attempts. Please try again in a few minutes.',
}

function normalizeIdentifier(value) {
  return String(value ?? '').trim().toLowerCase()
}

// Every call site below gets its OWN limiter instance/store. The previous
// design — one shared `loginRateLimiter` singleton imported into 7
// unrelated routes (login, tour create/delete, school reset/delete, target
// verify-access, district target create) — meant they all secretly drained
// the SAME budget. A factory call per route fixes that.
export function createActionRateLimiter() {
  return rateLimit({
    windowMs: ACTION_WINDOW_MS,
    limit: ACTION_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    message: TOO_MANY_ATTEMPTS_MESSAGE,
  })
}

// Fixed-window failure counter, scoped to one createLoginRateLimiters()
// call (own Map per route — see comment above). Deliberately NOT built on
// express-rate-limit's own middleware: that package checks-and-rejects
// BEFORE the route handler runs, which is exactly the shape that can lock
// out someone who is about to type the correct password. This one instead
// only ever records an outcome AFTER the real controller has run.
function createFailureTracker() {
  const store = new Map()

  function recordFailure(key, limit, windowMs) {
    const now = Date.now()
    const existing = store.get(key)
    const windowExpired = !existing || now - existing.windowStartMs >= windowMs
    const current = windowExpired ? { count: 0, windowStartMs: now } : existing
    current.count += 1
    store.set(key, current)
    const overLimit = current.count >= limit
    const retryAfterMs = overLimit ? Math.max(0, current.windowStartMs + windowMs - now) : 0
    return { overLimit, retryAfterMs }
  }

  function reset(key) {
    store.delete(key)
  }

  return { recordFailure, reset }
}

// A single middleware covering both budgets for a login endpoint, keyed
// away from "one shared IP = one budget" (the cause of a school/classroom/
// NAT network getting falsely locked out after enough *successful*
// logins), AND away from "block before checking credentials" (the cause of
// a legitimate user with the CORRECT password being unable to log in just
// because of earlier unrelated failures):
//   - the real controller always runs first — this middleware never
//     rejects a request before authentication has actually been checked,
//     so a correct password can never be blocked by a prior failure count,
//     on this identifier or this IP, no matter how large;
//   - only a genuine 401 (wrong loginId/UDISE or password) — observed from
//     the real response, after the fact — ever increments a counter, and
//     that increment is against the normalized login identifier
//     (loginId/udise) primarily, plus a much more generous secondary
//     per-IP counter (via the IPv6-safe `ipKeyGenerator` helper) to catch a
//     distributed guessing burst without punishing concurrent legitimate
//     logins from that same source;
//   - once an identifier/IP is over budget, a SUBSEQUENT wrong attempt's
//     401 is rewritten to 429 before it's sent — never a successful one;
//   - a successful login immediately resets the identifier's counter, so
//     an earlier typo never lingers.
export function createLoginRateLimiters(identifierField) {
  const identifierTracker = createFailureTracker()
  const ipTracker = createFailureTracker()

  return function loginRateLimiterMiddleware(req, res, next) {
    const identifier = normalizeIdentifier(req.body?.[identifierField]) || null
    const ip = ipKeyGenerator(req.ip)

    const originalJson = res.json.bind(res)
    res.json = (body) => {
      if (res.statusCode === 401) {
        const idResult = identifier
          ? identifierTracker.recordFailure(identifier, LOGIN_IDENTIFIER_LIMIT, LOGIN_IDENTIFIER_WINDOW_MS)
          : { overLimit: false, retryAfterMs: 0 }
        const ipResult = ipTracker.recordFailure(ip, LOGIN_IP_LIMIT, LOGIN_IP_WINDOW_MS)

        if (idResult.overLimit || ipResult.overLimit) {
          const retryAfterMs = Math.max(idResult.retryAfterMs, ipResult.retryAfterMs)
          res.statusCode = 429
          res.setHeader('Retry-After', String(Math.ceil(retryAfterMs / 1000)))
          return originalJson(TOO_MANY_ATTEMPTS_MESSAGE)
        }
      } else if (res.statusCode < 400 && identifier) {
        identifierTracker.reset(identifier)
      }

      return originalJson(body)
    }

    next()
  }
}
