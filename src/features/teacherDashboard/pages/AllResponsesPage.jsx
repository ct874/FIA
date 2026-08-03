import { useEffect, useState } from 'react'
import SummaryCard from '../../../components/ui/SummaryCard'
import Skeleton from '../../../components/ui/Skeleton'
import DashboardTable from '../../../components/table/DashboardTable'
import TypeBadge from '../../../components/ui/TypeBadge'
import { useToast } from '../../../hooks/useToast'
import { fetchAllResponses } from '../../../api/teacherResponses.api'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'

const COLUMNS = [
  { key: 'type', label: 'Type', render: (row) => <TypeBadge type={row.type} /> },
  { key: 'tour', label: 'Tour', sortable: true },
  { key: 'grade', label: 'Grade', sortable: true, render: (row) => row.grade || '—' },
  { key: 'month', label: 'Month', sortable: true },
  {
    key: 'time',
    label: 'Time',
    sortable: true,
    render: (row) => new Date(row.time).toLocaleString(),
  },
]

export default function AllResponsesPage() {
  const toast = useToast()
  const [summary, setSummary] = useState(null)
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const { data } = await fetchAllResponses({ limit: 500 })
        if (isMounted) {
          setSummary(data.data.summary)
          setRows(data.data.rows)
        }
      } catch (error) {
        if (isMounted) toast.error(getApiErrorMessage(error, 'Could not load responses.'))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">All Responses</h1>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard accent label="Total Student Feedback Submitted" value={summary?.totalStudentFeedback ?? 0} />
            <SummaryCard accent label="Teacher Responses" value={summary?.teacherResponses ?? 0} />
            {summary?.topGrade && (
              <SummaryCard
                accent
                label={`Grade ${summary.topGrade.grade} Feedback`}
                value={summary.topGrade.count}
              />
            )}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-6">
            <DashboardTable
              columns={COLUMNS}
              data={rows}
              searchKeys={['type', 'tour', 'grade', 'month']}
              searchPlaceholder="Search responses..."
              emptyMessage="No responses submitted yet."
              pageSize={10}
            />
          </div>
        </>
      )}
    </div>
  )
}
