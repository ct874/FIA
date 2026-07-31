import { schoolRecordsData } from '../data/schoolRecords.data'
import { computeSchoolDirectory } from '../data/schoolRecords.derive'
import { fetchSchoolsRequest, lookupSchoolRequest } from '../api/schools.api'

const CANONICAL_DIRECTORY = computeSchoolDirectory(schoolRecordsData)

// Backend-registered schools (uploaded via Export Data > School Management)
// are merged with the canonical dummy directory so both Admin tooling and
// the Teacher Portal login see one consistent, always-current list.
export async function getFullSchoolDirectory() {
  try {
    const { data } = await fetchSchoolsRequest()
    const merged = new Map()
    CANONICAL_DIRECTORY.forEach((school) => merged.set(school.udise, school))
    data.data.forEach((school) => merged.set(school.udise, school))
    return Array.from(merged.values())
  } catch {
    return CANONICAL_DIRECTORY
  }
}

// Used by the Teacher Portal login screen — checks the canonical dummy
// directory first (no network needed), then falls back to the public
// backend lookup for schools the Admin has uploaded since.
export async function findSchoolByUdise(udise) {
  const canonicalMatch = CANONICAL_DIRECTORY.find((school) => school.udise === udise)
  if (canonicalMatch) return canonicalMatch

  try {
    const { data } = await lookupSchoolRequest(udise)
    return data.data
  } catch {
    return null
  }
}
