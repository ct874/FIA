import axiosClient from './axiosClient'
import { SCHOOL_DATA_CHANGED_EVENT } from '../utils/constants'

// Every mutating call notifies all useSchoolRecords() instances across the
// app to refetch immediately, so dashboard cards/tables never show stale
// data after an upload or delete within the same session.
function notifyDataChanged(response) {
  window.dispatchEvent(new Event(SCHOOL_DATA_CHANGED_EVENT))
  return response
}

export const uploadSchoolListRequest = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return axiosClient
    .post('/schools/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(notifyDataChanged)
}

export const fetchSchoolsRequest = () => axiosClient.get('/schools')

export const fetchSchoolsDashboardRequest = () => axiosClient.get('/schools/dashboard')

export const fetchSchoolsSubmissionsRequest = () => axiosClient.get('/schools/submissions')

export const lookupSchoolRequest = (udise) => axiosClient.get(`/schools/lookup/${udise}`)

export const deleteAllSchoolsRequest = () => axiosClient.delete('/schools').then(notifyDataChanged)

export const deleteAllProgramDataRequest = () => axiosClient.delete('/schools/data').then(notifyDataChanged)

export const resetDatabaseRequest = (password) =>
  axiosClient.post('/schools/reset', { password }).then(notifyDataChanged)
