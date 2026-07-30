import Spinner from './Spinner'

export default function Button({
  children,
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
      className={`group relative flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white
        transition-all duration-200 ease-out
        hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 hover:-translate-y-0.5
        active:translate-y-0 active:shadow-none
        disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2
        ${className}`}
      {...rest}
    >
      {isLoading && <Spinner className="h-4 w-4" />}
      <span>{children}</span>
    </button>
  )
}
