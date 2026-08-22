// Centralized cross-tab session manager. One instance per auth context
// (Super Admin / Teacher Portal) via createAuthSession(namespace) — each
// gets its own localStorage keys and BroadcastChannel name, so the two
// contexts can never cross-contaminate (a Teacher Portal tab can never be
// woken up by, or accidentally logged out by, a Super Admin event).
//
// Storage: localStorage only, for BOTH "Remember me" and not. sessionStorage
// is per-tab and cannot satisfy "a second tab already sees an existing
// login" — a hard requirement. The actual session lifetime still differs
// correctly by Remember Me because the JWT itself is issued with a
// different expiry (1 day vs 30 days — see worker/src/auth/jwt.ts), which
// this module doesn't need to know or duplicate.
//
// Cross-tab sync uses the native `storage` event as the guaranteed
// baseline (fires automatically in every OTHER tab whenever localStorage
// changes — zero extra infrastructure, universally supported) plus
// BroadcastChannel where available for an explicit, semantic login/logout
// signal. Either mechanism missing/failing never breaks the other.
export const INACTIVITY_LIMIT_MS = 30 * 60 * 60 * 1000 // 30 hours

const ACTIVITY_WRITE_THROTTLE_MS = 60 * 1000 // don't write on every mousemove

export function createAuthSession(namespace) {
  const TOKEN_KEY = `${namespace}_token`
  const ACTIVITY_KEY = `${namespace}_last_activity`

  let channel = null
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(`${namespace}_auth`)
    }
  } catch {
    // BroadcastChannel unavailable in this environment — storage events
    // (registered in subscribe()) still cover cross-tab sync on their own.
    channel = null
  }

  let lastActivityWriteAt = 0

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      // Storage unavailable (private browsing lockdown, corrupted state,
      // etc.) — treat as "no session" rather than crashing the app.
      return null
    }
  }

  function stampActivity(now) {
    try {
      localStorage.setItem(ACTIVITY_KEY, String(now))
    } catch {
      // Non-fatal — worst case the inactivity clock is judged from an
      // older timestamp, which only makes expiry MORE conservative, never
      // less safe.
    }
  }

  function persist(token) {
    const now = Date.now()
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // If we can't persist at all, the in-memory React state from this
      // login still works for the current tab/render; there's nothing
      // further to do here without a storage backend.
    }
    stampActivity(now)
    lastActivityWriteAt = now
    broadcastLogin()
  }

  function clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(ACTIVITY_KEY)
    } catch {
      // Nothing more we can do — see getToken()'s note on storage failures.
    }
    broadcastLogout()
  }

  // Cheap, throttled: safe to call from a mousemove/keydown/scroll handler
  // or an axios success interceptor without spamming localStorage writes
  // or triggering a `storage` event in every other tab on every keystroke.
  function touchActivity() {
    const now = Date.now()
    if (now - lastActivityWriteAt < ACTIVITY_WRITE_THROTTLE_MS) return
    lastActivityWriteAt = now
    stampActivity(now)
  }

  // Pure timestamp comparison — no network, no timers relied on. Correct
  // whether the tab has been open continuously, was backgrounded, or the
  // browser was fully closed and reopened, exactly because it re-derives
  // the answer from a persisted wall-clock timestamp each time it's asked,
  // rather than trusting a long-lived setTimeout to have fired reliably.
  function isExpiredByInactivity() {
    let stored
    try {
      stored = localStorage.getItem(ACTIVITY_KEY)
    } catch {
      // Can't read the clock — treat as expired (fail closed) rather than
      // silently granting an unverifiable session.
      return true
    }
    if (!stored) return false // no activity recorded yet (e.g. token predates this feature) — let the real auth check decide
    const lastActivity = Number(stored)
    if (!Number.isFinite(lastActivity)) return true
    return Date.now() - lastActivity >= INACTIVITY_LIMIT_MS
  }

  function broadcastLogin() {
    try {
      channel?.postMessage({ type: 'login' })
    } catch {
      // Best-effort only — the `storage` event on TOKEN_KEY already covers
      // this for any tab whose BroadcastChannel post fails.
    }
  }

  function broadcastLogout() {
    try {
      channel?.postMessage({ type: 'logout' })
    } catch {
      // See broadcastLogin().
    }
  }

  // `callback({ type: 'login' | 'logout' })`. Returns an unsubscribe
  // function. Combines both mechanisms; either one alone is sufficient,
  // together they're more robust across browsers/environments.
  function subscribe(callback) {
    function handleStorage(event) {
      if (event.key !== TOKEN_KEY) return
      callback({ type: event.newValue ? 'login' : 'logout' })
    }
    function handleBroadcast(event) {
      if (event?.data?.type === 'login' || event?.data?.type === 'logout') {
        callback({ type: event.data.type })
      }
    }

    window.addEventListener('storage', handleStorage)
    channel?.addEventListener('message', handleBroadcast)

    return function unsubscribe() {
      window.removeEventListener('storage', handleStorage)
      channel?.removeEventListener('message', handleBroadcast)
    }
  }

  return {
    getToken,
    persist,
    clear,
    touchActivity,
    isExpiredByInactivity,
    subscribe,
  }
}
