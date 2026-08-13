import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'
import Spinner from '../components/ui/Spinner'

export default function ProtectedRoute() {
  const { isAuthenticated, isCheckingSession } = useAuth()

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50/70 via-white to-white">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <Outlet />
}
