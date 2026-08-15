import { useLanguage } from '../../hooks/useLanguage'

export default function ErrorState({ message, onRetry }) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm font-medium text-red-600">{message || t('errorState.defaultMessage')}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50"
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
