import { useEffect, useRef } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useTeacherStatus } from '../hooks/useTeacherStatus'
import { useToast } from '../hooks/useToast'
import { useLanguage } from '../hooks/useLanguage'
import { TEACHER_ROUTES } from '../utils/constants'
import Spinner from '../components/ui/Spinner'

// Backend protection (see worker/src/services/teacherStatus.service.ts's
// assertTeacherFeedbackCompleted) is the real gate — this only stops a
// typed-in/bookmarked /teacher/student-feedback URL from ever rendering the
// page for a school that hasn't completed Teacher Feedback yet, matching
// what the navbar's WorkflowTab already does for the nav link itself.
// `status` comes from the backend-derived TeacherStatusProvider, never a
// locally-set boolean, so it stays correct after refresh/logout/login.
export default function StudentFeedbackGuard() {
  const { status, isLoading } = useTeacherStatus()
  const toast = useToast()
  const { t } = useLanguage()
  const hasWarned = useRef(false)

  useEffect(() => {
    if (!isLoading && !status.teacherFeedbackCompleted && !hasWarned.current) {
      hasWarned.current = true
      toast.error(t('studentFeedback.lockedMessage'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, status.teacherFeedbackCompleted])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    )
  }

  if (!status.teacherFeedbackCompleted) {
    return <Navigate to={TEACHER_ROUTES.FEEDBACK} replace />
  }

  return <Outlet />
}
