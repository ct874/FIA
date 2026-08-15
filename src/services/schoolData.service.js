import { fetchSchoolsDashboardRequest } from '../api/schools.api'

export async function fetchSchoolRecords() {
  const { data } = await fetchSchoolsDashboardRequest()
  return data.data.schools
}

export async function fetchSchoolByUdise(udise) {
  const schools = await fetchSchoolRecords()
  return schools.find((school) => school.udise === udise) ?? null
}
