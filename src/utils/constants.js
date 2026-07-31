export const ROUTES = {
  LOGIN: '/',
  HOME: '/home',
  SUBMISSIONS: '/submissions',
  EXPORT: '/export',
}

export const TEACHER_ROUTES = {
  LOGIN: '/teacher',
  DASHBOARD: '/teacher/dashboard',
  REACH_DATA: '/teacher/reach-data',
  FEEDBACK: '/teacher/feedback',
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized'
