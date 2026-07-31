import { useCallback, useMemo, useState } from 'react'
import { TeacherAuthContext } from './teacherAuthContext'
import { findSchoolByUdise } from '../services/schoolDirectory.service'
import {
  getStoredTeacherSession,
  persistTeacherSession,
  clearStoredTeacherSession,
} from '../utils/teacherSessionStorage'

// No dedicated teacher auth endpoint yet — "login" checks the UDISE against
// the school directory (canonical dummy data + Admin-uploaded schools from
// MongoDB) and requires the default password (the UDISE itself).
export function TeacherAuthProvider({ children }) {
  const [session, setSession] = useState(getStoredTeacherSession)

  const login = useCallback(async ({ udise, password, rememberMe }) => {
    const trimmedUdise = udise.trim()
    const school = await findSchoolByUdise(trimmedUdise)

    if (!school) {
      throw new Error('UDISE not found. Ask your Admin to add your school first.')
    }
    if (password !== trimmedUdise) {
      throw new Error('Incorrect password. The default password is your UDISE code.')
    }

    const nextSession = {
      udise: school.udise,
      schoolName: school.schoolName,
      district: school.district,
    }
    persistTeacherSession(nextSession, Boolean(rememberMe))
    setSession(nextSession)
    return nextSession
  }, [])

  const logout = useCallback(() => {
    clearStoredTeacherSession()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      teacher: session,
      isAuthenticated: Boolean(session),
      isCheckingSession: false,
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <TeacherAuthContext.Provider value={value}>{children}</TeacherAuthContext.Provider>
}
