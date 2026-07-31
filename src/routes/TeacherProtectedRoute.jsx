import { Navigate, Outlet } from 'react-router-dom'
import { useTeacherAuth } from '../hooks/useTeacherAuth'
import { TEACHER_ROUTES } from '../utils/constants'

export default function TeacherProtectedRoute() {
  const { isAuthenticated } = useTeacherAuth()

  if (!isAuthenticated) {
    return <Navigate to={TEACHER_ROUTES.LOGIN} replace />
  }

  return <Outlet />
}
