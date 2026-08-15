import axios from 'axios'
import { API_BASE_URL, TEACHER_AUTH_UNAUTHORIZED_EVENT } from '../utils/constants'
import { getStoredTeacherToken, clearStoredTeacherToken } from '../utils/teacherTokenStorage'

// Separate instance (and separate token storage) from api/axiosClient.js —
// the Admin and Teacher Portal are two independent auth domains that must
// never share or overwrite each other's session.
const teacherAxiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

teacherAxiosClient.interceptors.request.use((config) => {
  const token = getStoredTeacherToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

teacherAxiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredTeacherToken()
      window.dispatchEvent(new Event(TEACHER_AUTH_UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)

export default teacherAxiosClient
