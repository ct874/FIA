// Centralized numeric code mappings for exported reports (CSV/Excel).
//
// The UI everywhere else keeps showing human-readable labels (AWS, Robotics,
// Amazon Music Career Tour, Hindi, Yes, No, Maybe) — these mappings exist
// ONLY so downloaded/exported reports carry the client's official numeric
// codes instead of text. Every report builder in exportFormats.js should go
// through these helpers rather than re-deriving codes locally, so a future
// tour/language/response change only needs to happen in one place.

import { TOURS } from '../../../data/schoolRecords.schema'

// Career Tour -> numeric export code (client's official Form 4 mapping).
// Codes are reserved for AI Career Tour / Amazon Prime even while those
// tours are disabled (schoolRecords.schema.js `enabled: false`), so turning
// one on later never shifts anyone else's code.
export const CAREER_TOUR_EXPORT_CODE = {
  [TOURS.AWS.id]: 1,
  [TOURS.FC.id]: 2,
  [TOURS.AI.id]: 3,
  [TOURS.AM.id]: 4,
  [TOURS.PRIME.id]: 5,
}

/**
 * Numeric export code for a single tourId, or '' if the tourId is unknown
 * (keeps report generation from crashing on stale/bad data).
 */
export function getCareerTourExportCode(tourId) {
  return CAREER_TOUR_EXPORT_CODE[tourId] ?? ''
}

/**
 * Numeric export code(s) for a list of tourIds, comma-joined when more than
 * one tour applies to the same row (e.g. "AWS + Robotics" -> "1,2").
 */
export function getCareerTourExportCodes(tourIds) {
  return tourIds
    .map((tourId) => getCareerTourExportCode(tourId))
    .filter((code) => code !== '')
    .join(',')
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
