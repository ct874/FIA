import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTours } from '../services/toursData.service'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { useLanguage } from './useLanguage'

// Same background-polling shape as useSchoolRecords()/useTargetProgress() —
// picks up a tour created/deleted from another admin tab/session without a
// manual refresh. Every consumer that needs the live tour catalog (Manage
// Tours list, the normal CSV/Excel export's numeric code lookup, the
// dashboard's CSAT/ITP/NPS-by-Tour breakdown) uses this same hook rather
// than each re-fetching independently.
const POLL_INTERVAL_MS = 20000

export function useTourCatalog() {
  const { t } = useLanguage()
  const [tours, setTours] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  const load = useCallback(
    (reportBusy) => {
      return fetchTours()
        .then((data) => {
          if (!isMountedRef.current) return
          setTours(data)
          setError(null)
        })
        .catch((err) => {
          if (!isMountedRef.current || !reportBusy) return
          setError(getApiErrorMessage(err, t('export.tourManagement.couldNotLoad')))
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

  return { tours, isLoading, error, refetch }
}
