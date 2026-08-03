import axiosClient from './axiosClient'

export const uploadSchoolListRequest = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return axiosClient.post('/schools/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const fetchSchoolsRequest = () => axiosClient.get('/schools')

export const fetchSchoolsDashboardRequest = () => axiosClient.get('/schools/dashboard')

export const fetchSchoolsSubmissionsRequest = () => axiosClient.get('/schools/submissions')

export const lookupSchoolRequest = (udise) => axiosClient.get(`/schools/lookup/${udise}`)

export const deleteAllSchoolsRequest = () => axiosClient.delete('/schools')

export const deleteAllProgramDataRequest = () => axiosClient.delete('/schools/data')
