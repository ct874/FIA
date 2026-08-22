// Thin, Super-Admin-scoped wrapper around the centralized session manager
// (see authSession.js) — keeps the exported names every existing call site
// (axiosClient.js, AuthProvider.jsx) already imports, so this migration
// from the old localStorage/sessionStorage split didn't require touching
// those files.
import { createAuthSession } from './authSession'

const session = createAuthSession('fia_admin')

export function getStoredToken() {
  return session.getToken()
}

// Call sites still pass `rememberMe` as a second argument (it's what the
// login request body sends to the backend, which is what actually controls
// the issued JWT's expiry — 1 day vs 30 days) — it's simply not needed here
// any more, since both cases now live in localStorage so every tab shares
// the session (see authSession.js's header comment for why). JS ignores
// the extra argument, so no call site needs to change.
export function persistToken(token) {
  session.persist(token)
}

export function clearStoredToken() {
  session.clear()
}

export function touchActivity() {
  session.touchActivity()
}

export function isSessionExpiredByInactivity() {
  return session.isExpiredByInactivity()
}

export function subscribeToAuthChanges(callback) {
  return session.subscribe(callback)
}
