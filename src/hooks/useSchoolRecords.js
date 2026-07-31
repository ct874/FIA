import { useEffect, useState } from 'react'
import { fetchSchoolRecords } from '../services/schoolData.service'

export function useSchoolRecords() {
  const [schools, setSchools] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    fetchSchoolRecords().then((data) => {
      if (!isMounted) return
      setSchools(data)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  return { schools, isLoading }
}
