import { useEffect, useState } from 'react'
import Skeleton from '../../../components/ui/Skeleton'
import WorkflowStepper from '../../../components/ui/WorkflowStepper'
import GradeFeedbackCard from '../components/GradeFeedbackCard'
import BatchFeedbackWorkspace from '../components/BatchFeedbackWorkspace'
import { useTeacherStatus } from '../../../hooks/useTeacherStatus'
import { useToast } from '../../../hooks/useToast'
import { useLanguage } from '../../../hooks/useLanguage'
import { fetchStudentFeedbackSummary, submitStudentFeedback } from '../../../api/studentFeedback.api'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'

export default function StudentFeedbackPage() {
  const toast = useToast()
  const { t } = useLanguage()
  const { status, refetchStatus } = useTeacherStatus()

  const [grades, setGrades] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeGrade, setActiveGrade] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadSummary = async () => {
    const { data } = await fetchStudentFeedbackSummary()
    setGrades(data.data.grades)
  }

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        await loadSummary()
      } catch (error) {
        if (isMounted) toast.error(getApiErrorMessage(error, t('studentFeedback.couldNotLoad')))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (payloads) => {
    setIsSubmitting(true)
    try {
      const results = await Promise.allSettled(payloads.map((payload) => submitStudentFeedback(payload)))
      const failures = results.filter((result) => result.status === 'rejected')

      if (failures.length === 0) {
        toast.success(t('studentFeedback.submitSuccess'))
      } else {
        toast.error(
          getApiErrorMessage(
            failures[0].reason,
            t('studentFeedback.partialFailure', {
              success: payloads.length - failures.length,
              total: payloads.length,
            }),
          ),
        )
      }

      setActiveGrade(null)
      await Promise.all([loadSummary(), refetchStatus()])
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('studentFeedback.couldNotSubmit')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {!activeGrade && (
        <WorkflowStepper
          currentStep={3}
          completedSteps={[
            ...(status.teacherFeedbackCompleted ? [1] : []),
            ...(status.reachSubmitted ? [2] : []),
          ]}
        />
      )}

      {activeGrade ? (
        <BatchFeedbackWorkspace
          grade={activeGrade}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => setActiveGrade(null)}
        />
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('studentFeedback.title')}</h1>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-56" />
              ))}
            </div>
          ) : grades.length === 0 ? (
            <p className="text-sm text-slate-500">{t('studentFeedback.noReachData')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {grades.map((grade) => (
                <GradeFeedbackCard key={grade.grade} grade={grade} onStart={setActiveGrade} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
