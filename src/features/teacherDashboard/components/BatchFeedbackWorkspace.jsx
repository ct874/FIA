import { useMemo, useState } from 'react'
import Button from '../../../components/ui/Button'
import FeedbackProgressBar from '../../../components/ui/FeedbackProgressBar'
import { useLanguage } from '../../../hooks/useLanguage'

// These 5 questions are the fixed survey instrument shown to students — they
// stay in Hindi regardless of the admin/teacher UI language toggle, since
// they're the program's actual data-collection form, not switchable UI text.
const QUESTIONS = [
  { key: 'enjoyment', text: 'आपको यह करियर टूर कितना पसंद आया?', type: 'rating' },
  { key: 'overallExperience', text: 'टूर का समग्र अनुभव कैसा रहा?', type: 'rating' },
  { key: 'interestInFutureCareer', text: 'भविष्य के करियर के बारे में जानने में आपकी कितनी रुचि है?', type: 'rating' },
  { key: 'wantExploreCareer', text: 'क्या इस टूर ने आपको अपने भविष्य के करियर के बारे में सोचने पर मजबूर किया?', type: 'yesno' },
  { key: 'wantMoreTours', text: 'क्या आप ऐसे और टूर देखना चाहेंगे?', type: 'yesno' },
]

function BackIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RatingRow({ label, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-all duration-150 ease-out ${
              value === option
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function YesNoRow({ label, value, onChange, yesLabel, noLabel, maybeLabel }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
        {[
          { label: yesLabel, val: 'Yes' },
          { label: noLabel, val: 'No' },
          { label: maybeLabel, val: 'Maybe' },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.val)}
            className={`px-4 py-1.5 text-xs font-semibold transition-colors duration-150 ${
              value === option.val ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function isAnswered(value) {
  return value !== null && value !== undefined
}

export default function BatchFeedbackWorkspace({ grade, onSubmit, onCancel, isSubmitting }) {
  const { t } = useLanguage()
  const remaining = Math.max(0, grade.target - grade.submittedCount)

  const [responses, setResponses] = useState(() =>
    Array.from({ length: remaining }, () => ({
      enjoyment: null,
      overallExperience: null,
      interestInFutureCareer: null,
      wantExploreCareer: null,
      wantMoreTours: null,
    })),
  )

  const setAnswer = (index, key) => (value) => {
    setResponses((prev) => prev.map((response, i) => (i === index ? { ...response, [key]: value } : response)))
  }

  const { filledCells, totalCells, progressPercent, isComplete } = useMemo(() => {
    const total = remaining * QUESTIONS.length
    const filled = responses.reduce(
      (sum, response) => sum + QUESTIONS.filter((question) => isAnswered(response[question.key])).length,
      0,
    )
    return {
      filledCells: filled,
      totalCells: total,
      progressPercent: total === 0 ? 0 : Math.round((filled / total) * 100),
      isComplete: total > 0 && filled === total,
    }
  }, [responses, remaining])

  const handleSubmit = () => {
    if (!isComplete) return
    onSubmit(
      responses.map((response) => ({
        grade: grade.grade,
        // Career Tour language is captured once when the feedback batch is
        // started (per grade) and auto-filled here — students are never
        // asked again.
        tours: grade.tours.map((tour) => ({ tourId: tour.tourId, language: grade.language, ...response })),
      })),
    )
  }

  return (
    <div className="animate-fade-in-up">
      <button
        type="button"
        onClick={onCancel}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900"
      >
        <BackIcon />
        {t('studentFeedback.backToGrades')}
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{t('studentFeedback.title')}</p>
          <h2 className="mt-0.5 text-xl font-semibold text-slate-900">
            {t('studentFeedback.gradeHeading', { grade: grade.grade })}
          </h2>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
          {remaining === 1
            ? t('studentFeedback.studentsRemaining', { count: remaining })
            : t('studentFeedback.studentsRemainingPlural', { count: remaining })}
        </span>
      </div>

      {remaining === 0 ? (
        <p className="text-sm text-slate-500">{t('studentFeedback.targetMet')}</p>
      ) : (
        <>
          <div className="space-y-5">
            {QUESTIONS.map((question, index) => (
              <div
                key={question.key}
                className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6"
              >
                <h3 className="mb-1 text-base font-semibold text-slate-900">
                  {index + 1}. {question.text}
                </h3>
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: remaining }).map((_, studentIndex) =>
                    question.type === 'rating' ? (
                      <RatingRow
                        key={studentIndex}
                        label={t('studentFeedback.studentLabel', { index: studentIndex + 1 })}
                        value={responses[studentIndex][question.key]}
                        onChange={setAnswer(studentIndex, question.key)}
                      />
                    ) : (
                      <YesNoRow
                        key={studentIndex}
                        label={t('studentFeedback.studentLabel', { index: studentIndex + 1 })}
                        value={responses[studentIndex][question.key]}
                        onChange={setAnswer(studentIndex, question.key)}
                        yesLabel={t('studentFeedback.yesLabel')}
                        noLabel={t('studentFeedback.noLabel')}
                        maybeLabel={t('studentFeedback.maybeLabel')}
                      />
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 mt-6 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
            <FeedbackProgressBar
              label={t('studentFeedback.answeredCount', { filled: filledCells, total: totalCells })}
              percent={progressPercent}
            />
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-150 hover:bg-slate-50"
              >
                {t('studentFeedback.cancel')}
              </button>
              <Button onClick={handleSubmit} disabled={!isComplete || isSubmitting} isLoading={isSubmitting}>
                {isSubmitting
                  ? t('studentFeedback.submitting')
                  : remaining === 1
                    ? t('studentFeedback.submitAll', { count: remaining })
                    : t('studentFeedback.submitAllPlural', { count: remaining })}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
