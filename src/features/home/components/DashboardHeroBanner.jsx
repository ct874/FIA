import { useLanguage } from '../../../hooks/useLanguage'

export default function DashboardHeroBanner() {
  const { t } = useLanguage()

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-800 to-slate-900 p-8 shadow-xl shadow-brand-900/20 sm:p-10">
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-brand-400/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative">
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-100 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
          {t('home.heroLabel')}
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{t('home.heroTitle')}</h1>
      </div>
    </div>
  )
}
