import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import FiaLogo from '../branding/FiaLogo'
import { useTeacherAuth } from '../../hooks/useTeacherAuth'
import { TEACHER_ROUTES } from '../../utils/constants'

const NAV_LINKS = [
  { label: 'Reach Data', to: TEACHER_ROUTES.REACH_DATA },
  { label: 'Teacher Feedback', to: TEACHER_ROUTES.FEEDBACK },
]

function navLinkClassName({ isActive }) {
  return `rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out lg:px-4 ${
    isActive
      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
  }`
}

function LogoutIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MenuIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LogoutButton({ className = '', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600
        transition-all duration-200 ease-out
        hover:border-red-600 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-600/20
        focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
        ${className}`}
    >
      <LogoutIcon />
      <span>Logout</span>
    </button>
  )
}

export default function TeacherNavbar() {
  const navigate = useNavigate()
  const { teacher, logout } = useTeacherAuth()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen])

  const closeDrawer = () => setIsDrawerOpen(false)

  const handleLogout = () => {
    logout()
    closeDrawer()
    navigate(TEACHER_ROUTES.LOGIN, { replace: true })
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to={TEACHER_ROUTES.DASHBOARD} className="flex items-center gap-3">
            <FiaLogo className="h-9 w-9" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-tight text-slate-900">FIA Teacher Portal</p>
              {teacher && <p className="text-xs text-slate-400">{teacher.schoolName}</p>}
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex lg:gap-2">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClassName}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:block">
            <LogoutButton onClick={handleLogout} />
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center justify-center rounded-xl p-2 text-slate-600 transition-colors duration-200 hover:bg-slate-100 md:hidden"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* Rendered as a sibling of <header>, not a descendant — backdrop-blur on
          the header creates a containing block for fixed children, which would
          otherwise clip these to the header's own height instead of the viewport. */}
      <div
        aria-hidden={!isDrawerOpen}
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isDrawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl shadow-slate-900/10 transition-transform duration-300 ease-out md:hidden ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <span className="text-sm font-semibold text-slate-900">Menu</span>
          <button
            type="button"
            onClick={closeDrawer}
            className="inline-flex items-center justify-center rounded-xl p-2 text-slate-500 transition-colors duration-200 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={closeDrawer} className={navLinkClassName}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <LogoutButton onClick={handleLogout} className="w-full" />
        </div>
      </div>
    </>
  )
}
