import teacherAxiosClient from './teacherAxiosClient'

export const teacherLoginRequest = ({ udise, password, rememberMe }) =>
  teacherAxiosClient.post('/teacher-auth/login', { udise, password, rememberMe })

export const teacherLogoutRequest = () => teacherAxiosClient.post('/teacher-auth/logout')

export const fetchCurrentSchool = () => teacherAxiosClient.get('/teacher-auth/me')
