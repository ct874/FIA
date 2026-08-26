import { fetchSchoolsDashboardRequest } from '../api/schools.api'

// In-flight de-duplication: useSchoolRecords() is called independently by
// several sibling components on the same dashboard page (DashboardOverview,
// RegisteredSchoolsSection, CompletedSchoolsSection, ...), each with its own
// local state — without this, every one of them fires its own
// GET /api/schools/dashboard on mount (and again on every poll tick),
// hammering the same endpoint with N identical concurrent requests for a
// single page load. Sharing one in-flight promise collapses that to exactly
// one real HTTP request; the next call after it settles starts a fresh one,
// so background polling still picks up real changes.
let inFlightSchoolRecords = null

export function fetchSchoolRecords() {
  if (!inFlightSchoolRecords) {
    inFlightSchoolRecords = fetchSchoolsDashboardRequest()
      .then(({ data }) => data.data.schools)
      .finally(() => {
        inFlightSchoolRecords = null
      })
  }
  return inFlightSchoolRecords
}

export async function fetchSchoolByUdise(udise) {
  const schools = await fetchSchoolRecords()
  return schools.find((school) => school.udise === udise) ?? null
}
