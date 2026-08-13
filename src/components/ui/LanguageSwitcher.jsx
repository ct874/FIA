import { useLanguage } from '../../hooks/useLanguage'
import { SUPPORTED_LANGUAGES } from '../../locales'

function GlobeIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div
      role="radiogroup"
      aria-label={t('language.label')}
      className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm shadow-slate-900/5 ${className}`}
    >
      <GlobeIcon className="ml-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
      {SUPPORTED_LANGUAGES.map((option) => {
        const isActive = option.code === language
        return (
          <button
            key={option.code}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setLanguage(option.code)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-out ${
              isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-brand-50 hover:text-brand-700'
            }`}
          >
            {t(option.labelKey)}
          </button>
        )
      })}
    </div>
  )
}
