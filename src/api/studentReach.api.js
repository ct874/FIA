import teacherAxiosClient from './teacherAxiosClient'

export const fetchStudentReach = () => teacherAxiosClient.get('/teacher/reach')

export const submitStudentReach = (payload) => teacherAxiosClient.post('/teacher/reach', payload)
