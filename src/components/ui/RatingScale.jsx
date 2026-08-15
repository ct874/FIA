export default function RatingScale({ label, value, onChange, min = 1, max = 5, hint, error }) {
  const options = []
  for (let option = min; option <= max; option += 1) options.push(option)

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {hint && <p className="mb-2 text-xs text-slate-400">{hint}</p>}
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold
              transition-all duration-150 ease-out
              ${
                value === option
                  ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/25'
                  : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50'
              }`}
          >
            {option}
          </button>
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}
