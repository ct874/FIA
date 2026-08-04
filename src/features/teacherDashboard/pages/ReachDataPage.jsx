import { useEffect, useMemo, useState } from 'react'
import TextInput from '../../../components/ui/TextInput'
import Select from '../../../components/ui/Select'
import Checkbox from '../../../components/ui/Checkbox'
import Button from '../../../components/ui/Button'
import Skeleton from '../../../components/ui/Skeleton'
import WorkflowStepper from '../../../components/ui/WorkflowStepper'
import { useTeacherStatus } from '../../../hooks/useTeacherStatus'
import { useToast } from '../../../hooks/useToast'
import { useLanguage } from '../../../hooks/useLanguage'
import { fetchStudentReach, submitStudentReach } from '../../../api/studentReach.api'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'

const MIN_VISIBLE_GRADE = 6
const EMPTY_FORM = { grade: '', studentCount: '', tourIds: [] }

function CheckBadgeIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PreviouslyAddedGrades({ records, t }) {
  if (records.length === 0) return null

  return (
    <div className="mb-6">
      <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {t('reachData.previouslyAdded')}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {records.map((record) => (
          <div
            key={record.id}
            className="animate-fade-in-up rounded-2xl border border-green-200 bg-green-50/60 p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-green-500 text-white">
                <CheckBadgeIcon className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">
                {t('reachData.gradeLabel')} {record.grade}
              </h3>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              <span className="font-medium text-slate-500">{t('reachData.studentsLabel')}</span>{' '}
              <span className="font-semibold text-slate-900">{record.studentsReached}</span>
            </p>

            <div className="mt-2">
              <p className="text-sm font-medium text-slate-500">{t('reachData.toursLabel')}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {record.tours.map((tour) => (
                  <span
                    key={tour.tourId}
                    className="rounded-full border border-green-200 bg-white px-2.5 py-1 text-xs font-medium text-green-700"
                  >
                    {tour.tourName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReachDataPage() {
  const toast = useToast()
  const { t } = useLanguage()
  const { status, meta, refetchStatus } = useTeacherStatus()

  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadRecords = async () => {
    const { data } = await fetchStudentReach()
    setRecords(data.data.records)
  }

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        await loadRecords()
      } catch (error) {
        if (isMounted) toast.error(getApiErrorMessage(error, t('reachData.loadError')))
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

  // Grades 6–12 only, and always available — a grade already recorded can
  // be selected again; the backend merges it into the same document.
  const gradeOptions = useMemo(
    () =>
      meta.grades
        .filter((grade) => Number(grade) >= MIN_VISIBLE_GRADE)
        .map((grade) => ({ value: grade, label: `${t('reachData.gradeLabel')} ${grade}` })),
    [meta.grades, t],
  )

  const toggleTour = (tourId) => {
    setForm((prev) => ({
      ...prev,
      tourIds: prev.tourIds.includes(tourId)
        ? prev.tourIds.filter((id) => id !== tourId)
        : [...prev.tourIds, tourId],
    }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.grade) nextErrors.grade = t('reachData.selectGradeError')
    if (!form.studentCount || Number(form.studentCount) <= 0) {
      nextErrors.studentCount = t('reachData.enterStudentsError')
    }
    if (form.tourIds.length === 0) nextErrors.tourIds = t('reachData.selectTourError')
    return nextErrors
  }

  const handleAdd = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await submitStudentReach({
        grade: form.grade,
        studentsReached: Number(form.studentCount),
        uniqueStudentCount: Number(form.studentCount),
        tourIds: form.tourIds,
      })
      toast.success(t('reachData.saveSuccess'))
      setForm(EMPTY_FORM)
      await Promise.all([loadRecords(), refetchStatus()])
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('reachData.saveError')))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <WorkflowStepper currentStep={2} completedSteps={status.teacherFeedbackCompleted ? [1] : []} />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('reachData.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('reachData.description')}</p>
      </div>

      <PreviouslyAddedGrades records={records} t={t} />

      <form
        onSubmit={handleAdd}
        noValidate
        className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="grade"
            label={t('reachData.gradeLabel')}
            placeholder={t('reachData.gradeSelectPlaceholder')}
            options={gradeOptions}
            value={form.grade}
            onChange={(event) => setForm((prev) => ({ ...prev, grade: event.target.value }))}
            error={errors.grade}
          />
          <TextInput
            id="studentCount"
            label={t('reachData.numberOfStudents')}
            type="number"
            min="0"
            placeholder={t('reachData.numberOfStudentsPlaceholder')}
            value={form.studentCount}
            onChange={(event) => setForm((prev) => ({ ...prev, studentCount: event.target.value }))}
            error={errors.studentCount}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">{t('reachData.careerTours')}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {meta.tours.map((tour) => (
              <label
                key={tour.tourId}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
              >
                <Checkbox
                  id={`tour-${tour.tourId}`}
                  checked={form.tourIds.includes(tour.tourId)}
                  onChange={() => toggleTour(tour.tourId)}
                  label=""
                />
                {tour.tourName}
              </label>
            ))}
          </div>
          {errors.tourIds && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.tourIds}</p>}
        </div>

        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? t('reachData.saving') : t('reachData.addGrade')}
        </Button>
      </form>
    </div>
  )
}
