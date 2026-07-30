import axiosClient from './axiosClient'

export const loginRequest = ({ loginId, password, rememberMe }) =>
  axiosClient.post('/auth/login', { loginId, password, rememberMe })

export const logoutRequest = () => axiosClient.post('/auth/logout')

export const fetchCurrentAdmin = () => axiosClient.get('/auth/me')
