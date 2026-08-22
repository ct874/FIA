import { useEffect } from 'react'

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
const PERIODIC_CHECK_INTERVAL_MS = 60 * 1000

// Shared by both AuthProvider and TeacherAuthProvider — parameterized by
// that context's own `touchActivity`/`isExpiredByInactivity` (from its own
// createAuthSession() instance) and an `onExpired` callback to run when
// inactivity is detected.
//
// Three ways an expiry check gets triggered, deliberately NOT relying on a
// single long-lived setTimeout (browsers can suspend background tabs,
// devices sleep, tabs get discarded — see authSession.js's
// isExpiredByInactivity(), which is a real timestamp comparison, not a
// timer callback that "was supposed to fire"):
//   1. `visibilitychange`/`focus` — the moment the tab becomes visible/
//      focused again (covers returning from background/sleep).
//   2. A periodic interval while the tab is open and foregrounded, as a
//      belt-and-braces check even if nothing else triggers one.
//   3. Implicitly, on every render of the provider that calls this hook
//      (the provider itself re-checks on mount/cross-tab events).
export function useActivityTracking({ enabled, touchActivity, isExpiredByInactivity, onExpired }) {
  useEffect(() => {
    if (!enabled) return undefined

    function handleActivity() {
      touchActivity()
    }

    function checkExpiry() {
      if (isExpiredByInactivity()) {
        onExpired()
      } else {
        touchActivity()
      }
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') checkExpiry()
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true })
    })
    window.addEventListener('focus', checkExpiry)
    document.addEventListener('visibilitychange', handleVisibility)
    const intervalId = window.setInterval(checkExpiry, PERIODIC_CHECK_INTERVAL_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
      })
      window.removeEventListener('focus', checkExpiry)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.clearInterval(intervalId)
    }
  }, [enabled, touchActivity, isExpiredByInactivity, onExpired])
}
