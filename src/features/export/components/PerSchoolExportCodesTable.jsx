import { useEffect, useMemo, useState } from 'react'
import DashboardTable from '../../../components/table/DashboardTable'
import Spinner from '../../../components/ui/Spinner'
import ErrorState from '../../../components/ui/ErrorState'
import { getFullSchoolDirectory } from '../../../services/schoolDirectory.service'
import { getSchoolExportCodes, saveSchoolExportCodes } from '../../../services/schoolExportCodes.service'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'

const CODE_INPUT_CLASSES =
  'w-32 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 transition-all duration-150 ease-out focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none'

export default function PerSchoolExportCodesTable({ directoryVersion }) {
  const [codes, setCodes] = useState(getSchoolExportCodes)
  const [directory, setDirectory] = useState(null)
  const [error, setError] = useState(null)
  const isDirectoryLoading = directory === null

  const loadDirectory = () => {
    setError(null)
    getFullSchoolDirectory()
      .then((result) => setDirectory(result))
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load schools.')))
  }

  useEffect(() => {
    let isMounted = true
    getFullSchoolDirectory()
      .then((result) => {
        if (isMounted) setDirectory(result)
      })
      .catch((err) => {
        if (isMounted) setError(getApiErrorMessage(err, 'Could not load schools.'))
      })
    return () => {
      isMounted = false
    }
  }, [directoryVersion])

  const handleCodeChange = (udise, field) => (event) => {
    setCodes((prev) => {
      const next = { ...prev, [udise]: { ...prev[udise], [field]: event.target.value } }
      saveSchoolExportCodes(next)
      return next
    })
  }

  const columns = useMemo(
    () => [
      {
        key: 'schoolName',
        label: 'School',
        sortable: true,
        render: (row) => (
          <div>
            <p className="font-medium text-slate-900">{row.schoolName}</p>
            <p className="text-xs text-slate-400">{row.udise}</p>
          </div>
        ),
      },
      {
        key: 'districtCode',
        label: 'District Code*',
        render: (row) => (
          <input
            type="text"
            placeholder="e.g. S08116"
            value={codes[row.udise]?.districtCode || ''}
            onChange={handleCodeChange(row.udise, 'districtCode')}
            className={CODE_INPUT_CLASSES}
          />
        ),
      },
      {
        key: 'postalCode',
        label: 'Postal Code',
        render: (row) => (
          <input
            type="text"
            placeholder="e.g. 342001"
            value={codes[row.udise]?.postalCode || ''}
            onChange={handleCodeChange(row.udise, 'postalCode')}
            className={CODE_INPUT_CLASSES}
          />
        ),
      },
    ],
    [codes],
  )

  return (
    <div className="mt-6">
      <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Per-School District Code &amp; Postal Code
      </p>
      <p className="mb-3 text-sm text-slate-500">
        Required for export. District code format: <span className="font-medium text-slate-700">S08116</span>.
      </p>

      {isDirectoryLoading && !error ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadDirectory} />
      ) : (
        <DashboardTable
          columns={columns}
          data={directory}
          searchKeys={['schoolName', 'udise']}
          searchPlaceholder="Search schools..."
          emptyMessage={directory.length === 0 ? 'No Schools Registered Yet' : 'No schools match your search.'}
        />
      )}
    </div>
  )
}
