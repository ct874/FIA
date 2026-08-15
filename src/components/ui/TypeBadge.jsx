import { useLanguage } from '../../hooks/useLanguage'

const STYLES = {
  Teacher: 'bg-purple-50 text-purple-700 border-purple-200',
  Student: 'bg-brand-50 text-brand-700 border-brand-200',
}

const LABEL_KEYS = {
  Teacher: 'common.teacher',
  Student: 'common.student',
}

export default function TypeBadge({ type }) {
  const { t } = useLanguage()

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
        STYLES[type] || 'bg-slate-100 text-slate-500 border-slate-200'
      }`}
    >
      {LABEL_KEYS[type] ? t(LABEL_KEYS[type]) : type}
    </span>
  )
}
