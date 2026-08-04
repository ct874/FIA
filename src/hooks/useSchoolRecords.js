import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSchoolRecords } from '../services/schoolData.service'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { SCHOOL_DATA_CHANGED_EVENT } from '../utils/constants'
import { useLanguage } from './useLanguage'

// Background polling picks up changes made outside this browser tab (a
// teacher submitting feedback, another admin tab uploading schools) without
// requiring a manual refresh.
const POLL_INTERVAL_MS = 20000

export function useSchoolRecords() {
  const { t } = useLanguage()
  const [schools, setSchools] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  // reportBusy: whether this call should flip isLoading back to false (and
  // surface errors) when it settles. Silent background refreshes (poll /
  // data-changed event) leave isLoading and error untouched so an
  // already-rendered dashboard never flickers back to a spinner or blanks
  // out on a transient background failure.
  const load = useCallback((reportBusy) => {
    return fetchSchoolRecords()
      .then((data) => {
        if (!isMountedRef.current) return
        setSchools(data)
        setError(null)
      })
      .catch((err) => {
        if (!isMountedRef.current || !reportBusy) return
        setError(getApiErrorMessage(err, t('home.couldNotLoad')))
      })
      .finally(() => {
        if (isMountedRef.current && reportBusy) setIsLoading(false)
      })
  }, [t])

  useEffect(() => {
    isMountedRef.current = true
    load(true)

    const handleDataChanged = () => load(false)
    window.addEventListener(SCHOOL_DATA_CHANGED_EVENT, handleDataChanged)
    const intervalId = setInterval(() => load(false), POLL_INTERVAL_MS)

    return () => {
      isMountedRef.current = false
      window.removeEventListener(SCHOOL_DATA_CHANGED_EVENT, handleDataChanged)
      clearInterval(intervalId)
    }
  }, [load])

  const refetch = useCallback(() => {
    setIsLoading(true)
    return load(true)
  }, [load])

  return { schools, isLoading, error, refetch }
}
