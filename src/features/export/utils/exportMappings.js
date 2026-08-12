// Centralized numeric code mappings for exported reports (CSV/Excel).
//
// The UI everywhere else keeps showing human-readable labels (AWS, Robotics,
// Amazon Music Career Tour, Hindi, Yes, No, Maybe) — these mappings exist
// ONLY so downloaded/exported reports carry the client's official numeric
// codes instead of text. Every report builder in exportFormats.js should go
// through these helpers rather than re-deriving codes locally, so a future
// tour/language/response change only needs to happen in one place.

import { TOURS } from '../../../data/schoolRecords.schema'

// Career Tour -> numeric export code (client's official mapping):
// AWS = 1, Robotics = 2, Music = 3. Codes are reserved for AI Career Tour /
// Amazon Prime even while those tours are disabled (schoolRecords.schema.js
// `enabled: false`), so turning one on later never shifts anyone else's
// code — they just take whatever codes are left over (4, 5), never 1-3.
export const CAREER_TOUR_EXPORT_CODE = {
  [TOURS.AWS.id]: 1,
  [TOURS.FC.id]: 2,
  [TOURS.AM.id]: 3,
  [TOURS.AI.id]: 4,
  [TOURS.PRIME.id]: 5,
}

/**
 * Numeric export code for a single tourId, or '' if the tourId is unknown
 * (keeps report generation from crashing on stale/bad data).
 *
 * `dynamicCodeMap` is an optional tourId -> code Map for Super-Admin-created
 * tours (built from the live /api/tours catalog — see useTourCatalog()),
 * checked only as a fallback after the fixed AWS/Robotics/Music/AI/Prime
 * mapping above, which never changes.
 */
export function getCareerTourExportCode(tourId, dynamicCodeMap) {
  return CAREER_TOUR_EXPORT_CODE[tourId] ?? dynamicCodeMap?.get(tourId) ?? ''
}

/**
 * Numeric export code(s) for a list of tourIds, comma-joined when more than
 * one tour applies to the same row (e.g. "AWS + Robotics" -> "1,2").
 */
export function getCareerTourExportCodes(tourIds, dynamicCodeMap) {
  return tourIds
    .map((tourId) => getCareerTourExportCode(tourId, dynamicCodeMap))
    .filter((code) => code !== '')
    .join(',')
}

/**
 * Builds the tourId -> code Map that getCareerTourExportCode()'s
 * `dynamicCodeMap` param expects, from the live tour catalog (see
 * useTourCatalog()) — only the codes NOT already in the fixed mapping above
 * matter here, but including all of them is harmless.
 */
export function buildDynamicTourCodeMap(tours) {
  return new Map((tours ?? []).map((tour) => [tour.tourId, tour.code]))
}

// Career Tour language -> numeric export code (client's official mapping).
export const LANGUAGE_EXPORT_CODE = {
  Hindi: 1,
  English: 2,
  Tamil: 3,
  Telugu: 4,
  Kannada: 5,
  Marathi: 6,
  Gujarati: 7,
}

export function getLanguageExportCode(language) {
  return LANGUAGE_EXPORT_CODE[language] ?? ''
}

// Calendar month name -> numeric export code (January = 1 ... December = 12).
// Names must match server/src/utils/academicPeriod.js's MONTH_NAMES exactly,
// since that's what's stamped onto every reach/feedback record.
export const MONTH_EXPORT_CODE = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
}

export function getMonthExportCode(month) {
  return MONTH_EXPORT_CODE[month] ?? ''
}

// Fixed "Financial Year" value required in the Student/Teacher Feedback
// CSV export ONLY — every exported row must show this exact UUID instead of
// the real financial year (e.g. "2026-27") that's actually stored on the
// record. This is an export-column substitution, not a database change:
// the real financialYear ("2026-27"-style) stays untouched in
// StudentFeedback/TeacherFeedback/StudentFeedbackBatch documents, since
// other features (notably the Target Panel's getTargetProgress(), which
// filters TeacherFeedback/StudentFeedbackBatch by the real current
// financial year) depend on that real value to keep working.
export const FIXED_FEEDBACK_FINANCIAL_YEAR = '3ab7f1d4-e2c8-47d9-a1b6-8f0c5d2e9a73'

// NOTE: Institution Type (School = 1, Beyond School = 2) has no mapping
// helper here — the admin's Programme Setup screen (ProgrammeSetupCard.jsx)
// already collects `institutionType` as the raw numeric code directly
// (default '1'), so there's no text label to convert at export time.

// Yes/No/Maybe response -> numeric export code.
export const RESPONSE_EXPORT_CODE = {
  Yes: 1,
  No: 2,
  Maybe: 3,
}

/**
 * Numeric export code for a Yes/No/Maybe response. Also accepts legacy
 * boolean values (true/false) so any older stored records without a
 * "Maybe" option still export correctly.
 */
export function getResponseExportCode(value) {
  if (value === true) return RESPONSE_EXPORT_CODE.Yes
  if (value === false) return RESPONSE_EXPORT_CODE.No
  return RESPONSE_EXPORT_CODE[value] ?? ''
}
