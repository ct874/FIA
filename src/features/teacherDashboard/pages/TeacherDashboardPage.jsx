import { useEffect, useState } from 'react'
import { useTeacherAuth } from '../../../hooks/useTeacherAuth'
import { fetchTeacherDashboard } from '../../../api/teacherStatus.api'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { useToast } from '../../../hooks/useToast'
import SummaryCard from '../../../components/ui/SummaryCard'
import Skeleton from '../../../components/ui/Skeleton'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function TeacherDashboardPage() {
  const { teacher } = useTeacherAuth()
  const toast = useToast()
  const [overview, setOverview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const { data } = await fetchTeacherDashboard()
        if (isMounted) setOverview(data.data)
      } catch (error) {
        if (isMounted) toast.error(getApiErrorMessage(error, 'Could not load the dashboard.'))
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
      <div className="flex flex-col gap-4 rounded-3xl bg-linear-to-br from-slate-800 to-slate-950 p-6 text-white shadow-xl shadow-slate-900/20 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-300 uppercase">{getTodayLabel()}</p>
          <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
            {getGreeting()}
            {overview?.teacherFormSubmittedBy ? `, ${overview.teacherFormSubmittedBy}` : ''}!
          </h1>
          <p className="mt-1 text-sm text-slate-300">Welcome to your Career Tour dashboard</p>
        </div>

        {teacher && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-[10px] font-semibold tracking-wide text-amber-300 uppercase">School</p>
            <p className="mt-1 text-sm font-semibold text-white">{teacher.schoolName}</p>
            <p className="mt-0.5 text-xs text-slate-300">
              {teacher.udise} &middot; {teacher.district}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">Teacher Dashboard</p>
        {teacher && (
          <>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">{teacher.schoolName}</h2>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 sm:text-sm">
              <span>
                UDISE <span className="font-medium text-slate-700">{teacher.udise}</span>
              </span>
              <span>
                State <span className="font-medium text-slate-700">{teacher.state}</span>
              </span>
              <span>
                District <span className="font-medium text-slate-700">{teacher.district}</span>
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
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard accent label="Total Students" value={overview?.totalStudentsReached ?? 0} />
          <SummaryCard accent label="Total Experiences" value={overview?.totalExperiences ?? 0} />
          <SummaryCard accent label="Responses Received" value={overview?.totalResponses ?? 0} />
          <SummaryCard
            accent
            label="Teacher Form"
            value={overview?.teacherFormSubmittedBy ? `${overview.teacherFormSubmittedBy} ✓` : 'Pending'}
          />
        </div>
      )}
    </div>
  )
}
