export default function Footer({ label = 'FIA Admin Panel' }) {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-5 text-center sm:px-6 lg:px-8">
        <p className="text-xs text-slate-500">&copy; 2026 {label}</p>
        <p className="mt-0.5 text-xs text-slate-400">Powered by FIA</p>
      </div>
    </footer>
  )
}
