import { schoolRecordsData } from '../data/schoolRecords.data'

// TODO: replace with a real API call (e.g. axiosClient.get('/schools')) once
// the backend endpoint exists. Callers already treat this as async so the
// swap requires no changes downstream.
export async function fetchSchoolRecords() {
  return schoolRecordsData
}

export async function fetchSchoolByUdise(udise) {
  return schoolRecordsData.find((school) => school.udise === udise) ?? null
}
