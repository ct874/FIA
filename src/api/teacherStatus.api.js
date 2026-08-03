import teacherAxiosClient from './teacherAxiosClient'

export const fetchTeacherStatus = () => teacherAxiosClient.get('/teacher/status')

export const fetchTeacherDashboard = () => teacherAxiosClient.get('/teacher/dashboard')
