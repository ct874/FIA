import { useMemo } from 'react'
import SummaryCard from '../../../components/ui/SummaryCard'
import Spinner from '../../../components/ui/Spinner'
import ErrorState from '../../../components/ui/ErrorState'
import DashboardTable from '../../../components/table/DashboardTable'
import TypeBadge from '../../../components/ui/TypeBadge'
import GradeSummaryCard from '../components/GradeSummaryCard'
import { useSchoolRecords } from '../../../hooks/useSchoolRecords'
import { getAllSubmissionRows, computeSubmissionsSummary } from '../utils/mergeSubmissions'
import { computeGradeSummaryCards } from '../../../data/schoolRecords.derive'

function formatTime(iso) {
  const date = new Date(iso)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
}

const COLUMNS = [
  { key: 'type', label: 'Type', render: (row) => <TypeBadge type={row.type} /> },
  { key: 'school', label: 'School', sortable: true },
  { key: 'tour', label: 'Tour' },
  { key: 'grade', label: 'Grade' },
  { key: 'month', label: 'Month' },
  { key: 'time', label: 'Time', sortable: true, render: (row) => formatTime(row.time) },
]

export default function SubmissionsPage() {
  const { schools, isLoading, error, refetch } = useSchoolRecords()
  const rows = useMemo(() => getAllSubmissionRows(schools), [schools])
  const summary = useMemo(() => computeSubmissionsSummary(rows), [rows])
  const gradeCards = useMemo(() => computeGradeSummaryCards(schools), [schools])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">All Submissions</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryCard accent label="Total Student Feedback Submitted" value={summary.totalStudentFeedback} />
            <SummaryCard accent label="Teacher Responses" value={summary.teacherResponses} />
            <SummaryCard accent label="Avg CSAT" value={summary.avgCsat.toFixed(2)} />
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Feedback by Grade — All Schools
            </p>
            {gradeCards.length === 0 ? (
              <p className="text-sm text-slate-400">No grade-wise reach data available yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {gradeCards.map((card) => (
                  <GradeSummaryCard key={card.grade} card={card} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
            <DashboardTable
              columns={COLUMNS}
              data={rows}
              searchKeys={['school', 'tour']}
              searchPlaceholder="Search by school or tour..."
              emptyMessage="No submissions yet."
            />
          </div>
        </>
      )}
    </div>
  )
}
