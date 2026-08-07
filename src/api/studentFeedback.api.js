import teacherAxiosClient from './teacherAxiosClient'

export const fetchStudentFeedbackSummary = () =>
  teacherAxiosClient.get('/teacher/student-feedback/summary')

export const startStudentFeedbackBatch = (payload) =>
  teacherAxiosClient.post('/teacher/student-feedback/batches', payload)

export const submitStudentFeedback = (payload) =>
  teacherAxiosClient.post('/teacher/student-feedback', payload)
