import { useLanguage } from '../../hooks/useLanguage'

function CheckIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const STEP_KEYS = ['workflowSteps.teacherFeedback', 'workflowSteps.studentFeedback']

export default function WorkflowStepper({ currentStep, completedSteps = [] }) {
  const { t } = useLanguage()

  return (
    <div className="mb-6 flex items-center gap-1.5 sm:gap-2">
      {STEP_KEYS.map((key, index) => {
        const label = t(key)
        const step = index + 1
        const isCompleted = completedSteps.includes(step)
        const isCurrent = step === currentStep

        return (
          <div key={key} className="flex items-center gap-1.5 sm:gap-2">
            {index > 0 && <span className="h-px w-4 bg-slate-300 sm:w-6" aria-hidden="true" />}
            <div
              className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold transition-colors duration-150 ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isCurrent
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isCompleted ? <CheckIcon /> : step}
            </div>
            {isCurrent && (
              <span className="text-sm font-semibold whitespace-nowrap text-slate-900">{label}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
