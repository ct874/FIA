import { useMemo } from 'react'
import Spinner from '../../../components/ui/Spinner'
import ErrorState from '../../../components/ui/ErrorState'
import StatusBadge from '../../../components/ui/StatusBadge'
import DashboardTable from '../../../components/table/DashboardTable'
import { useSchoolRecords } from '../../../hooks/useSchoolRecords'
import { computeRegisteredRows } from '../../../data/schoolRecords.derive'

const COLUMNS = [
  {
    key: 'school',
    label: 'School',
    sortable: true,
    wrap: true,
    render: (row) => <span className="font-medium text-slate-900">{row.school}</span>,
  },
  { key: 'udise', label: 'UDISE' },
  { key: 'district', label: 'District', sortable: true },
  { key: 'teacherFb', label: 'Teacher FB', render: (row) => <StatusBadge status={row.teacherFb} /> },
  { key: 'reachData', label: 'Reach Data', render: (row) => <StatusBadge status={row.reachData} /> },
  { key: 'studentFb', label: 'Student FB', render: (row) => <StatusBadge status={row.studentFb} /> },
  {
    key: 'overallStatus',
    label: 'Overall Status',
    sortable: true,
    render: (row) => <StatusBadge status={row.overallStatus} />,
  },
  { key: 'lastActivity', label: 'Last Activity' },
]

export default function RegisteredSchoolsSection() {
  const { schools, isLoading, error, refetch } = useSchoolRecords()
  const rows = useMemo(() => computeRegisteredRows(schools), [schools])

  return (
    <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Registered Schools</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
          List of all registered schools and their current submission progress.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="mt-6">
          <DashboardTable
            columns={COLUMNS}
            data={rows}
            searchKeys={['school', 'district', 'udise']}
            searchPlaceholder="Search by school, district or UDISE..."
            emptyMessage={
              rows.length === 0 ? 'No Schools Registered Yet' : 'No registered schools match your search.'
            }
            fluid
          />
        </div>
      )}
    </section>
  )
}
