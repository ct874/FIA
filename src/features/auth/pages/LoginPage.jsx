import FiaLogo from '../../../components/branding/FiaLogo'
import LoginForm from '../components/LoginForm'
import { useLanguage } from '../../../hooks/useLanguage'

export default function LoginPage() {
  const { t } = useLanguage()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-white px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(23,114,133,0.08),_transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand-100/60 blur-3xl"
      />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-900/5 backdrop-blur-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <FiaLogo />
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
              {t('auth.title')}
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">{t('auth.subtitle')}</p>
          </div>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">{t('auth.footerNote')}</p>
      </div>
    </div>
  )
}
