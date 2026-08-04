import { useLanguage } from '../../hooks/useLanguage'

export default function Footer({ label }) {
  const { t } = useLanguage()
  const resolvedLabel = label ?? t('nav.adminPanelTitle')

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-5 text-center sm:px-6 lg:px-8">
        <p className="text-xs text-slate-500">{t('footer.copyright', { label: resolvedLabel })}</p>
        <p className="mt-0.5 text-xs text-slate-400">{t('footer.poweredBy')}</p>
      </div>
    </footer>
  )
}
