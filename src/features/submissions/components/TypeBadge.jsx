const STYLES = {
  Teacher: 'bg-purple-50 text-purple-700 border-purple-200',
  Student: 'bg-blue-50 text-blue-700 border-blue-200',
}

export default function TypeBadge({ type }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
        STYLES[type] || 'bg-slate-100 text-slate-500 border-slate-200'
      }`}
    >
      {type}
    </span>
  )
}
