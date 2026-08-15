// Thin client for the backend-generated AFE CSV (Official) export — all the
// actual business logic (school/class/student/tour ordering, completion
// dates, session IDs, validation) lives server-side in
// server/src/services/afeExport.service.js. This file only fetches/
// downloads and never re-derives any of it, per the client spec's
// backend-first requirement.
import { fetchAfeOfficialExportRequest, downloadAfeOfficialExportCsvRequest } from '../../../api/schools.api'

// { columns: string[], rows: object[] } — used by the export preview's "AFE
// (Official)" tab and by the "Download Export Workbook" AFE sheet, so both
// always show/ship exactly what the standalone download would produce.
export async function fetchAfeOfficialPreview() {
  const { data } = await fetchAfeOfficialExportRequest()
  return data.data
}

function extractFilename(contentDisposition, fallback) {
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition || '')
  return match ? match[1] : fallback
}

// axios delivers an error body as a Blob (not parsed JSON) whenever the
// request used `responseType: 'blob'` — including the backend's own
// validation-failure message (see school.controller.js's
// exportAfeOfficialCsv). Reads that Blob back into the same
// `error.response.data` shape getApiErrorMessage() already knows how to
// read, so a real validation error shows up instead of a generic fallback.
export async function normalizeBlobError(error) {
  const data = error?.response?.data
  if (!(data instanceof Blob)) return error
  try {
    const text = await data.text()
    error.response.data = JSON.parse(text)
  } catch {
    // Not JSON (e.g. a network-level HTML error page) — leave as-is, the
    // generic fallback message still applies.
  }
  return error
}

// Streams the validated CSV from the backend and saves it as a file — the
// browser never builds or validates the export itself.
export async function downloadAfeOfficialCsv() {
  let response
  try {
    response = await downloadAfeOfficialExportCsvRequest()
  } catch (error) {
    throw await normalizeBlobError(error)
  }
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = extractFilename(response.headers?.['content-disposition'], 'fia-afe-official.csv')
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
