export default function SummaryCard({ label, value, accent = false }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/5
        transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/10
        ${accent ? 'border-t-4 border-t-amber-400' : ''}`}
    >
      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}
