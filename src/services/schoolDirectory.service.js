import { fetchSchoolsRequest } from '../api/schools.api'

// Backend-registered schools (uploaded via Export Data > School Management)
// — the one source of truth for both Admin tooling and the Teacher Portal
// login.
export async function getFullSchoolDirectory() {
  try {
    const { data } = await fetchSchoolsRequest()
    return data.data
  } catch {
    return []
  }
}
