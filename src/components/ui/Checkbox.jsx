export default function Checkbox({ id, label, checked, onChange, ...rest }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer select-none items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        // `accentColor` is set inline (not just via the `accent-brand-600`
        // Tailwind class) so the checked fill is guaranteed to be exactly
        // #177285 regardless of Tailwind's theme/utility generation —
        // native checkbox semantics (keyboard access, label click, the
        // checkmark glyph itself) are entirely untouched, only the
        // rendered color changes.
        style={{ accentColor: '#177285' }}
        className="h-4 w-4 cursor-pointer rounded border-slate-300 focus:ring-2 focus:ring-brand-600/40"
        {...rest}
      />
      <span className="text-sm text-slate-600">{label}</span>
    </label>
  )
}
