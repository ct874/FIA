import { useEffect, useMemo, useState, useCallback } from 'react'
import { AuthContext } from './authContext'
import { fetchCurrentAdmin, loginRequest, logoutRequest } from '../api/auth.api'
import { getStoredToken, persistToken, clearStoredToken } from '../utils/tokenStorage'
import { AUTH_UNAUTHORIZED_EVENT } from '../utils/constants'

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      const token = getStoredToken()
      if (!token) {
        if (isMounted) setIsCheckingSession(false)
        return
      }

      try {
        const { data } = await fetchCurrentAdmin()
        if (isMounted) setAdmin(data.data)
      } catch {
        clearStoredToken()
        if (isMounted) setAdmin(null)
      } finally {
        if (isMounted) setIsCheckingSession(false)
      }
    }

    checkSession()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => setAdmin(null)
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

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
