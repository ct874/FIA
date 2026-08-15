// Shared "N of M answered" progress bar for feedback forms — used by both
// Student Feedback (BatchFeedbackWorkspace) and Teacher Feedback
// (TeacherFeedbackPage) so the two forms' completion UI never drifts apart.
export default function FeedbackProgressBar({ label, percent }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
