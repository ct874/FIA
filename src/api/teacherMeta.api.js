import teacherAxiosClient from './teacherAxiosClient'

export const fetchTeacherMeta = () => teacherAxiosClient.get('/teacher/meta')
