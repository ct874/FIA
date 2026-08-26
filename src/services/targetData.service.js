import {
  fetchTargetProgressRequest,
  fetchTargetDistrictOptionsRequest,
  verifySetTargetAccessRequest,
  saveTargetRequest,
} from '../api/targets.api'

// In-flight de-duplication — same rationale as fetchSchoolRecords() in
// schoolData.service.js: useTargetProgress() is used from more than one
// place (Target Management page, the Export page's district section);
// sharing one in-flight promise collapses simultaneous callers into a
// single real HTTP request instead of one per caller.
let inFlightTargetProgress = null

export function fetchTargetProgress() {
  if (!inFlightTargetProgress) {
    inFlightTargetProgress = fetchTargetProgressRequest()
      .then(({ data }) => data.data)
      .finally(() => {
        inFlightTargetProgress = null
      })
  }
  return inFlightTargetProgress
}

export async function fetchTargetDistrictOptions() {
  const { data } = await fetchTargetDistrictOptionsRequest()
  return data.data
}

export async function verifySetTargetAccess(password) {
  const { data } = await verifySetTargetAccessRequest(password)
  return data.data
}

export async function saveTarget(payload) {
  const { data } = await saveTargetRequest(payload)
  return data.data
}
