import { useLanguage } from '../../../hooks/useLanguage'

function StatCell({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default function GradeSummaryCard({ card }) {
  const { t } = useLanguage()

  return (
    <div className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/10">
      <p className="text-sm font-semibold text-slate-900">{t('submissions.gradeCard.title', { grade: card.grade })}</p>

      <div className="mt-4 grid grid-cols-2 gap-y-3">
        <StatCell label={t('submissions.gradeCard.totalStudents')} value={card.totalStudents.toLocaleString()} />
        <StatCell
          label={t('submissions.gradeCard.feedbackSubmitted')}
          value={card.totalSubmitted.toLocaleString()}
        />
        <StatCell label={t('submissions.gradeCard.remaining')} value={card.totalRemaining.toLocaleString()} />
        <StatCell label={t('submissions.gradeCard.completion')} value={`${card.completionPercentage}%`} />
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${card.completionPercentage}%` }}
        />
      </div>
    </div>
  )
}
