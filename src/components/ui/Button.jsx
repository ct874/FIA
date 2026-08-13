import Spinner from './Spinner'

// Reusable button design system. `variant` is purely additive — every
// existing call site omits it and keeps getting the original primary
// (brand-colored, full-width) look, just re-themed to the new palette.
const VARIANT_CLASSES = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-900/20 focus-visible:ring-brand-500',
  secondary:
    'border border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:ring-brand-400',
  accent:
    'bg-accent-400 text-slate-900 hover:bg-accent-500 hover:shadow-lg hover:shadow-accent-900/15 focus-visible:ring-accent-500',
  danger:
    'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-900/20 focus-visible:ring-red-500',
}

export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`group relative flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold
        transition-all duration-200 ease-out
        hover:-translate-y-0.5
        active:translate-y-0 active:shadow-none
        disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary}
        ${className}`}
      {...rest}
    >
      {isLoading && <Spinner className="h-4 w-4" />}
      <span>{children}</span>
    </button>
  )
}
