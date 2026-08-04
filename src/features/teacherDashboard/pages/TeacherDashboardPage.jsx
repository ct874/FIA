import { useEffect, useState } from 'react'
import { useTeacherAuth } from '../../../hooks/useTeacherAuth'
import { fetchTeacherDashboard } from '../../../api/teacherStatus.api'
import { fetchAllResponses } from '../../../api/teacherResponses.api'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { useToast } from '../../../hooks/useToast'
import { useLanguage } from '../../../hooks/useLanguage'
import SummaryCard from '../../../components/ui/SummaryCard'
import Skeleton from '../../../components/ui/Skeleton'
import DashboardTable from '../../../components/table/DashboardTable'
import TypeBadge from '../../../components/ui/TypeBadge'

function getGreetingKey() {
  const hour = new Date().getHours()
  if (hour < 12) return 'teacherDashboard.greetingMorning'
  if (hour < 17) return 'teacherDashboard.greetingAfternoon'
  return 'teacherDashboard.greetingEvening'
}

function getTodayLabel(language) {
  return new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function TeacherDashboardPage() {
  const { teacher } = useTeacherAuth()
  const toast = useToast()
  const { t, language } = useLanguage()
  const [overview, setOverview] = useState(null)
  const [responses, setResponses] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const RESPONSE_COLUMNS = [
    { key: 'type', label: t('teacherDashboard.columns.type'), render: (row) => <TypeBadge type={row.type} /> },
    { key: 'tour', label: t('teacherDashboard.columns.tour'), sortable: true },
    { key: 'grade', label: t('teacherDashboard.columns.grade'), sortable: true, render: (row) => row.grade || '—' },
    { key: 'month', label: t('teacherDashboard.columns.month'), sortable: true },
    {
      key: 'time',
      label: t('teacherDashboard.columns.time'),
      sortable: true,
      render: (row) => new Date(row.time).toLocaleString(),
    },
  ]

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const [dashboardResult, responsesResult] = await Promise.all([
          fetchTeacherDashboard(),
          fetchAllResponses({ limit: 500 }),
        ])
        if (isMounted) {
          setOverview(dashboardResult.data.data)
          setResponses(responsesResult.data.data)
        }
      } catch (error) {
        if (isMounted) toast.error(getApiErrorMessage(error, t('teacherDashboard.couldNotLoad')))
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

  const topGrade = responses?.summary?.topGrade

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-3xl bg-linear-to-br from-slate-800 to-slate-950 p-6 text-white shadow-xl shadow-slate-900/20 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-300 uppercase">{getTodayLabel(language)}</p>
          <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
            {t(getGreetingKey())}
            {overview?.teacherFormSubmittedBy ? `, ${overview.teacherFormSubmittedBy}` : ''}!
          </h1>
          <p className="mt-1 text-sm text-slate-300">{t('teacherDashboard.welcome')}</p>
        </div>

        {teacher && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-[10px] font-semibold tracking-wide text-amber-300 uppercase">
              {t('teacherDashboard.schoolLabel')}
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{teacher.schoolName}</p>
            <p className="mt-0.5 text-xs text-slate-300">
              {teacher.udise} &middot; {teacher.district}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
          {t('teacherDashboard.dashboardLabel')}
        </p>
        {teacher && (
          <>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">{teacher.schoolName}</h2>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 sm:text-sm">
              <span>
                {t('teacherDashboard.udiseLabel')} <span className="font-medium text-slate-700">{teacher.udise}</span>
              </span>
              <span>
                {t('teacherDashboard.stateLabel')} <span className="font-medium text-slate-700">{teacher.state}</span>
              </span>
              <span>
                {t('teacherDashboard.districtLabel')}{' '}
                <span className="font-medium text-slate-700">{teacher.district}</span>
              </span>
            </p>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard accent label={t('teacherDashboard.totalStudents')} value={overview?.totalStudentsReached ?? 0} />
            <SummaryCard accent label={t('teacherDashboard.totalExperiences')} value={overview?.totalExperiences ?? 0} />
            <SummaryCard accent label={t('teacherDashboard.responsesReceived')} value={overview?.totalResponses ?? 0} />
            <SummaryCard
              accent
              label={t('teacherDashboard.teacherForm')}
              value={overview?.teacherFormSubmittedBy ? `${overview.teacherFormSubmittedBy} ✓` : t('teacherDashboard.pending')}
            />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {t('teacherDashboard.allResponses')}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span>
                  {t('teacherDashboard.studentFeedbackLabel')}{' '}
                  <span className="font-semibold text-slate-800">{responses?.summary?.totalStudentFeedback ?? 0}</span>
                </span>
                <span>
                  {t('teacherDashboard.teacherResponsesLabel')}{' '}
                  <span className="font-semibold text-slate-800">{responses?.summary?.teacherResponses ?? 0}</span>
                </span>
                {topGrade && (
                  <span>{t('teacherDashboard.mostFeedback', { grade: topGrade.grade, count: topGrade.count })}</span>
                )}
              </div>
            </div>

            <DashboardTable
              columns={RESPONSE_COLUMNS}
              data={responses?.rows ?? []}
              searchKeys={['type', 'tour', 'grade', 'month']}
              searchPlaceholder={t('teacherDashboard.searchPlaceholder')}
              emptyMessage={t('teacherDashboard.emptyResponses')}
              pageSize={10}
            />
          </div>
        </>
      )}
    </div>
  )
}
