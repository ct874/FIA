import { Navigate, Outlet } from 'react-router-dom'
import { useTeacherAuth } from '../hooks/useTeacherAuth'
import { TEACHER_ROUTES } from '../utils/constants'
import Spinner from '../components/ui/Spinner'

export default function TeacherProtectedRoute() {
  const { isAuthenticated, isCheckingSession } = useTeacherAuth()

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50/70 via-white to-white">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={TEACHER_ROUTES.LOGIN} replace />
  }

  return <Outlet />
}
