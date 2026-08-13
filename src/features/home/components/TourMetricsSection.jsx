export default function TourMetricsSection({ title, children }) {
  return (
    <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
        {title}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  )
}
