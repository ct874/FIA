export const ROUTES = {
  LOGIN: '/',
  HOME: '/home',
  SUBMISSIONS: '/submissions',
  EXPORT: '/export',
  TARGETS: '/targets',
}

export const TEACHER_ROUTES = {
  LOGIN: '/teacher',
  DASHBOARD: '/teacher/dashboard',
  FEEDBACK: '/teacher/feedback',
  STUDENT_FEEDBACK: '/teacher/student-feedback',
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://fia-bnum.onrender.com/api'

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized'
export const TEACHER_AUTH_UNAUTHORIZED_EVENT = 'teacherAuth:unauthorized'

// Dispatched whenever an admin action changes school/feedback data
// (upload, delete) — every useSchoolRecords() instance across the app
// listens for this and refetches immediately, so all dashboard cards/tables
// stay in sync within the same session without a manual page reload.
export const SCHOOL_DATA_CHANGED_EVENT = 'schoolData:changed'
