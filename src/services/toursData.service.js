import { fetchToursRequest, createTourRequest, deleteTourRequest } from '../api/tours.api'

// In-flight de-duplication — same rationale as fetchSchoolRecords() in
// schoolData.service.js: useTourCatalog() is called independently from
// several sibling components mounted on the same page (ExportPreviewCard,
// ManageToursSection, DashboardOverview), each firing its own
// GET /api/tours without this. Sharing one in-flight promise collapses
// simultaneous callers into a single real HTTP request.
let inFlightTours = null

export function fetchTours() {
  if (!inFlightTours) {
    inFlightTours = fetchToursRequest()
      .then(({ data }) => data.data)
      .finally(() => {
        inFlightTours = null
      })
  }
  return inFlightTours
}

export async function createTour(payload) {
  const { data } = await createTourRequest(payload)
  return data.data
}

export async function deleteTour(tourId, password) {
  const { data } = await deleteTourRequest(tourId, password)
  return data.data
}
