export default function Checkbox({ id, label, checked, onChange, ...rest }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer select-none items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 accent-brand-600 focus:ring-2 focus:ring-brand-300"
        {...rest}
      />
      <span className="text-sm text-slate-600">{label}</span>
    </label>
  )
}
