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

// Destructive — now password-protected the same way resetDatabaseRequest
// already was, so `password` must be re-entered and is sent in the DELETE
// request body (the backend re-verifies it; the frontend confirmation
// modal is not the only thing standing in the way).
export const deleteAllSchoolsRequest = (password) =>
  axiosClient.delete('/schools', { data: { password } }).then(notifyDataChanged)

export const deleteAllProgramDataRequest = (password) =>
  axiosClient.delete('/schools/data', { data: { password } }).then(notifyDataChanged)

export const resetDatabaseRequest = (password) =>
  axiosClient.post('/schools/reset', { password }).then(notifyDataChanged)

// Persists a school's official government District Code / Postal Code —
// password-confirmed, and permanently locked by the backend once a field
// has a saved value (see school.controller.js's updateSchoolExportCodes).
export const updateSchoolExportCodesRequest = (udise, { districtCode, postalCode, password }) =>
  axiosClient
    .patch(`/schools/${encodeURIComponent(udise)}/export-codes`, { districtCode, postalCode, password })
    .then(notifyDataChanged)

// AFE CSV (Official) export — Super Admin > Export Data. `format: 'json'`
// (default) returns { columns, rows } for the preview table / workbook
// sheet; `format: 'csv'` streams the actual downloadable file.
export const fetchAfeOfficialExportRequest = () =>
  axiosClient.get('/schools/export/afe-official', { params: { format: 'json' } })

export const downloadAfeOfficialExportCsvRequest = () =>
  axiosClient.get('/schools/export/afe-official', { responseType: 'blob' })
