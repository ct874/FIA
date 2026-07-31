import { Outlet, useLocation } from 'react-router-dom'
import TeacherNavbar from './TeacherNavbar'
import Footer from './Footer'

export default function TeacherLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <TeacherNavbar />

      <main className="flex-1">
        <div key={location.pathname} className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>

      <Footer label="FIA Teacher Portal" />
    </div>
  )
}
