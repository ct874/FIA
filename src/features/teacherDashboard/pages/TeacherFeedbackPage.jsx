import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextInput from '../../../components/ui/TextInput'
import Button from '../../../components/ui/Button'
import Skeleton from '../../../components/ui/Skeleton'
import WorkflowStepper from '../../../components/ui/WorkflowStepper'
import FeedbackProgressBar from '../../../components/ui/FeedbackProgressBar'
import TourFeedbackFields from '../components/TourFeedbackFields'
import { useTeacherStatus } from '../../../hooks/useTeacherStatus'
import { useToast } from '../../../hooks/useToast'
import { useLanguage } from '../../../hooks/useLanguage'
import { fetchTeacherFeedback, submitTeacherFeedback } from '../../../api/teacherFeedback.api'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { TEACHER_ROUTES } from '../../../utils/constants'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// The 5 mandatory questions per Career Tour (matches the official Form 4
// spec) — Career Tour language is a separate, always-required field and
// intentionally not counted here, mirroring how Student Feedback's own
// progress bar (BatchFeedbackWorkspace) never counts language either.
const QUESTION_KEYS = ['recommendScore', 'satisfactionResources', 'easeIntegration', 'biggestBenefit', 'improvements']

function isQuestionAnswered(value) {
  if (typeof value === 'string') return value.trim() !== ''
  return value !== undefined && value !== null
}

function npsLabelKey(score) {
  if (score >= 9) return 'teacherFeedback.nps.promoter'
  if (score >= 7) return 'teacherFeedback.nps.passive'
  return 'teacherFeedback.nps.detractor'
}

function SubmittedSummary({ submissions, t }) {
  const navigate = useNavigate()
  const first = submissions[0]

  return (
    <>
      <div className="animate-fade-in-up rounded-3xl bg-linear-to-br from-slate-800 to-slate-950 p-6 text-center text-white shadow-xl shadow-slate-900/20 sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold sm:text-xl">{t('teacherFeedback.submittedTitle')}</h2>
        <p className="mt-1 text-sm text-slate-300">{t('teacherFeedback.submittedSubtitle')}</p>

        {first && (
          <div className="mt-6 rounded-2xl bg-white/5 p-5 text-left text-sm">
            <p>
              <span className="font-semibold text-amber-300">{t('teacherFeedback.submittedBy')}</span> {first.submittedBy}
            </p>
            {first.contactNumber && (
              <p className="mt-1">
                <span className="font-semibold text-amber-300">{t('teacherFeedback.contact')}</span> {first.contactNumber}
              </p>
            )}
            {first.email && (
              <p className="mt-1">
                <span className="font-semibold text-amber-300">{t('teacherFeedback.email')}</span> {first.email}
              </p>
            )}
            <p className="mt-1">
              <span className="font-semibold text-amber-300">{t('teacherFeedback.month')}</span> {first.month}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="w-auto! px-6" onClick={() => navigate(TEACHER_ROUTES.STUDENT_FEEDBACK)}>
            {t('teacherFeedback.goToStudentFeedback')}
          </Button>
        </div>
      </div>

      <p className="mt-8 mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {t('teacherFeedback.yourResponses')}
      </p>
      <div className="space-y-4">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6"
          >
            <h3 className="text-sm font-semibold text-slate-900">{submission.tourName}</h3>

            <dl className="mt-3 divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-500">{t('teacherFeedback.recommendQuestion')}</dt>
                <dd className="font-semibold text-slate-900">
                  {submission.recommendScore}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    {t(npsLabelKey(submission.recommendScore))}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-500">{t('teacherFeedback.satisfactionQuestion')}</dt>
                <dd className="font-semibold text-slate-900">{submission.satisfactionResources}/5</dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-500">{t('teacherFeedback.easeQuestion')}</dt>
                <dd className="font-semibold text-slate-900">{submission.easeIntegration}/5</dd>
              </div>
              {submission.biggestBenefit && (
                <div className="py-2">
                  <dt className="text-slate-500">{t('teacherFeedback.biggestBenefit')}</dt>
                  <dd className="mt-1 text-slate-700 italic">"{submission.biggestBenefit}"</dd>
                </div>
              )}
              {submission.improvements && (
                <div className="py-2">
                  <dt className="text-slate-500">{t('teacherFeedback.improvements')}</dt>
                  <dd className="mt-1 text-slate-700 italic">"{submission.improvements}"</dd>
                </div>
              )}
            </dl>
          </div>
        ))}
      </div>
    </>
  )
}

