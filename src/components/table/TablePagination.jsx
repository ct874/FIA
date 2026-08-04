import { useLanguage } from '../../hooks/useLanguage'

export default function TablePagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  const { t } = useLanguage()

  if (totalItems === 0) return null

  const rangeStart = (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalItems)

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-slate-500">
        {t('common.showingRange', { start: rangeStart, end: rangeEnd, total: totalItems })}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600
            transition-all duration-150 ease-out hover:bg-slate-100
            disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        >
          {t('common.previous')}
        </button>
        <span className="px-1 text-xs font-medium text-slate-500">
          {t('common.pageOf', { page, totalPages })}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600
            transition-all duration-150 ease-out hover:bg-slate-100
            disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  )
}
