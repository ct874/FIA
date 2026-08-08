import { useMemo, useState } from 'react'
import Spinner from '../../../components/ui/Spinner'
import ErrorState from '../../../components/ui/ErrorState'
import DashboardHeroBanner from './DashboardHeroBanner'
import DashboardFilterBar from './DashboardFilterBar'
import SummaryCard from '../../../components/ui/SummaryCard'
import TourMetricsSection from './TourMetricsSection'
import { CsatItpCard, NpsCard } from './TourMetricCard'
import { useSchoolRecords } from '../../../hooks/useSchoolRecords'
import { useLanguage } from '../../../hooks/useLanguage'
import {
  getOverviewFilterOptions,
  computeOverviewSummary,
  computeTourBreakdown,
} from '../../../data/schoolRecords.derive'

const INITIAL_FILTERS = { district: '', tourId: '', month: '' }

function buildResultLabel(filters, options, t) {
  const parts = []
  if (filters.district) parts.push(filters.district)
  if (filters.tourId) {
    parts.push(options.tours.find((tour) => tour.id === filters.tourId)?.name)
  }
  if (filters.month) parts.push(filters.month)

  return parts.length > 0 ? t('home.filter.showing', { parts: parts.join(' · ') }) : t('home.filter.showingAll')
}

export default function DashboardOverview() {
  const { schools, isLoading, error, refetch } = useSchoolRecords()
  const { t } = useLanguage()
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  const options = useMemo(() => getOverviewFilterOptions(schools), [schools])
  const summary = useMemo(() => computeOverviewSummary(schools, filters), [schools, filters])
  const tourBreakdown = useMemo(() => computeTourBreakdown(schools, filters), [schools, filters])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleClear = () => setFilters(INITIAL_FILTERS)

  return (
    <div>
      <DashboardHeroBanner />

      <DashboardFilterBar
        options={options}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClear}
        resultLabel={buildResultLabel(filters, options, t)}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          {/* "Target Students" and "Student Feedback Responses" cards were
              removed from this grid per product request — their underlying
              computeOverviewSummary() values (totalTargetStudents,
              studentResponses) are intentionally left untouched below since
              other consumers still rely on them. */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard accent label={t('home.summary.schools')} value={summary.schoolsCount} />
            <SummaryCard
              accent
              label={t('home.summary.teacherResponses')}
              value={summary.teacherResponses.toLocaleString()}
            />
            <SummaryCard accent label={t('home.summary.overallCsat')} value={summary.overallCsat.toFixed(2)} />
            <SummaryCard accent label={t('home.summary.overallItp')} value={summary.overallItp.toFixed(2)} />
          </div>

          <TourMetricsSection title={t('home.csatItpByTour')}>
            {tourBreakdown.map((tour) => (
              <CsatItpCard key={tour.tourId} tour={tour} />
            ))}
          </TourMetricsSection>

          <TourMetricsSection title={t('home.npsByTour')}>
            {tourBreakdown.map((tour) => (
              <NpsCard key={tour.tourId} tour={tour} />
            ))}
          </TourMetricsSection>
        </>
      )}
    </div>
  )
}
