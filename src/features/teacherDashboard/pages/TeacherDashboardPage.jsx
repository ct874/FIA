import { Link } from 'react-router-dom'
import { useTeacherAuth } from '../../../hooks/useTeacherAuth'
import { TEACHER_ROUTES } from '../../../utils/constants'

export default function TeacherDashboardPage() {
  const { teacher } = useTeacherAuth()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-10">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome, {teacher.schoolName}</h1>
        <p className="mt-2 text-sm text-slate-500">
          UDISE {teacher.udise} · {teacher.district}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            to={TEACHER_ROUTES.REACH_DATA}
            className="group rounded-2xl border border-slate-200/80 p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">
              Log Student Reach Data
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Record how many students watched each Career Tour video.
            </p>
          </Link>

          <Link
            to={TEACHER_ROUTES.FEEDBACK}
            className="group rounded-2xl border border-slate-200/80 p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">
              Submit Teacher Feedback
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Share your experience running a Career Tour session.
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
