// Adapted from server/src/constants/afeExport.js. Deliberately isolated
// from the normal portal's tour catalog/export mappings, per the client
// spec: government-format changes must never leak into (or be leaked into
// by) the regular app. Every value here is spec-locked by the client — do
// not derive these "to stay consistent" with the normal portal.
//
// Structural change from the original (same reasoning as constants/tours.ts):
// functions here take the live `TourCatalog` as a parameter instead of
// reading a module-level mutable cache, since Workers isolates can't rely
// on that pattern.
import type { TourCatalog } from './tours'

// Fixed AFE Official tour order for the original 3 tours: AWS -> Robotics ->
// Music, always — never catalog/display order, never Firestore's return
// order. A Super-Admin-created tour has no spec-locked position — it's
// simply appended after them in ascending code order (guaranteed by the
// tours repository sorting by `code`).
export function getAfeTourSequence(catalog: TourCatalog): string[] {
  return catalog.tourIds
}

export interface AfeTourMeta {
  tourId: string
  tourName: string
  code: number
  hostId: string
  durationMinutes: number
}

// product_name / tour_id (AWS=1, Robotics=2, Music=3), distribution_channel_host_id
// (AFE-IN-<code>-YT-HI-<year>), and session_duration_minutes — spec-locked
// literal values, never derived from the live tour catalog for these 3.
const AFE_TOUR_META: Record<string, { code: number; hostId: string; durationMinutes: number }> = {
  'CT-L-AWS-01': { code: 1, hostId: 'AFE-IN-AWS-YT-HI-2025', durationMinutes: 27 },
  'CT-L-FC-01': { code: 2, hostId: 'AFE-IN-FC-YT-HI-2025', durationMinutes: 48 },
  'CT-L-AM-01': { code: 3, hostId: 'AFE-IN-AM-YT-HI-2026', durationMinutes: 30 },
}

// A Super-Admin-created tour has no Amazon-defined official host-id format
// — documented, deterministic best-effort extension: hostId follows the
// same naming pattern, durationMinutes is the admin-provided value, both
// read from the live tour catalog.
function buildDynamicAfeTourMeta(catalog: TourCatalog, tourId: string): { code: number; hostId: string; durationMinutes: number } | null {
  const tour = catalog.tourById.get(tourId)
  if (!tour || tour.code == null) return null
  return {
    code: tour.code,
    hostId: `AFE-IN-CUSTOM${tour.code}-YT-HI-${new Date().getFullYear()}`,
    durationMinutes: tour.durationMinutes ?? 0,
  }
}

export function getAfeTourMeta(catalog: TourCatalog, tourId: string): AfeTourMeta | null {
  const meta = AFE_TOUR_META[tourId] ?? buildDynamicAfeTourMeta(catalog, tourId)
  if (!meta) return null
  return { tourId, tourName: catalog.tourById.get(tourId)?.tourName ?? tourId, ...meta }
}

// The live, ordered list of tour codes this export currently produces rows
// for — e.g. [1, 2, 3] with no custom tours, [1, 2, 3, 4] with one.
export function getAfeTourCodeSequence(catalog: TourCatalog): number[] {
  return getAfeTourSequence(catalog)
    .map((tourId) => getAfeTourMeta(catalog, tourId)?.code)
    .filter((code): code is number => code != null)
}

// Every class contributes exactly one row per currently-enabled tour.
export function getAfeRowsPerClass(catalog: TourCatalog): number {
  return getAfeTourSequence(catalog).length
}

// Spec-fixed literal values shared by every row of the export.
export const AFE_DEVICE_ID = 'fia'
export const AFE_COUNTRY_CODE = 'IN'
export const AFE_STATE = 'Rajasthan'
export const AFE_COMPLETION_RATE = 100
export const AFE_VIDEO_COMPLETION_RATE = 100
export const AFE_UNDERSERVED_REACH = 1
export const AFE_DISTRIBUTION_CHANNEL_HOST = 1
export const AFE_SCHOOL_YEAR = 1
export const AFE_DATA_COLLECTION_METHOD = 1
export const AFE_PARTNER_NAME = 1
export const AFE_SCHOOL_TYPE = 1
export const AFE_LANGUAGE = 2
export const AFE_ACADEMIC_YEAR_ID = '3ab7f1d4-e2c8-47d9-a1b6-8f0c5d2e9a73'

// Client-mandated fixed value for every row — never derived from actual
// student response counts.
export const AFE_RESPONSE_RATE_PERCENTAGE = 40

// unit_type is additive: Student(1) + Teacher(2) = Both(3).
export const AFE_UNIT_TYPE_STUDENT = 1
export const AFE_UNIT_TYPE_TEACHER = 2
export const AFE_UNIT_TYPE_BOTH = 3
