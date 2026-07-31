const SESSION_KEY = 'fia_teacher_session'

export function getStoredTeacherSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function persistTeacherSession(session, rememberMe) {
  clearStoredTeacherSession()
  const raw = JSON.stringify(session)
  if (rememberMe) {
    localStorage.setItem(SESSION_KEY, raw)
  } else {
    sessionStorage.setItem(SESSION_KEY, raw)
  }
}

export function clearStoredTeacherSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
