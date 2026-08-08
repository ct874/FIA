import { useEffect, useMemo, useState } from 'react'
import Select from '../../../components/ui/Select'
import TextInput from '../../../components/ui/TextInput'
import Checkbox from '../../../components/ui/Checkbox'
import Button from '../../../components/ui/Button'
import Skeleton from '../../../components/ui/Skeleton'
import WorkflowStepper from '../../../components/ui/WorkflowStepper'
import GradeFeedbackCard from '../components/GradeFeedbackCard'
import BatchFeedbackWorkspace from '../components/BatchFeedbackWorkspace'
import { useTeacherStatus } from '../../../hooks/useTeacherStatus'
import { useToast } from '../../../hooks/useToast'
import { useLanguage } from '../../../hooks/useLanguage'
import {
  fetchStudentFeedbackSummary,
  startStudentFeedbackBatch,
  submitStudentFeedback,
} from '../../../api/studentFeedback.api'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'

const MIN_VISIBLE_GRADE = 6
// Every class is assumed to have watched every enabled Career Tour — the
// teacher only ever picks a Grade and Student Count now; tour selection is
// no longer a user input (see the always-checked, locked checkboxes below),
// and the "In which language did students watch the Career Tour?" question
// has been removed entirely.
const EMPTY_BATCH_FORM = { grade: '', studentCount: '' }

export default function StudentFeedbackPage() {
  const toast = useToast()
  const { t } = useLanguage()
  const { status, meta, refetchStatus } = useTeacherStatus()

  const [grades, setGrades] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeGrade, setActiveGrade] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [batchForm, setBatchForm] = useState(EMPTY_BATCH_FORM)
  const [batchErrors, setBatchErrors] = useState({})
  const [isStartingBatch, setIsStartingBatch] = useState(false)

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

  // Grades 6–12 only, and always available — a grade already started can be
  // started again; the backend merges it into the same batch.
  const gradeOptions = useMemo(
    () =>
      meta.grades
        .filter((grade) => Number(grade) >= MIN_VISIBLE_GRADE)
        .map((grade) => ({ value: grade, label: `${t('feedbackBatch.gradeLabel')} ${grade}` })),
    [meta.grades, t],
  )

  const validateBatch = () => {
    const nextErrors = {}
    if (!batchForm.grade) nextErrors.grade = t('feedbackBatch.selectGradeError')
    if (!batchForm.studentCount || Number(batchForm.studentCount) <= 0) {
      nextErrors.studentCount = t('feedbackBatch.enterStudentsError')
    }
    return nextErrors
  }

  const handleStartBatch = async (event) => {
    event.preventDefault()
    const nextErrors = validateBatch()
    setBatchErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsStartingBatch(true)
    try {
      await startStudentFeedbackBatch({
        grade: batchForm.grade,
        studentCount: Number(batchForm.studentCount),
        // Every currently-enabled Career Tour, always — the backend already
        // ignores/enforces this independently, but sending it keeps the
        // payload self-describing.
        tourIds: meta.tours.map((tour) => tour.tourId),
      })
      toast.success(t('feedbackBatch.saveSuccess'))
      setBatchForm(EMPTY_BATCH_FORM)
      await Promise.all([loadSummary(), refetchStatus()])
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('feedbackBatch.saveError')))
    } finally {
      setIsStartingBatch(false)
    }
  }

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
        <WorkflowStepper currentStep={2} completedSteps={status.teacherFeedbackCompleted ? [1] : []} />
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

          <form
            onSubmit={handleStartBatch}
            noValidate
            className="mb-8 space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
          >
            <p className="text-sm font-semibold text-slate-700">{t('feedbackBatch.formTitle')}</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                id="batchGrade"
                label={t('feedbackBatch.gradeLabel')}
                placeholder={t('feedbackBatch.gradeSelectPlaceholder')}
                options={gradeOptions}
                value={batchForm.grade}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, grade: event.target.value }))}
                error={batchErrors.grade}
              />
              <TextInput
                id="batchStudentCount"
                label={t('feedbackBatch.numberOfStudents')}
                type="number"
                min="0"
                placeholder={t('feedbackBatch.numberOfStudentsPlaceholder')}
                value={batchForm.studentCount}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, studentCount: event.target.value }))}
                error={batchErrors.studentCount}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">{t('feedbackBatch.careerTours')}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Every enabled Career Tour is always included — these are
                    permanently checked and locked (not the native `disabled`
                    attribute, which would visibly gray them out; `onClick`'s
                    preventDefault blocks the toggle while keeping the normal
                    enabled look), so the UI stays identical while requiring
                    no interaction. */}
                {meta.tours.map((tour) => (
                  <label
                    key={tour.tourId}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
                  >
                    <Checkbox
                      id={`batch-tour-${tour.tourId}`}
                      checked
                      onChange={() => {}}
                      onClick={(event) => event.preventDefault()}
                      label=""
                    />
                    {tour.tourName}
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" isLoading={isStartingBatch} disabled={isStartingBatch}>
              {isStartingBatch ? t('feedbackBatch.saving') : t('feedbackBatch.startBatch')}
            </Button>
          </form>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-56" />
              ))}
            </div>
          ) : grades.length === 0 ? (
            <p className="text-sm text-slate-500">{t('studentFeedback.noBatches')}</p>
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
