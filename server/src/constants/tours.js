// Career Tour catalog. IDs match the partner CSV `tour_id` column exactly
// (AFE-IN_CT_Form1 export) so records stay traceable back to source.
//
// TOURS / ENABLED_TOURS / TOUR_IDS / TOUR_BY_ID below are now LIVE, in-place
// -refreshed containers backed by the `Tour` collection (see
// services/tours.service.js) instead of a one-time computation — this lets a
// Super-Admin-created tour flow through every existing consumer of these
// exports (studentFeedback.service.js, teacherFeedback.service.js,
// teacherStatus.service.js, etc.) with zero changes to those files, since
// they all import the same array/Map object references, which are mutated
// in place (never reassigned) whenever the tour catalog changes.
//
// They're initialized below with the exact current static content (not
// left empty) so nothing is ever missing before the DB-backed refresh runs
// at server startup — see setToursCatalog()'s doc comment.
//
// `enabled: false` tours (AI/Prime) are dormant placeholders, fully defined
// (id, name, export code reserved in
// src/features/export/utils/exportMappings.js) but hidden from every
// teacher-portal checkbox/select and excluded from ENABLED_TOURS. They are
// NOT part of the dynamic Tour collection and are unaffected by Tour
// Management — flip `enabled` here to true to launch one with no other code
// changes required (same as before this feature existed).
const STATIC_TOURS = [
  { tourId: 'CT-L-AWS-01', tourName: 'AWS Data Center Tour: Uncovering Cloud Computing', enabled: true },
  { tourId: 'CT-L-FC-01', tourName: 'Robotics Fulfillment Center Tour', enabled: true },
  { tourId: 'CT-L-AI-01', tourName: 'AI Career Tour', enabled: false },
  { tourId: 'CT-L-AM-01', tourName: 'Amazon Music Career Tour', enabled: true },
  { tourId: 'CT-L-PRIME-01', tourName: 'Amazon Prime (Streaming) Career Tour', enabled: false },
]

const STATIC_DISABLED_TOURS = STATIC_TOURS.filter((tour) => !tour.enabled)

export const TOURS = []
export const ENABLED_TOURS = []
export const TOUR_IDS = []
export const TOUR_BY_ID = new Map()

// Mutates the four exports above IN PLACE (never reassigns them) so every
// existing `import { ENABLED_TOURS, TOUR_BY_ID, TOUR_IDS } from
// '../constants/tours.js'` across the codebase automatically sees the
// update — no other file needs to change for a new/deleted tour to take
// effect everywhere.
//
// `dbTours` = live rows from the Tour collection (AWS/Robotics/Music, plus
// any Super-Admin-created tour), already sorted by `code`. The dormant
// AI/Prime placeholders are appended after them (disabled, so excluded from
// ENABLED_TOURS/TOUR_IDS) purely so TOUR_BY_ID.get() keeps resolving them
// for any legacy data — exactly the same reachability they had before this
// feature existed.
export function setToursCatalog(dbTours) {
  TOURS.length = 0
  TOURS.push(
    // `code`/`durationMinutes` are carried through (beyond the tourId/
    // tourName/enabled shape every existing consumer already expects) so
    // constants/afeExport.js's dynamic-tour fallback can read a
    // Super-Admin-created tour's numeric code and duration synchronously,
    // without a DB call of its own.
    ...dbTours.map((tour) => ({
      tourId: tour.tourId,
      tourName: tour.tourName,
      enabled: true,
      code: tour.code,
      durationMinutes: tour.durationMinutes,
    })),
    ...STATIC_DISABLED_TOURS,
  )

  ENABLED_TOURS.length = 0
  ENABLED_TOURS.push(...TOURS.filter((tour) => tour.enabled))

  TOUR_IDS.length = 0
  TOUR_IDS.push(...ENABLED_TOURS.map((tour) => tour.tourId))

  TOUR_BY_ID.clear()
  TOURS.forEach((tour) => TOUR_BY_ID.set(tour.tourId, tour))
}

// Populate synchronously at import time with the exact current static
// catalog (AWS/Robotics/Music enabled + AI/Prime disabled) — identical to
// this module's pre-Tour-Management behavior — so nothing is ever empty
// between server boot and the DB-backed refresh completing (see
// tours.service.js's refreshTourCache(), called once after seeding). The
// refresh then overwrites this with the DB's version, which starts out
// equivalent for AWS/Robotics/Music and additionally includes any
// previously-created custom tours.
setToursCatalog(STATIC_TOURS.filter((tour) => tour.enabled))
