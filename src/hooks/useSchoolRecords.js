import { useCallback, useEffect, useState } from 'react'
import { fetchSchoolRecords } from '../services/schoolData.service'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

export function useSchoolRecords() {
  const [schools, setSchools] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  const refetch = useCallback(() => {
    setIsLoading(true)
    setReloadToken((token) => token + 1)
  }, [])

  useEffect(() => {
    let isMounted = true

    fetchSchoolRecords()
      .then((data) => {
        if (!isMounted) return
        setSchools(data)
        setError(null)
      })
      .catch((err) => {
        if (isMounted) setError(getApiErrorMessage(err, 'Could not load school data.'))
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [reloadToken])

  return { schools, isLoading, error, refetch }
}
