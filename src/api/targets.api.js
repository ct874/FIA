import axiosClient from './axiosClient'

export const fetchTargetProgressRequest = () => axiosClient.get('/targets/progress')

export const fetchTargetDistrictOptionsRequest = () => axiosClient.get('/targets/districts')

export const verifySetTargetAccessRequest = (password) => axiosClient.post('/targets/verify-access', { password })

export const saveTargetRequest = (payload) => axiosClient.post('/targets', payload)
