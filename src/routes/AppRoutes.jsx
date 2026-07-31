import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import GuestRoute from './GuestRoute'
import TeacherProtectedRoute from './TeacherProtectedRoute'
import TeacherGuestRoute from './TeacherGuestRoute'
import AdminLayout from '../components/layout/AdminLayout'
import TeacherLayout from '../components/layout/TeacherLayout'
import LoginPage from '../features/auth/pages/LoginPage'
import HomePage from '../features/home/pages/HomePage'
import SubmissionsPage from '../features/submissions/pages/SubmissionsPage'
import ExportPage from '../features/export/pages/ExportPage'
import TeacherLoginPage from '../features/teacherAuth/pages/TeacherLoginPage'
import TeacherDashboardPage from '../features/teacherDashboard/pages/TeacherDashboardPage'
import ReachDataPage from '../features/teacherDashboard/pages/ReachDataPage'
import TeacherFeedbackPage from '../features/teacherDashboard/pages/TeacherFeedbackPage'
import { ROUTES, TEACHER_ROUTES } from '../utils/constants'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.SUBMISSIONS} element={<SubmissionsPage />} />
          <Route path={ROUTES.EXPORT} element={<ExportPage />} />
        </Route>
      </Route>

      <Route element={<TeacherGuestRoute />}>
        <Route path={TEACHER_ROUTES.LOGIN} element={<TeacherLoginPage />} />
      </Route>

      <Route element={<TeacherProtectedRoute />}>
        <Route element={<TeacherLayout />}>
          <Route path={TEACHER_ROUTES.DASHBOARD} element={<TeacherDashboardPage />} />
          <Route path={TEACHER_ROUTES.REACH_DATA} element={<ReachDataPage />} />
          <Route path={TEACHER_ROUTES.FEEDBACK} element={<TeacherFeedbackPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  )
}
