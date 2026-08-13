import { useLanguage } from '../../hooks/useLanguage'

const STATUS_STYLES = {
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Pending: 'bg-accent-50 text-accent-800 border-accent-200',
  'Not Started': 'bg-slate-100 text-slate-500 border-slate-200',
  'In Progress': 'bg-brand-50 text-brand-700 border-brand-200',
}

// Data-layer status values stay canonical English strings (used as style
// lookup keys and business logic elsewhere) — only the displayed label is
// translated here.
const STATUS_LABEL_KEYS = {
  Completed: 'home.registered.status.completed',
  Pending: 'home.registered.status.pending',
  'Not Started': 'home.registered.status.notStarted',
  'In Progress': 'home.registered.status.inProgress',
}

const DEFAULT_STYLE = 'bg-slate-100 text-slate-500 border-slate-200'

export default function StatusBadge({ status, className = '' }) {
  const { t } = useLanguage()
  const label = STATUS_LABEL_KEYS[status] ? t(STATUS_LABEL_KEYS[status]) : status

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
        STATUS_STYLES[status] || DEFAULT_STYLE
      } ${className}`}
    >
      {label}
    </span>
  )
}
