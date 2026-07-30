import FiaLogo from '../../../components/branding/FiaLogo'
import LoginForm from '../components/LoginForm'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-slate-200/50 blur-3xl"
      />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-900/5 backdrop-blur-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <FiaLogo />
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
              Super Admin Portal
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
              Sign in with your administrator credentials to manage the FIA platform.
            </p>
          </div>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Foundation for Innovation &amp; Action &middot; Authorized personnel only
        </p>
      </div>
    </div>
  )
}
