import { createPortal } from 'react-dom'
import { useLanguage } from '../../hooks/useLanguage'

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ErrorIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WarningIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A1.5 1.5 0 003.4 20.4h17.2a1.5 1.5 0 001.29-2.36L13.71 3.86a1.5 1.5 0 00-2.42 0z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function InfoIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 8h.01M11 12h1v5h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

const VARIANTS = {
  success: { iconBg: 'bg-green-100', iconColor: 'text-green-600', border: 'border-l-green-500', Icon: CheckIcon },
  error: { iconBg: 'bg-red-100', iconColor: 'text-red-600', border: 'border-l-red-500', Icon: ErrorIcon },
  warning: { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', border: 'border-l-amber-500', Icon: WarningIcon },
  info: { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', border: 'border-l-blue-500', Icon: InfoIcon },
}

function CloseIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ToastViewport({ toasts, onDismiss }) {
  const { t } = useLanguage()

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-6 sm:items-end sm:px-6"
    >
      {toasts.map((toast) => {
        const { iconBg, iconColor, border, Icon } = VARIANTS[toast.variant] || VARIANTS.info
        return (
          <div
            key={toast.id}
            role="status"
            className={`animate-fade-in-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border-l-4 bg-white p-4 shadow-xl shadow-slate-900/10 ${border}`}
          >
            <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${iconBg}`}>
              <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
            </div>
            <p className="flex-1 pt-1 text-sm font-medium text-slate-800">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="flex-none rounded-lg p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600"
              aria-label={t('common.dismissNotification')}
            >
              <CloseIcon />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
