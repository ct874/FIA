import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../hooks/useLanguage'

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

function CloseIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Modal({
  isOpen,
  onClose,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
  children,
}) {
  const { t } = useLanguage()

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && closeOnBackdrop) onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, closeOnBackdrop])

  if (!isOpen) return null

  // Portaled straight to <body>: page wrappers use a permanently-attached
  // `animate-fade-in-up` class for the route transition, and a persistent
  // CSS animation targeting `transform` makes Chromium treat that ancestor
  // as a containing block for `fixed` descendants — which would otherwise
  // pin this modal to that ancestor's position instead of the viewport.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
        className="animate-fade-in-up fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`animate-fade-in-up relative z-10 max-h-[90vh] w-full ${SIZE_CLASSES[size]} overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-900/20`}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700"
            aria-label={t('common.close')}
          >
            <CloseIcon />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
