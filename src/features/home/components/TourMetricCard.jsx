import { useLanguage } from '../../../hooks/useLanguage'

const TOUR_ICONS = {
  'CT-L-AM-01': '🎵',
  'CT-L-AWS-01': '☁️',
  'CT-L-FC-01': '🤖',
  'CT-L-AI-01': '🧠',
  'CT-L-PRIME-01': '🎬',
}

function formatMetric(value) {
  return value == null ? '—' : value.toFixed(2)
}

export function CsatItpCard({ tour }) {
  const { t } = useLanguage()

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/10">
      <p className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-base"
          aria-hidden="true"
        >
          {TOUR_ICONS[tour.tourId]}
        </span>
        {tour.tourName}
      </p>
      <div className="mt-4 flex gap-8">
        <div>
          <p className="text-2xl font-semibold text-brand-600">{formatMetric(tour.csat)}</p>
          <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{t('home.csatLabel')}</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-700">{formatMetric(tour.itp)}</p>
          <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{t('home.itpLabel')}</p>
        </div>
      </div>
    </div>
  )
}

export function NpsCard({ tour }) {
  const color = tour.nps == null ? 'text-slate-400' : tour.nps >= 50 ? 'text-green-600' : 'text-accent-700'

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/10">
      <p className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-base"
          aria-hidden="true"
        >
          {TOUR_ICONS[tour.tourId]}
        </span>
        {tour.tourName}
      </p>
      <p className={`mt-4 text-3xl font-semibold ${color}`}>{formatMetric(tour.nps)}</p>
    </div>
  )
}
