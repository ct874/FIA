import { useLanguage } from '../../hooks/useLanguage'

function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function SearchInput({
  value,
  onChange,
  placeholder,
  className = '',
}) {
  const { t } = useLanguage()

  return (
    <div className={`relative ${className}`}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder || t('table.searchPlaceholder')}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-900
          transition-all duration-150 ease-out placeholder:text-slate-400
          focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none"
      />
    </div>
  )
}
