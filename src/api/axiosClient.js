import axios from 'axios'
import { API_BASE_URL, AUTH_UNAUTHORIZED_EVENT } from '../utils/constants'
import { getStoredToken, clearStoredToken, touchActivity } from '../utils/tokenStorage'

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => {
    // A successful authenticated call counts as activity for the 30-hour
    // inactivity timer — already throttled internally, so this is safe
    // even under heavy API usage (dashboard polling, etc.).
    touchActivity()
    return response
  },
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredToken()
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)

export default axiosClient
