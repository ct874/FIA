import { useMemo } from 'react'
import Spinner from '../../../components/ui/Spinner'
import ErrorState from '../../../components/ui/ErrorState'
import StatusBadge from '../../../components/ui/StatusBadge'
import DashboardTable from '../../../components/table/DashboardTable'
import { useSchoolRecords } from '../../../hooks/useSchoolRecords'
import { useLanguage } from '../../../hooks/useLanguage'
import { computeRegisteredRows } from '../../../data/schoolRecords.derive'

export default function RegisteredSchoolsSection() {
  const { schools, isLoading, error, refetch } = useSchoolRecords()
  const { t } = useLanguage()
  const rows = useMemo(() => computeRegisteredRows(schools), [schools])

  const columns = [
    {
      key: 'school',
      label: t('home.registered.columns.school'),
      sortable: true,
      wrap: true,
      render: (row) => <span className="font-medium text-slate-900">{row.school}</span>,
    },
    { key: 'udise', label: t('home.registered.columns.udise') },
    { key: 'district', label: t('home.registered.columns.district'), sortable: true },
    {
      key: 'teacherFb',
      label: t('home.registered.columns.teacherFb'),
      render: (row) => <StatusBadge status={row.teacherFb} />,
    },
    {
      key: 'studentFb',
      label: t('home.registered.columns.studentFb'),
      render: (row) => <StatusBadge status={row.studentFb} />,
    },
    {
      key: 'overallStatus',
      label: t('home.registered.columns.overallStatus'),
      sortable: true,
      render: (row) => <StatusBadge status={row.overallStatus} />,
    },
    { key: 'lastActivity', label: t('home.registered.columns.lastActivity') },
  ]

  return (
    <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{t('home.registered.title')}</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{t('home.registered.description')}</p>
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
            columns={columns}
            data={rows}
            searchKeys={['school', 'district', 'udise']}
            searchPlaceholder={t('home.registered.searchPlaceholder')}
            emptyMessage={rows.length === 0 ? t('home.registered.emptyAll') : t('home.registered.emptySearch')}
            fluid
          />
        </div>
      )}
    </section>
  )
}
