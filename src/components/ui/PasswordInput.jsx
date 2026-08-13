import { useState } from 'react'
import { useLanguage } from '../../hooks/useLanguage'

export default function PasswordInput({ id, label, error, className = '', ...rest }) {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          className={`w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400
            transition-all duration-150 ease-out
            focus:outline-none focus:ring-4
            ${
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                : 'border-slate-200 focus:border-brand-400 focus:ring-brand-100'
            }
            ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
          aria-label={isVisible ? t('common.hidePassword') : t('common.showPassword')}
          tabIndex={-1}
        >
          {isVisible ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 4.24A9.77 9.77 0 0112 4c5 0 9 4 10 8-.31 1.2-.86 2.32-1.6 3.3M6.1 6.1C3.9 7.6 2.3 9.7 2 12c.9 3.6 4.6 7 10 7 1.13 0 2.2-.15 3.2-.44"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M2 12c1-4 5-8 10-8s9 4 10 8c-1 4-5 8-10 8s-9-4-10-8z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
