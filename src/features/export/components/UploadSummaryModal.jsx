import { useMemo, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import DashboardTable from '../../../components/table/DashboardTable'
import { downloadUploadReport } from '../utils/uploadReport'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'registered', label: 'Registered' },
  { key: 'duplicate', label: 'Already Registered' },
  { key: 'invalid', label: 'Invalid' },
]

const STATUS_PILL = {
  registered: { label: '✅ Registered', className: 'bg-green-50 text-green-700 border-green-200' },
  duplicate: { label: '❌ Already Exists', className: 'bg-red-50 text-red-700 border-red-200' },
  invalid: { label: '⚠ Invalid Row', className: 'bg-orange-50 text-orange-700 border-orange-200' },
}

function StatusPill({ status }) {
  const pill = STATUS_PILL[status] || { label: status, className: 'bg-slate-100 text-slate-500 border-slate-200' }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${pill.className}`}
    >
      {pill.label}
    </span>
  )
}

function StatCard({ icon, label, value, accentClassName }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm shadow-slate-900/5 ${accentClassName}`}>
      <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-slate-400 uppercase">
        <span aria-hidden="true">{icon}</span>
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

const COLUMNS = [
  { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> },
  { key: 'udise', label: 'UDISE' },
  { key: 'schoolName', label: 'School Name', wrap: true },
  { key: 'district', label: 'District' },
  { key: 'state', label: 'State' },
  { key: 'message', label: 'Message', wrap: true, wrapWidthClassName: 'w-48' },
]

export default function UploadSummaryModal({ isOpen, onClose, summary }) {
  const [activeFilter, setActiveFilter] = useState('all')

  const filteredResults = useMemo(() => {
    if (!summary) return []
    if (activeFilter === 'all') return summary.results
    return summary.results.filter((row) => row.status === activeFilter)
  }, [summary, activeFilter])

  if (!summary) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6 sm:p-8">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">Upload Summary</h3>
        <p className="mt-1.5 text-sm text-slate-500">Here's what happened with your uploaded file.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon="📄" label="Total Records" value={summary.total} accentClassName="border-slate-200" />
          <StatCard
            icon="✅"
            label="Successfully Registered"
            value={summary.success}
            accentClassName="border-t-4 border-t-green-400 border-slate-200"
          />
          <StatCard
            icon="❌"
            label="Already Registered"
            value={summary.duplicates}
            accentClassName="border-t-4 border-t-red-400 border-slate-200"
          />
          <StatCard
            icon="⚠"
            label="Invalid Rows"
            value={summary.invalid}
            accentClassName="border-t-4 border-t-orange-400 border-slate-200"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ease-out ${
                  activeFilter === filter.key
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => downloadUploadReport(summary.results)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700
              transition-all duration-200 ease-out hover:bg-slate-100"
          >
            Download Report
          </button>
        </div>

        <div className="mt-4">
          <DashboardTable
            columns={COLUMNS}
            data={filteredResults}
            searchKeys={['schoolName', 'udise', 'district']}
            searchPlaceholder="Search by school name, UDISE or district..."
            emptyMessage="No rows match this filter."
            fluid
          />
        </div>
      </div>
    </Modal>
  )
}
