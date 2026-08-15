import axiosClient from './axiosClient'

export const fetchDistrictFeedbackTargetsRequest = () => axiosClient.get('/district-feedback-targets')

export const saveDistrictFeedbackTargetRequest = ({ district, targetPercent, password }) =>
  axiosClient.post('/district-feedback-targets', { district, targetPercent, password })
