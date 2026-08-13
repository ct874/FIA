import { Outlet, useLocation } from 'react-router-dom'
import TeacherNavbar from './TeacherNavbar'
import Footer from './Footer'
import { TeacherStatusProvider } from '../../context/TeacherStatusProvider'
import { useLanguage } from '../../hooks/useLanguage'

export default function TeacherLayout() {
  const location = useLocation()
  const { t } = useLanguage()

  return (
    <TeacherStatusProvider>
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50/70 via-white to-white">
        <TeacherNavbar />

        <main className="flex-1">
          <div key={location.pathname} className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>

        <Footer label={t('nav.teacherPortalTitle')} />
      </div>
    </TeacherStatusProvider>
  )
}
