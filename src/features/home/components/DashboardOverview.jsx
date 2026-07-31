import { useMemo, useState } from 'react'
import Spinner from '../../../components/ui/Spinner'
import DashboardHeroBanner from './DashboardHeroBanner'
import DashboardFilterBar from './DashboardFilterBar'
import SummaryCard from '../../../components/ui/SummaryCard'
import TourMetricsSection from './TourMetricsSection'
import { CsatItpCard, NpsCard } from './TourMetricCard'
import { useSchoolRecords } from '../../../hooks/useSchoolRecords'
import {
  getOverviewFilterOptions,
  computeOverviewSummary,
  computeTourBreakdown,
} from '../../../data/schoolRecords.derive'

const INITIAL_FILTERS = { district: '', tourId: '', month: '' }

function buildResultLabel(filters, options) {
  const parts = []
  if (filters.district) parts.push(filters.district)
  if (filters.tourId) {
    parts.push(options.tours.find((tour) => tour.id === filters.tourId)?.name)
  }
  if (filters.month) parts.push(filters.month)

  return parts.length > 0 ? `Showing: ${parts.join(' · ')}` : 'Showing all data'
}

export default function DashboardOverview() {
  const { schools, isLoading } = useSchoolRecords()
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
        resultLabel={buildResultLabel(filters, options)}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <SummaryCard accent label="Schools" value={summary.schoolsCount} />
            <SummaryCard accent label="Total Reach (Unique)" value={summary.totalReach.toLocaleString()} />
            <SummaryCard accent label="Student Feedback Responses" value={summary.studentResponses.toLocaleString()} />
            <SummaryCard accent label="Teacher Responses" value={summary.teacherResponses.toLocaleString()} />
            <SummaryCard accent label="Overall CSAT (Enjoy)" value={summary.overallCsat.toFixed(2)} />
            <SummaryCard accent label="Overall ITP (Interest)" value={summary.overallItp.toFixed(2)} />
          </div>

          <TourMetricsSection title="CSAT & ITP by Tour">
            {tourBreakdown.map((tour) => (
              <CsatItpCard key={tour.tourId} tour={tour} />
            ))}
          </TourMetricsSection>

          <TourMetricsSection title="NPS by Tour">
            {tourBreakdown.map((tour) => (
              <NpsCard key={tour.tourId} tour={tour} />
            ))}
          </TourMetricsSection>
        </>
      )}
    </div>
  )
}
