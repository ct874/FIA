import { useEffect, useMemo, useState, useCallback } from 'react'
import { TeacherAuthContext } from './teacherAuthContext'
import { teacherLoginRequest, teacherLogoutRequest, fetchCurrentSchool } from '../api/teacherAuth.api'
import {
  getStoredTeacherToken,
  persistTeacherToken,
  clearStoredTeacherToken,
} from '../utils/teacherTokenStorage'
import { TEACHER_AUTH_UNAUTHORIZED_EVENT } from '../utils/constants'

export function TeacherAuthProvider({ children }) {
  const [teacher, setTeacher] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      const token = getStoredTeacherToken()
      if (!token) {
        if (isMounted) setIsCheckingSession(false)
        return
      }

      try {
        const { data } = await fetchCurrentSchool()
        if (isMounted) setTeacher(data.data)
      } catch {
        clearStoredTeacherToken()
        if (isMounted) setTeacher(null)
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
    const handleUnauthorized = () => setTeacher(null)
    window.addEventListener(TEACHER_AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(TEACHER_AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

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
