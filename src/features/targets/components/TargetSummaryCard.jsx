import { useLanguage } from '../../../hooks/useLanguage'

function Stat({ label, value, accentClass = 'text-slate-900' }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
      <p className={`text-2xl font-semibold tracking-tight ${accentClass}`}>{value}</p>
      <p className="mt-1 text-xs font-medium tracking-wide text-slate-400 uppercase">{label}</p>
    </div>
  )
}

// Top-of-page KPI card for the active tab (Students or Teachers) — adapted
// to the platform's existing light-card design language (SummaryCard /
// TourMetricCard tokens) rather than the dark reference mockup.
export default function TargetSummaryCard({ unit, percent, target, achieved, remaining, districtsCovered }) {
  const { t } = useLanguage()
  const clampedPercent = Math.min(100, Math.max(0, percent))
  const isTargetMet = clampedPercent >= 100

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
      <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {t(`targets.summary.${unit}Progress`)}
      </p>
      <p
        className={`mt-1.5 text-4xl font-semibold tracking-tight sm:text-5xl ${
          isTargetMet ? 'text-accent-500' : 'text-slate-900'
        }`}
      >
        {percent}%
      </p>

      <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isTargetMet ? 'bg-accent-400' : 'bg-brand-600'
          }`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t(`targets.summary.${unit}Target`)} value={target.toLocaleString()} />
        <Stat label={t('targets.summary.achieved')} value={achieved.toLocaleString()} accentClass="text-brand-600" />
        <Stat label={t('targets.summary.remaining')} value={remaining.toLocaleString()} accentClass="text-slate-600" />
        <Stat label={t('targets.summary.districtsCovered')} value={districtsCovered} />
      </div>
    </div>
  )
}
