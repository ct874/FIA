const STATUS_STYLES = {
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Pending: 'bg-orange-50 text-orange-700 border-orange-200',
  'Not Started': 'bg-slate-100 text-slate-500 border-slate-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
}

const DEFAULT_STYLE = 'bg-slate-100 text-slate-500 border-slate-200'

export default function StatusBadge({ status, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
        STATUS_STYLES[status] || DEFAULT_STYLE
      } ${className}`}
    >
      {status}
    </span>
  )
}
