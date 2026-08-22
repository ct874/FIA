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

// Cloudflare Workers migration: the Worker now serves both the SPA and the
// API from one same-origin deployment (see worker/src/index.ts), so the
// production default is a relative path, not an absolute Render URL — a
// missing env var must never silently point production at a dead backend.
// Local dev overrides this via .env.local to point at `wrangler dev`
// (see .env.local.example) or the old Express server during the
// transition/rollback window.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5000/api'

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized'
export const TEACHER_AUTH_UNAUTHORIZED_EVENT = 'teacherAuth:unauthorized'

// One-shot sessionStorage flags: set by AuthProvider/TeacherAuthProvider
// right before clearing a session that expired "underneath" an actively
// browsing user (cross-tab logout or 30-hour inactivity) — LoginForm/
// TeacherLoginForm read + clear these on mount to show a clear "your
// session expired" message instead of silently landing back on a blank
// login page. sessionStorage (not localStorage) is deliberate: this is a
// one-time UI note for whichever tab lands on the login page next, not
// session state itself.
export const SESSION_EXPIRED_FLAG = 'fia_admin_session_expired'
export const TEACHER_SESSION_EXPIRED_FLAG = 'fia_teacher_session_expired'

// Dispatched whenever an admin action changes school/feedback data
// (upload, delete) — every useSchoolRecords() instance across the app
// listens for this and refetches immediately, so all dashboard cards/tables
// stay in sync within the same session without a manual page reload.
export const SCHOOL_DATA_CHANGED_EVENT = 'schoolData:changed'
