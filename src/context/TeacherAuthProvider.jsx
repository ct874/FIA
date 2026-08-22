import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { TeacherAuthContext } from './teacherAuthContext'
import { teacherLoginRequest, teacherLogoutRequest, fetchCurrentSchool } from '../api/teacherAuth.api'
import {
  getStoredTeacherToken,
  persistTeacherToken,
  clearStoredTeacherToken,
  touchTeacherActivity,
  isTeacherSessionExpiredByInactivity,
  subscribeToTeacherAuthChanges,
} from '../utils/teacherTokenStorage'
import { TEACHER_AUTH_UNAUTHORIZED_EVENT, TEACHER_SESSION_EXPIRED_FLAG } from '../utils/constants'
import { useActivityTracking } from '../hooks/useActivityTracking'

// One short retry for a startup session check that failed with something
// OTHER than a confirmed-invalid-token response (network error, 5xx) — a
// temporary blip must never destroy a locally-stored, possibly-still-valid
// session.
const TRANSIENT_ERROR_RETRY_DELAY_MS = 800

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function TeacherAuthProvider({ children }) {
  const [teacher, setTeacher] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  // Bumped to request a fresh session check (e.g. another tab just logged
  // in) — the actual check lives entirely inside the effect below, keyed
  // on this value, rather than being a shared function called imperatively
  // from multiple places (which is what React's effect lint rules flag as
  // "calling setState synchronously within an effect").
  const [sessionCheckToken, setSessionCheckToken] = useState(0)

  // Mirrors `teacher` but read synchronously from event handlers without
  // depending on the latest render's closure — avoids stale-state bugs in
  // the cross-tab subscription/activity-expiry callbacks below.
  const teacherRef = useRef(null)
  useEffect(() => {
    teacherRef.current = teacher
  }, [teacher])

  const markExpiredForNextLoginView = useCallback(() => {
    try {
      sessionStorage.setItem(TEACHER_SESSION_EXPIRED_FLAG, '1')
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
      const token = getStoredTeacherToken()
      if (!token) {
        if (!cancelled) {
          setTeacher(null)
          setIsCheckingSession(false)
        }
        return
      }

      if (isTeacherSessionExpiredByInactivity()) {
        // A token was found (checked above) and is now judged expired —
        // that's a real "your session expired" case regardless of whether
        // THIS page load's React state ever got to reflect it (e.g. a
        // fresh reload/new tab always starts with teacher=null, before
        // this check even runs — gating on in-memory state here would
        // miss exactly the cold-start case this exists to handle).
        clearStoredTeacherToken()
        if (!cancelled) {
          setTeacher(null)
          setIsCheckingSession(false)
        }
        markExpiredForNextLoginView()
        return
      }

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const { data } = await fetchCurrentSchool()
          if (!cancelled) {
            setTeacher(data.data)
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
            clearStoredTeacherToken()
            if (!cancelled) {
              setTeacher(null)
              setIsCheckingSession(false)
            }
            markExpiredForNextLoginView()
            return
          }
          // Network error or a real backend 5xx — not proof the token is
          // invalid. Retry once after a short delay; if it still fails,
          // leave the stored token untouched instead of forcing a logout
          // for what may be a purely transient issue.
          if (attempt === 0) {
            await sleep(TRANSIENT_ERROR_RETRY_DELAY_MS)
            continue
          }
          if (!cancelled) {
            setTeacher(null)
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
  // immediately (TeacherProtectedRoute already redirects whenever
  // isAuthenticated flips to false); a login in another tab requests a
  // fresh check so this tab picks up the new session automatically.
  useEffect(() => {
    const unsubscribe = subscribeToTeacherAuthChanges(({ type }) => {
      if (type === 'logout') {
        setTeacher(null)
      } else if (type === 'login') {
        setSessionCheckToken((token) => token + 1)
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => setTeacher(null)
    window.addEventListener(TEACHER_AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(TEACHER_AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const handleInactivityExpired = useCallback(() => {
    if (!teacherRef.current) return // already logged out — nothing to do
    clearStoredTeacherToken()
    setTeacher(null)
    markExpiredForNextLoginView()
  }, [markExpiredForNextLoginView])

  useActivityTracking({
    enabled: Boolean(teacher),
    touchActivity: touchTeacherActivity,
    isExpiredByInactivity: isTeacherSessionExpiredByInactivity,
    onExpired: handleInactivityExpired,
  })

  const login = useCallback(async ({ udise, password, rememberMe }) => {
    const { data } = await teacherLoginRequest({ udise, password, rememberMe })
    persistTeacherToken(data.data.token, Boolean(rememberMe))
    setTeacher(data.data.school)
    return data.data.school
  }, [])

  const logout = useCallback(async () => {
    try {
      await teacherLogoutRequest()
    } finally {
      clearStoredTeacherToken()
      setTeacher(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      teacher,
      isAuthenticated: Boolean(teacher),
      isCheckingSession,
      login,
      logout,
    }),
    [teacher, isCheckingSession, login, logout],
  )

  return <TeacherAuthContext.Provider value={value}>{children}</TeacherAuthContext.Provider>
}
