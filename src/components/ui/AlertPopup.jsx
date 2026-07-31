import Modal from './Modal'

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

const VARIANTS = {
  success: { headerBg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600', Icon: CheckIcon },
  error: { headerBg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600', Icon: ErrorIcon },
  warning: { headerBg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', Icon: WarningIcon },
}

export default function AlertPopup({
  isOpen,
  onClose,
  variant = 'success',
  title,
  children,
  primaryLabel = 'Close',
}) {
  const { headerBg, iconBg, iconColor, Icon } = VARIANTS[variant] || VARIANTS.success

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className={`rounded-t-3xl px-6 pt-9 pb-6 text-center ${headerBg}`}>
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className={`h-7 w-7 ${iconColor}`} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      </div>

      <div className="px-6 py-6 text-center text-sm leading-relaxed text-slate-600">{children}</div>

      <div className="border-t border-slate-100 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 ease-out hover:bg-slate-800 hover:shadow-md hover:shadow-slate-900/20"
        >
          {primaryLabel}
        </button>
      </div>
    </Modal>
  )
}
