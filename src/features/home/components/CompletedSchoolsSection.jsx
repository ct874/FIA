import { useMemo } from 'react'
import Spinner from '../../../components/ui/Spinner'
import ErrorState from '../../../components/ui/ErrorState'
import SummaryCard from '../../../components/ui/SummaryCard'
import DashboardTable from '../../../components/table/DashboardTable'
import { useSchoolRecords } from '../../../hooks/useSchoolRecords'
import { computeCompletedRows } from '../../../data/schoolRecords.derive'
import { computeCompletedSchoolsSummary } from '../utils/dashboardStats'

const COLUMNS = [
  {
    key: 'school',
    label: 'School',
    sortable: true,
    wrap: true,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-900">{row.school}</span>
      </div>
    ),
  },
  { key: 'district', label: 'District', sortable: true },
  { key: 'tour', label: 'Tour', wrap: true },
  { key: 'grade', label: 'Grade' },
  { key: 'month', label: 'Month' },
  { key: 'reach', label: 'Reach', render: (row) => row.reach.toLocaleString() },
  { key: 'responses', label: 'Responses', render: (row) => row.responses.toLocaleString() },
  { key: 'avgCsat', label: 'Avg CSAT', render: (row) => row.avgCsat.toFixed(1) },
  { key: 'nps', label: 'NPS', render: (row) => `${row.nps}%` },
]

export default function CompletedSchoolsSection() {
  const { schools, isLoading, error, refetch } = useSchoolRecords()
  const rows = useMemo(() => computeCompletedRows(schools), [schools])
  const summary = useMemo(() => computeCompletedSchoolsSummary(rows), [rows])

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Completed Schools</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
          Schools that have successfully completed all three videos and submitted all required
          feedback.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <SummaryCard label="Completed Schools" value={summary.completedSchools} />
            <SummaryCard label="Total Reach" value={summary.totalReach.toLocaleString()} />
            <SummaryCard label="Total Responses" value={summary.totalResponses.toLocaleString()} />
            <SummaryCard label="Average CSAT" value={summary.avgCsat.toFixed(1)} />
            <SummaryCard label="Average NPS" value={`${summary.avgNps}%`} />
          </div>

          <div className="mt-6">
            <DashboardTable
              columns={COLUMNS}
              data={rows}
              searchKeys={['school', 'district']}
              searchPlaceholder="Search by school or district..."
              emptyMessage="No completed schools match your search."
              fluid
            />
          </div>
        </>
      )}
    </section>
  )
}
