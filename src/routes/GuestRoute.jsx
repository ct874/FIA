import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'
import Spinner from '../components/ui/Spinner'

export default function GuestRoute() {
  const { isAuthenticated, isCheckingSession } = useAuth()

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="h-8 w-8 text-slate-400" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  return <Outlet />
}
