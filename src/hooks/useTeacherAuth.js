import { useContext } from 'react'
import { TeacherAuthContext } from '../context/teacherAuthContext'

export function useTeacherAuth() {
  const context = useContext(TeacherAuthContext)
  if (!context) {
    throw new Error('useTeacherAuth must be used within a TeacherAuthProvider')
  }
  return context
}
