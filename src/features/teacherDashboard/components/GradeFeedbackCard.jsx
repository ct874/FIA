import { useLanguage } from '../../../hooks/useLanguage'

function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatCell({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default function GradeFeedbackCard({ grade, onStart }) {
  const { t } = useLanguage()
  const remaining = Math.max(0, grade.target - grade.submittedCount)
  const progressPercent =
    grade.target === 0 ? 100 : Math.min(100, Math.round((grade.submittedCount / grade.target) * 100))

  return (
    <div
      className={`animate-fade-in-up overflow-hidden rounded-2xl border shadow-sm shadow-slate-900/5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg ${
        grade.targetMet ? 'border-green-200' : 'border-slate-200/80'
      }`}
    >
      <div className={`px-5 py-4 text-white ${grade.targetMet ? 'bg-green-600' : 'bg-slate-900'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {t('feedbackBatch.gradeLabel')} {grade.grade}
          </h3>
          {grade.targetMet && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <CheckIcon className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs opacity-80">
          {t('gradeFeedbackCard.studentsAndTours', { students: grade.totalStudents, tours: grade.tours.length })}
        </p>
      </div>

      <div className="bg-white p-5">
        <div className="grid grid-cols-2 gap-y-3">
          <StatCell
            label={t('gradeFeedbackCard.required', { percent: Math.round(grade.targetPercent ?? 40) })}
            value={grade.target}
          />
          <StatCell label={t('gradeFeedbackCard.completed')} value={grade.submittedCount} />
          <StatCell label={t('gradeFeedbackCard.remaining')} value={remaining} />
          <StatCell label={t('gradeFeedbackCard.progress')} value={`${progressPercent}%`} />
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              grade.targetMet ? 'bg-green-500' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {grade.targetMet ? (
          <p className="mt-3 text-sm font-medium text-green-700">{t('gradeFeedbackCard.targetMetNote')}</p>
        ) : (
          <button
            type="button"
            onClick={() => onStart(grade)}
            className="mt-4 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 ease-out hover:bg-amber-600 hover:shadow-md hover:shadow-amber-500/25"
          >
            {grade.submittedCount > 0
              ? t('gradeFeedbackCard.continueFeedback', { count: remaining })
              : t('gradeFeedbackCard.startFeedback')}
          </button>
        )}
      </div>
    </div>
  )
}
