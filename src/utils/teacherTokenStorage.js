// Thin, Teacher-Portal-scoped wrapper around the centralized session
// manager (see authSession.js) — a separate namespace/instance from
// tokenStorage.js's Super Admin session, so the two auth contexts stay
// fully isolated (different localStorage keys, different BroadcastChannel).
// Keeps the exported names every existing call site (teacherAxiosClient.js,
// TeacherAuthProvider.jsx) already imports.
import { createAuthSession } from './authSession'

const session = createAuthSession('fia_teacher')

export function getStoredTeacherToken() {
  return session.getToken()
}

// Call sites still pass `rememberMe` as a second argument (it's what the
// login request body sends to the backend, which controls the issued
// JWT's expiry — 1 day vs 30 days) — it's simply not needed here any more,
// since both cases now live in localStorage so every tab shares the
// session (see authSession.js's header comment for why). JS ignores the
// extra argument, so no call site needs to change.
export function persistTeacherToken(token) {
  session.persist(token)
}

export function clearStoredTeacherToken() {
  session.clear()
}

export function touchTeacherActivity() {
  session.touchActivity()
}

export function isTeacherSessionExpiredByInactivity() {
  return session.isExpiredByInactivity()
}

export function subscribeToTeacherAuthChanges(callback) {
  return session.subscribe(callback)
}
