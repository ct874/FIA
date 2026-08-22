import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { AuthContext } from './authContext'
import { fetchCurrentAdmin, loginRequest, logoutRequest } from '../api/auth.api'
import {
  getStoredToken,
  persistToken,
  clearStoredToken,
  touchActivity,
  isSessionExpiredByInactivity,
  subscribeToAuthChanges,
} from '../utils/tokenStorage'
import { AUTH_UNAUTHORIZED_EVENT, SESSION_EXPIRED_FLAG } from '../utils/constants'
import { useActivityTracking } from '../hooks/useActivityTracking'

// One short retry for a startup session check that failed with something
// OTHER than a confirmed-invalid-token response (network error, 5xx) — a
// temporary blip must never destroy a locally-stored, possibly-still-valid
// session.
const TRANSIENT_ERROR_RETRY_DELAY_MS = 800

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  // Bumped to request a fresh session check (e.g. another tab just logged
  // in) — the actual check lives entirely inside the effect below, keyed
  // on this value, rather than being a shared function called imperatively
  // from multiple places (which is what React's effect lint rules flag as
  // "calling setState synchronously within an effect").
  const [sessionCheckToken, setSessionCheckToken] = useState(0)

  // Mirrors `admin` but read synchronously from event handlers without
  // depending on the latest render's closure — avoids stale-state bugs in
  // the cross-tab subscription/activity-expiry callbacks below.
  const adminRef = useRef(null)
  useEffect(() => {
    adminRef.current = admin
  }, [admin])

  const markExpiredForNextLoginView = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_EXPIRED_FLAG, '1')
    } catch {
      // Non-fatal — worst case the login page just doesn't show the
      // "session expired" note.
    }
  }, [])

  // Startup / re-check effect. Per the required algorithm: check the
  // token exists, check inactivity via a pure timestamp comparison BEFORE
  // ever touching the network, then (only if not already expired) confirm
  // with the backend — the frontend clock is advisory UX only, the server
  // remains the source of truth for whether a token is still valid.
  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      const token = getStoredToken()
      if (!token) {
        if (!cancelled) {
          setAdmin(null)
          setIsCheckingSession(false)
        }
        return
      }

      if (isSessionExpiredByInactivity()) {
        // A token was found (checked above) and is now judged expired —
        // that's a real "your session expired" case regardless of whether
        // THIS page load's React state ever got to reflect it (e.g. a
        // fresh reload/new tab always starts with admin=null, before this
        // check even runs — gating on in-memory state here would miss
        // exactly the cold-start case this exists to handle).
        clearStoredToken()
        if (!cancelled) {
          setAdmin(null)
          setIsCheckingSession(false)
        }
        markExpiredForNextLoginView()
        return
      }

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const { data } = await fetchCurrentAdmin()
          if (!cancelled) {
            setAdmin(data.data)
            setIsCheckingSession(false)
          }
          return
        } catch (error) {
          const status = error?.response?.status
          if (status === 401) {
            // Same reasoning as the inactivity branch above: a token
            // existed and the server just confirmed it's no longer valid
            // — show the "session expired" note regardless of whether
            // this page load's React state ever reflected it.
            clearStoredToken()
            if (!cancelled) {
              setAdmin(null)
              setIsCheckingSession(false)
            }
            markExpiredForNextLoginView()
            return
          }
          // Network error or a real backend 5xx — not proof the token is
          // invalid. Retry once after a short delay; if it still fails,
          // leave the stored token untouched (a later refresh or the
          // network recovering can still succeed) instead of forcing a
          // logout for what may be a purely transient issue.
          if (attempt === 0) {
            await sleep(TRANSIENT_ERROR_RETRY_DELAY_MS)
            continue
          }
          if (!cancelled) {
            setAdmin(null)
            setIsCheckingSession(false)
          }
          return
        }
      }
    }

    checkSession()
    return () => {
      cancelled = true
    }
  }, [sessionCheckToken, markExpiredForNextLoginView])

  // Cross-tab sync: a logout in another tab clears this tab's state
  // immediately (ProtectedRoute already redirects whenever isAuthenticated
  // flips to false — no extra navigation needed here); a login in another
  // tab (e.g. this tab was sitting on the login page) requests a fresh
  // check so this tab picks up the new session without the user doing
  // anything.
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(({ type }) => {
      if (type === 'logout') {
        setAdmin(null)
      } else if (type === 'login') {
        setSessionCheckToken((token) => token + 1)
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => setAdmin(null)
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const handleInactivityExpired = useCallback(() => {
    if (!adminRef.current) return // already logged out — nothing to do
    clearStoredToken()
    setAdmin(null)
    markExpiredForNextLoginView()
  }, [markExpiredForNextLoginView])

  useActivityTracking({
    enabled: Boolean(admin),
    touchActivity,
    isExpiredByInactivity: isSessionExpiredByInactivity,
    onExpired: handleInactivityExpired,
  })

  const login = useCallback(async ({ loginId, password, rememberMe }) => {
    const { data } = await loginRequest({ loginId, password, rememberMe })
    persistToken(data.data.token, Boolean(rememberMe))
    setAdmin(data.data.admin)
    return data.data.admin
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      clearStoredToken()
      setAdmin(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: Boolean(admin),
      isCheckingSession,
      login,
      logout,
    }),
    [admin, isCheckingSession, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
