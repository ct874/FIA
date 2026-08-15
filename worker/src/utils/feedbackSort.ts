// Ported verbatim from server/src/utils/feedbackSort.js — centralized
// School -> Grade -> Person -> Tour ordering used by every dashboard/
// export/list. Keep in sync with src/utils/feedbackSort.js on the frontend
// (separate runtime, no shared module boundary, exactly as before).
const TOUR_ORDER_RANK: Record<string, number> = {
  'CT-L-AWS-01': 1,
  'CT-L-FC-01': 2,
  'CT-L-AI-01': 3,
  'CT-L-AM-01': 3,
  'CT-L-PRIME-01': 4,
}
const UNKNOWN_TOUR_RANK = 99

export function getTourRank(tourId: string): number {
  return TOUR_ORDER_RANK[tourId] ?? UNKNOWN_TOUR_RANK
}

const NO_GRADE_RANK = Number.MAX_SAFE_INTEGER

export function getGradeRank(grade: unknown): number {
  if (grade === null || grade === undefined || grade === '') return NO_GRADE_RANK
  const num = Number(grade)
  return Number.isFinite(num) ? num : NO_GRADE_RANK
}

function compareStrings(a: unknown, b: unknown): number {
  return String(a ?? '').localeCompare(String(b ?? ''), 'en', { sensitivity: 'base', numeric: true })
}

export interface FeedbackHierarchyKey {
  schoolName: string
  grade?: unknown
  type?: 'Teacher' | 'Student'
  identifier: string
  tourId: string
}

export function compareFeedbackHierarchy(keyA: FeedbackHierarchyKey, keyB: FeedbackHierarchyKey): number {
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

export function sortByFeedbackHierarchy<T>(records: T[], normalize: (record: T) => FeedbackHierarchyKey): T[] {
  return records
    .map((record, index) => ({ record, index, key: normalize(record) }))
    .sort((a, b) => compareFeedbackHierarchy(a.key, b.key) || a.index - b.index)
    .map((entry) => entry.record)
}

export function compareSchoolName(a: string, b: string): number {
  return compareStrings(a, b)
}

export function sortBySchoolName<T>(schools: T[], getSchoolName: (school: T) => string = (school) => (school as { schoolName: string }).schoolName): T[] {
  return [...schools].sort((a, b) => compareSchoolName(getSchoolName(a), getSchoolName(b)))
}
