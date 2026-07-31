import { useEffect, useRef, useState } from 'react'
import Modal from '../../../components/ui/Modal'

const PHASES = ['Reading Excel...', 'Validating...', 'Checking Existing Schools...', 'Saving Schools...']
const PHASE_INTERVAL_MS = 650

function CheckIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function UploadProgressModal({ isOpen, isComplete }) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    intervalRef.current = setInterval(() => {
      setPhaseIndex((prev) => Math.min(prev + 1, PHASES.length - 1))
    }, PHASE_INTERVAL_MS)

    return () => clearInterval(intervalRef.current)
  }, [isOpen])

  useEffect(() => {
    if (isComplete && intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [isComplete])

  const currentLabel = isComplete ? 'Completed' : PHASES[phaseIndex]
  const progressPercent = isComplete ? 100 : Math.round(((phaseIndex + 1) / PHASES.length) * 90)

  return (
    <Modal isOpen={isOpen} onClose={() => {}} closeOnBackdrop={false} showCloseButton={false} size="sm">
      <div className="p-8 text-center">
        {isComplete ? (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckIcon />
          </div>
        ) : (
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600" />
        )}

        <h3 className="mt-4 text-lg font-semibold text-slate-900">Uploading Schools...</h3>

        <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isComplete ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="mt-4 text-sm font-medium text-slate-600">{currentLabel}</p>
      </div>
    </Modal>
  )
}
