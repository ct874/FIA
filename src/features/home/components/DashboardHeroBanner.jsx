import { useLanguage } from '../../../hooks/useLanguage'

export default function DashboardHeroBanner() {
  const { t } = useLanguage()

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-slate-900 to-slate-900 p-8 shadow-xl shadow-slate-900/10 sm:p-10">
      <p className="text-xs font-semibold tracking-widest text-teal-300 uppercase">{t('home.heroLabel')}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{t('home.heroTitle')}</h1>
    </div>
  )
}
