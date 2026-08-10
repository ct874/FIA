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

import { TOUR_BY_ID } from './tours.js'

// Fixed AFE Official tour order: AWS -> Robotics -> Music, always — never
// the catalog/display order in constants/tours.js, and never whatever order
// MongoDB happens to return records in.
export const AFE_TOUR_SEQUENCE = ['CT-L-AWS-01', 'CT-L-FC-01', 'CT-L-AM-01']

// product_name / tour_id (AWS=1, Robotics=2, Music=3), distribution_channel_host_id
// (AFE-IN-<code>-YT-HI-<year>), and session_duration_minutes (the existing
// tour duration configuration already defined in
// src/features/export/utils/programmeSetup.js's DEFAULT_PROGRAMME_SETUP —
// kept in sync here since the AFE Official export is now backend-generated).
export const AFE_TOUR_META = {
  'CT-L-AWS-01': { code: 1, hostId: 'AFE-IN-AWS-YT-HI-2025', durationMinutes: 27 },
  'CT-L-FC-01': { code: 2, hostId: 'AFE-IN-FC-YT-HI-2025', durationMinutes: 48 },
  'CT-L-AM-01': { code: 3, hostId: 'AFE-IN-AM-YT-HI-2026', durationMinutes: 30 },
}

export function getAfeTourMeta(tourId) {
  const meta = AFE_TOUR_META[tourId]
  if (!meta) return null
  return { tourId, tourName: TOUR_BY_ID.get(tourId)?.tourName ?? tourId, ...meta }
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

// unit_type is additive: Student(1) + Teacher(2) = Both(3). Teacher data
// only ever attaches to a school's FIRST class block (its first
// AFE_ROWS_PER_CLASS rows) — see afeExport.service.js — never duplicated
// onto later classes.
export const AFE_UNIT_TYPE_STUDENT = 1
export const AFE_UNIT_TYPE_TEACHER = 2
export const AFE_UNIT_TYPE_BOTH = 3

// Every class contributes exactly one row per tour (AWS, Robotics, Music) —
// also the size of a school's first class block, which is where teacher
// data attaches.
export const AFE_ROWS_PER_CLASS = 3
