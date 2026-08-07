import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTargetProgress } from '../services/targetData.service'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { useLanguage } from './useLanguage'

// Same background-polling shape as useSchoolRecords() — picks up target
// changes made from another admin tab/session without a manual refresh.
const POLL_INTERVAL_MS = 20000

export function useTargetProgress() {
  const { t } = useLanguage()
  const [progress, setProgress] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  const load = useCallback(
    (reportBusy) => {
      return fetchTargetProgress()
        .then((data) => {
          if (!isMountedRef.current) return
          setProgress(data)
          setError(null)
        })
        .catch((err) => {
          if (!isMountedRef.current || !reportBusy) return
          setError(getApiErrorMessage(err, t('targets.couldNotLoad')))
        })
        .finally(() => {
          if (isMountedRef.current && reportBusy) setIsLoading(false)
        })
    },
    [t],
  )

  useEffect(() => {
    isMountedRef.current = true
    load(true)

    const intervalId = setInterval(() => load(false), POLL_INTERVAL_MS)

    return () => {
      isMountedRef.current = false
      clearInterval(intervalId)
    }
  }, [load])

  const refetch = useCallback(() => {
    setIsLoading(true)
    return load(true)
  }, [load])

  return { progress, isLoading, error, refetch }
}
