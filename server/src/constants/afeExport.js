// Fixed constants for the AFE CSV (Official) export ONLY — kept entirely
// separate from constants/tours.js (the normal portal's tour catalog) and
// exportMappings.js (the normal portal's export codes) on purpose, per the
// client spec: "Implement this as a clean, isolated AFE Official export
// transformation layer so that future changes to normal portal data don't
// accidentally change the official AFE format."
//
// Every value here is spec-locked by the client. Do not derive these from
// constants/tours.js or change them to "stay consistent" with the normal
// portal — the AFE Official format is intentionally allowed to diverge
// (e.g. language=2 here vs Hindi=1 elsewhere; distribution_channel_host_id
// years differ per tour).

import { TOUR_BY_ID, TOUR_IDS } from './tours.js'

// Fixed AFE Official tour order for the original 3 tours: AWS -> Robotics ->
// Music, always — never the catalog/display order in constants/tours.js,
// and never whatever order MongoDB happens to return records in.
// tours.service.js's ensureSeedTours() guarantees exactly this order by
// seeding them with code 1/2/3 (TOUR_IDS is sorted by code — see
// setToursCatalog()), so reading TOUR_IDS live below always starts with
// AWS -> Robotics -> Music. A Super-Admin-created tour has no such
// spec-locked position — it's simply appended after them in ascending
// code order. NOT a plain array export any more — it must be read live at
// call time (never cached at module-load time), since TOUR_IDS is a
// mutable, in-place-refreshed array that can gain/lose a custom tour at any
// point while the server is running.
export function getAfeTourSequence() {
  // TOUR_IDS is already exactly [AWS, Robotics, Music, ...customs in
  // ascending code order] (see constants/tours.js), so this is simply the
  // live enabled-tours list — kept as its own named function (rather than
  // re-exporting TOUR_IDS directly) so this file's own isolation intent
  // stays explicit at every call site.
  return TOUR_IDS
}

// product_name / tour_id (AWS=1, Robotics=2, Music=3), distribution_channel_host_id
// (AFE-IN-<code>-YT-HI-<year>), and session_duration_minutes (the existing
// tour duration configuration already defined in
// src/features/export/utils/programmeSetup.js's DEFAULT_PROGRAMME_SETUP —
// kept in sync here since the AFE Official export is now backend-generated).
// These 3 entries are spec-locked literal values — never derived from
// constants/tours.js, never changed to "stay consistent" with it.
export const AFE_TOUR_META = {
  'CT-L-AWS-01': { code: 1, hostId: 'AFE-IN-AWS-YT-HI-2025', durationMinutes: 27 },
  'CT-L-FC-01': { code: 2, hostId: 'AFE-IN-FC-YT-HI-2025', durationMinutes: 48 },
  'CT-L-AM-01': { code: 3, hostId: 'AFE-IN-AM-YT-HI-2026', durationMinutes: 30 },
}

// A Super-Admin-created tour has no Amazon-defined official host-id format
// (Amazon can't have specified one for a tour that didn't exist yet) — this
// is a documented, deterministic best-effort extension: hostId follows the
// same naming pattern as the 3 spec-locked entries above, durationMinutes is
// the admin-provided value, both read from the live Tour catalog
// (TOUR_BY_ID, carrying `code`/`durationMinutes` — see constants/tours.js).
function buildDynamicAfeTourMeta(tourId) {
  const tour = TOUR_BY_ID.get(tourId)
  if (!tour || tour.code == null) return null
  return {
    code: tour.code,
    hostId: `AFE-IN-CUSTOM${tour.code}-YT-HI-${new Date().getFullYear()}`,
    durationMinutes: tour.durationMinutes,
  }
}

export function getAfeTourMeta(tourId) {
  const meta = AFE_TOUR_META[tourId] ?? buildDynamicAfeTourMeta(tourId)
  if (!meta) return null
  return { tourId, tourName: TOUR_BY_ID.get(tourId)?.tourName ?? tourId, ...meta }
}

// The live, ordered list of tour codes this export currently produces rows
// for — e.g. [1, 2, 3] with no custom tours, [1, 2, 3, 4] with one. Read
// live at call time, same reasoning as getAfeTourSequence().
export function getAfeTourCodeSequence() {
  return getAfeTourSequence()
    .map((tourId) => getAfeTourMeta(tourId)?.code)
    .filter((code) => code != null)
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

// response_rate_percentage is a client-mandated fixed value for every row of
// this export — never derived from actual student response counts (see
// afeExport.service.js). Do not replace with a calculated response rate.
export const AFE_RESPONSE_RATE_PERCENTAGE = 40

// unit_type is additive: Student(1) + Teacher(2) = Both(3). Teacher data
// only ever attaches to a school's FIRST class block (its first
// getAfeRowsPerClass() rows) — see afeExport.service.js — never duplicated
// onto later classes.
export const AFE_UNIT_TYPE_STUDENT = 1
export const AFE_UNIT_TYPE_TEACHER = 2
export const AFE_UNIT_TYPE_BOTH = 3

// Every class contributes exactly one row per currently-enabled tour (AWS,
// Robotics, Music, and any Super-Admin-created tour) — also the size of a
// school's first class block, which is where teacher data attaches. Read
// live at call time (see getAfeTourSequence()), never cached — a tour
// created/deleted while the server is running changes this immediately.
export function getAfeRowsPerClass() {
  return getAfeTourSequence().length
}
