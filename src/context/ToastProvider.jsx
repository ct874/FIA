import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from './toastContext'
import ToastViewport from '../components/ui/ToastViewport'

const AUTO_DISMISS_MS = 5000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(
    (message, variant = 'info') => {
      idRef.current += 1
      const id = idRef.current
      setToasts((prev) => [...prev, { id, message, variant }])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      show,
      dismiss,
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
      warning: (message) => show(message, 'warning'),
      info: (message) => show(message, 'info'),
    }),
    [show, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
