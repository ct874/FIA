import { useLanguage } from '../../../hooks/useLanguage'

function FilterIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 5h16M7 12h10M11 19h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const SELECT_CLASSES =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all duration-150 ease-out focus:border-slate-400 focus:ring-4 focus:ring-slate-100 focus:outline-none'

export default function DashboardFilterBar({ options, filters, onFilterChange, onClear, resultLabel }) {
  const { t } = useLanguage()
  const hasActiveFilter = Boolean(filters.district || filters.tourId || filters.month)

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <FilterIcon />
          {t('home.filter.label')}
        </span>

        <select
          value={filters.district}
          onChange={(event) => onFilterChange('district', event.target.value)}
          className={SELECT_CLASSES}
        >
          <option value="">{t('home.filter.allDistricts')}</option>
          {options.districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>

        <select
          value={filters.tourId}
          onChange={(event) => onFilterChange('tourId', event.target.value)}
          className={SELECT_CLASSES}
        >
          <option value="">{t('home.filter.allTours')}</option>
          {options.tours.map((tour) => (
            <option key={tour.id} value={tour.id}>
              {tour.name}
            </option>
          ))}
        </select>

        <select
          value={filters.month}
          onChange={(event) => onFilterChange('month', event.target.value)}
          className={SELECT_CLASSES}
        >
          <option value="">{t('home.filter.allMonths')}</option>
          {options.months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors duration-150 hover:text-slate-800"
          >
            {t('home.filter.clear')}
          </button>
        )}
      </div>

      <p className="text-sm font-medium text-blue-600">{resultLabel}</p>
    </div>
  )
}
