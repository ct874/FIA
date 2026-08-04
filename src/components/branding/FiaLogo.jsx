import { useLanguage } from '../../hooks/useLanguage'

export default function FiaLogo({ className = 'h-14 w-14' }) {
  const { t } = useLanguage()

  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 font-heading text-white shadow-lg shadow-slate-900/20 ${className}`}
      role="img"
      aria-label={t('common.fiaLogo')}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-2/3 w-2/3">
        <path
          d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 12.2l2.4 2.4 4.6-5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
