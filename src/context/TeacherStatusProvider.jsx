import { useCallback, useEffect, useMemo, useState } from 'react'
import { TeacherStatusContext } from './teacherStatusContext'
import { fetchTeacherStatus } from '../api/teacherStatus.api'
import { fetchTeacherMeta } from '../api/teacherMeta.api'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { useToast } from '../hooks/useToast'
import { useLanguage } from '../hooks/useLanguage'

const DEFAULT_STATUS = {
  teacherFeedbackCompleted: false,
  reachSubmitted: false,
  studentFeedbackCompleted: false,
}

const DEFAULT_META = { tours: [], grades: [], languages: [] }

// Shared across every Teacher Portal page so the navbar's lock/unlock state
// and each page's own gating logic always read the exact same backend
// status — refetchStatus() is called right after any successful submission.
export function TeacherStatusProvider({ children }) {
  const toast = useToast()
  const { t } = useLanguage()
  const [status, setStatus] = useState(DEFAULT_STATUS)
  const [meta, setMeta] = useState(DEFAULT_META)
  const [isLoading, setIsLoading] = useState(true)

  const refetchStatus = useCallback(async () => {
    try {
      const { data } = await fetchTeacherStatus()
      setStatus(data.data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('teacherDashboard.couldNotRefresh')))
    }
  }, [toast, t])

  useEffect(() => {
    let isMounted = true

    const loadInitial = async () => {
      try {
        const [statusRes, metaRes] = await Promise.all([fetchTeacherStatus(), fetchTeacherMeta()])
        if (!isMounted) return
        setStatus(statusRes.data.data)
        setMeta(metaRes.data.data)
      } catch (error) {
        if (isMounted) toast.error(getApiErrorMessage(error, t('teacherDashboard.couldNotLoad')))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadInitial()
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast])

  const value = useMemo(
    () => ({ status, meta, isLoading, refetchStatus }),
    [status, meta, isLoading, refetchStatus],
  )

  return <TeacherStatusContext.Provider value={value}>{children}</TeacherStatusContext.Provider>
}
