import teacherAxiosClient from './teacherAxiosClient'

export const fetchTeacherFeedback = () => teacherAxiosClient.get('/teacher/feedback')

export const submitTeacherFeedback = (payload) => teacherAxiosClient.post('/teacher/feedback', payload)
