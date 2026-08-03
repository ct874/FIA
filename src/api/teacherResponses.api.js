import teacherAxiosClient from './teacherAxiosClient'

export const fetchAllResponses = (params = {}) =>
  teacherAxiosClient.get('/teacher/responses', { params })
