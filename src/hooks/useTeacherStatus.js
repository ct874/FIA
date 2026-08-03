import { useContext } from 'react'
import { TeacherStatusContext } from '../context/teacherStatusContext'

export function useTeacherStatus() {
  const context = useContext(TeacherStatusContext)
  if (!context) {
    throw new Error('useTeacherStatus must be used within a TeacherStatusProvider')
  }
  return context
}