export default function TeacherFeedbackPage() {
  const toast = useToast()
  const { t } = useLanguage()
  const { status, meta, refetchStatus } = useTeacherStatus()

  const [submissions, setSubmissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [submittedBy, setSubmittedBy] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [email, setEmail] = useState('')
  const [answers, setAnswers] = useState({})
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const { data } = await fetchTeacherFeedback()
        if (isMounted) setSubmissions(data.data.submissions)
      } catch (error) {
        if (isMounted) toast.error(getApiErrorMessage(error, t('teacherFeedback.couldNotLoad')))
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

  const alreadySubmitted = submissions.length > 0

  const validate = () => {
    const nextErrors = { tours: {} }
    if (!submittedBy.trim()) nextErrors.submittedBy = t('teacherFeedback.nameRequired')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      nextErrors.email = t('teacherFeedback.emailRequired')
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = t('teacherFeedback.emailInvalid')
    }

    meta.tours.forEach((tour) => {
      const value = answers[tour.tourId] || {}
      const tourErrors = {}
      if (!value.language) tourErrors.language = t('teacherFeedback.required')
      QUESTION_KEYS.forEach((key) => {
        if (!isQuestionAnswered(value[key])) tourErrors[key] = t('teacherFeedback.required')
      })
      if (Object.keys(tourErrors).length > 0) nextErrors.tours[tour.tourId] = tourErrors
    })

    return nextErrors
  }

  // Recomputed on every keystroke/answer so the Submit button can be
  // disabled in real time — the same "never allow partial submission"
  // guarantee validate() gives on submit, just evaluated live instead of
  // only after a submit attempt.
  const liveErrors = useMemo(
    () => validate(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submittedBy, email, answers, meta.tours],
  )
  const hasLiveTourErrors = Object.values(liveErrors.tours).some((tourErrors) => Object.keys(tourErrors).length > 0)
  const isFormComplete = !liveErrors.submittedBy && !liveErrors.email && !hasLiveTourErrors

  const { filledCount, totalCount, progressPercent } = useMemo(() => {
    const total = meta.tours.length * QUESTION_KEYS.length
    const filled = meta.tours.reduce((sum, tour) => {
      const value = answers[tour.tourId] || {}
      return sum + QUESTION_KEYS.filter((key) => isQuestionAnswered(value[key])).length
    }, 0)
    return {
      filledCount: filled,
      totalCount: total,
      progressPercent: total === 0 ? 0 : Math.round((filled / total) * 100),
    }
  }, [answers, meta.tours])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    const hasTourErrors = Object.values(nextErrors.tours).some((e) => Object.keys(e).length > 0)
    setErrors(nextErrors)
    if (nextErrors.submittedBy || nextErrors.email || hasTourErrors) return

    setIsSubmitting(true)
    try {
      const payload = {
        submittedBy: submittedBy.trim(),
        contactNumber: contactNumber.trim(),
        email: email.trim().toLowerCase(),
        tours: meta.tours.map((tour) => ({ tourId: tour.tourId, ...answers[tour.tourId] })),
      }
      const { data } = await submitTeacherFeedback(payload)
      setSubmissions(data.data.submissions)
      toast.success(t('teacherFeedback.submitSuccess'))
      await refetchStatus()
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('teacherFeedback.couldNotSubmit')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <WorkflowStepper currentStep={1} completedSteps={status.teacherFeedbackCompleted ? [1] : []} />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('teacherFeedback.title')}</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      ) : alreadySubmitted ? (
        <SubmittedSummary submissions={submissions} t={t} />
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextInput
              id="submittedBy"
              label={t('teacherFeedback.yourNameLabel')}
              placeholder={t('teacherFeedback.yourNamePlaceholder')}
              value={submittedBy}
              onChange={(event) => setSubmittedBy(event.target.value)}
              error={errors.submittedBy}
            />
            <TextInput
              id="contactNumber"
              label={t('teacherFeedback.contactNumberLabel')}
              placeholder={t('teacherFeedback.contactNumberPlaceholder')}
              value={contactNumber}
              onChange={(event) => setContactNumber(event.target.value)}
            />
            <TextInput
              id="email"
              type="email"
              label={t('teacherFeedback.emailLabel')}
              placeholder={t('teacherFeedback.emailPlaceholder')}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />
          </div>

          {meta.tours.map((tour) => (
            <TourFeedbackFields
              key={tour.tourId}
              tour={tour}
              value={answers[tour.tourId] || {}}
              onChange={(next) => setAnswers((prev) => ({ ...prev, [tour.tourId]: next }))}
              errors={errors.tours?.[tour.tourId] || {}}
              languages={meta.languages}
            />
          ))}

          <div>
            <FeedbackProgressBar
              label={t('studentFeedback.answeredCount', { filled: filledCount, total: totalCount })}
              percent={progressPercent}
            />
          </div>

          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || !isFormComplete}>
            {isSubmitting ? t('teacherFeedback.submitting') : t('teacherFeedback.submit')}
          </Button>
        </form>
      )}
    </div>
  )
}
