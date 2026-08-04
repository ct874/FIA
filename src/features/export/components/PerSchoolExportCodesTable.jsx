import { useEffect, useMemo, useState } from 'react'
import DashboardTable from '../../../components/table/DashboardTable'
import Spinner from '../../../components/ui/Spinner'
import ErrorState from '../../../components/ui/ErrorState'
import { getFullSchoolDirectory } from '../../../services/schoolDirectory.service'
import { getSchoolExportCodes, saveSchoolExportCodes } from '../../../services/schoolExportCodes.service'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { useLanguage } from '../../../hooks/useLanguage'

const CODE_INPUT_CLASSES =
  'w-32 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 transition-all duration-150 ease-out focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none'

export default function PerSchoolExportCodesTable({ directoryVersion }) {
  const { t } = useLanguage()
  const [codes, setCodes] = useState(getSchoolExportCodes)
  const [directory, setDirectory] = useState(null)
  const [error, setError] = useState(null)
  const isDirectoryLoading = directory === null

  const loadDirectory = () => {
    setError(null)
    getFullSchoolDirectory()
      .then((result) => setDirectory(result))
      .catch((err) => setError(getApiErrorMessage(err, t('export.perSchoolCodes.loadError'))))
  }

  useEffect(() => {
    let isMounted = true
    getFullSchoolDirectory()
      .then((result) => {
        if (isMounted) setDirectory(result)
      })
      .catch((err) => {
        if (isMounted) setError(getApiErrorMessage(err, t('export.perSchoolCodes.loadError')))
      })
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        label: t('home.registered.columns.school'),
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
        label: t('export.perSchoolCodes.districtCode'),
        render: (row) => (
          <input
            type="text"
            placeholder={t('export.perSchoolCodes.districtCodePlaceholder')}
            value={codes[row.udise]?.districtCode || ''}
            onChange={handleCodeChange(row.udise, 'districtCode')}
            className={CODE_INPUT_CLASSES}
          />
        ),
      },
      {
        key: 'postalCode',
        label: t('export.perSchoolCodes.postalCode'),
        render: (row) => (
          <input
            type="text"
            placeholder={t('export.perSchoolCodes.postalCodePlaceholder')}
            value={codes[row.udise]?.postalCode || ''}
            onChange={handleCodeChange(row.udise, 'postalCode')}
            className={CODE_INPUT_CLASSES}
          />
        ),
      },
    ],
    [codes, t],
  )

  return (
    <div className="mt-6">
      <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {t('export.perSchoolCodes.title')}
      </p>
      <p className="mb-3 text-sm text-slate-500">
        {t('export.perSchoolCodes.description', { example: 'S08116' })}
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
          searchPlaceholder={t('export.perSchoolCodes.searchPlaceholder')}
          emptyMessage={directory.length === 0 ? t('export.perSchoolCodes.emptyAll') : t('export.perSchoolCodes.emptySearch')}
        />
      )}
    </div>
  )
}
