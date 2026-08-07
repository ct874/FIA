// Centralized ordering rules for Teacher Feedback and Student Feedback
// records across the entire Super Admin Panel (dashboard tables, home page
// school lists, All Submissions, reports, exports). Every place that builds
// a list of feedback-derived rows MUST sort it through this module instead
// of hand-rolling a `.sort()` — one file to change if the required
// hierarchy ever changes, instead of N inconsistent call sites.
//
// Required hierarchy (client spec), most-significant first:
//   1. School
//   2. Grade / Class (Student Feedback only — Teacher Feedback has no grade)
//   3. Student (or Teacher) — every record for the same person stays together
//   4. Career Tour, always: AWS Data Center Tour -> Robotics FC Tour -> AI/Music Career Tour
//
// This is the frontend mirror of server/src/utils/feedbackSort.js — keep the
// two in sync (same tour/grade ranking rules), the same way
// data/schoolRecords.schema.js already mirrors server/src/constants/tours.js.

// Canonical Career Tour rank, independent of display/catalog order. AI
// Career Tour and Amazon Music Career Tour occupy the same rung — the
// spec's "AI Career Tour (or Music)" slot — since only one of the two is
// ever enabled at a time. Unknown/future tour ids fall back to the end.
const TOUR_ORDER_RANK = {
  'CT-L-AWS-01': 1, // AWS Data Center Tour
  'CT-L-FC-01': 2, // Robotics FC Tour
  'CT-L-AI-01': 3, // AI Career Tour
  'CT-L-AM-01': 3, // Amazon Music Career Tour (AI/Music slot)
  'CT-L-PRIME-01': 4,
}
const UNKNOWN_TOUR_RANK = 99

export function getTourRank(tourId) {
  return TOUR_ORDER_RANK[tourId] ?? UNKNOWN_TOUR_RANK
}

// Grades are stored as strings ("1".."12"); a plain string compare would put
// "10" before "2". Records without a grade (Teacher Feedback) sort after
// every graded (Student Feedback) record within the same school.
const NO_GRADE_RANK = Number.MAX_SAFE_INTEGER

export function getGradeRank(grade) {
  if (grade === null || grade === undefined || grade === '') return NO_GRADE_RANK
  const num = Number(grade)
  return Number.isFinite(num) ? num : NO_GRADE_RANK
}

function compareStrings(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), 'en', { sensitivity: 'base', numeric: true })
}

// `key` is a normalized shape describing one record's position in the
// hierarchy — callers build it from whatever fields their record actually
// has (see sortByFeedbackHierarchy below):
//   { schoolName, grade, type, identifier, tourId }
// `type` ('Teacher' | 'Student') is only used as a tiebreak when two records
// share a school and neither has a grade (e.g. a merged activity log) —
// Teacher Feedback rows are kept ahead of Student Feedback rows in that case.
export function compareFeedbackHierarchy(keyA, keyB) {
  const schoolCompare = compareStrings(keyA.schoolName, keyB.schoolName)
  if (schoolCompare !== 0) return schoolCompare

  const gradeCompare = getGradeRank(keyA.grade) - getGradeRank(keyB.grade)
  if (gradeCompare !== 0) return gradeCompare

  if (keyA.type && keyB.type && keyA.type !== keyB.type) {
    return keyA.type === 'Teacher' ? -1 : 1
  }

  const identifierCompare = compareStrings(keyA.identifier, keyB.identifier)
  if (identifierCompare !== 0) return identifierCompare

  return getTourRank(keyA.tourId) - getTourRank(keyB.tourId)
}

/**
 * Sorts `records` per the required School -> Grade -> Student/Teacher ->
 * Career Tour hierarchy. `normalize(record)` must return the
 * `{ schoolName, grade, type, identifier, tourId }` key described above.
 * Stable regardless of engine (explicit index tiebreak), and never mutates
 * the input array.
 */
export function sortByFeedbackHierarchy(records, normalize) {
  return records
    .map((record, index) => ({ record, index, key: normalize(record) }))
    .sort((a, b) => compareFeedbackHierarchy(a.key, b.key) || a.index - b.index)
    .map((entry) => entry.record)
}

// Level 1 alone — for lists of schools with no feedback rows attached.
export function compareSchoolName(a, b) {
  return compareStrings(a, b)
}

export function sortBySchoolName(schools, getSchoolName = (school) => school.schoolName) {
  return [...schools].sort((a, b) => compareSchoolName(getSchoolName(a), getSchoolName(b)))
}
