import { useLanguage } from '../../../hooks/useLanguage'

function MiniStat({ label, value, accentClass = 'text-slate-900' }) {
  return (
    <div>
      <p className={`text-sm font-semibold ${accentClass}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-medium tracking-wide text-slate-400 uppercase">{label}</p>
    </div>
  )
}

// One card per district, generated dynamically from whatever districts the
// progress API returns — never a hardcoded list. Clicking opens the detail
// modal with both units' numbers.
export default function TargetDistrictCard({ district, percent, target, achieved, remaining, onClick }) {
  const { t } = useLanguage()
  const clampedPercent = Math.min(100, Math.max(0, percent))

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm shadow-slate-900/5
        transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/10
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-base font-semibold text-slate-900">{district}</p>
        <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">
          {percent}%
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300 ease-out"
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MiniStat label={t('targets.summary.target')} value={target.toLocaleString()} />
        <MiniStat label={t('targets.summary.achieved')} value={achieved.toLocaleString()} accentClass="text-brand-600" />
        <MiniStat
          label={t('targets.summary.remaining')}
          value={remaining.toLocaleString()}
          accentClass="text-slate-600"
        />
      </div>

      {target === 0 && (
        <p className="mt-3 text-xs font-medium text-accent-600">{t('targets.district.noTargetConfigured')}</p>
      )}
    </button>
  )
}
