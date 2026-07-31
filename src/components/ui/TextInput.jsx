export default function TextInput({
  id,
  label,
  error,
  className = '',
  ...rest
}) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400
          transition-all duration-150 ease-out
          focus:outline-none focus:ring-4
          ${
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'
          }
          ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
