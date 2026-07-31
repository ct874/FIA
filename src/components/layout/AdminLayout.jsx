import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function AdminLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        <div key={location.pathname} className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  )
}
