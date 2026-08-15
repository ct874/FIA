// Ported verbatim from server/src/services/schoolStatus.service.js — single
// source of truth for a school's overall Not Started/Pending/Completed
// status.
export const REQUIRED_GRADES = ['6', '7', '8', '9', '10', '11', '12']

export const SCHOOL_STATUS = {
  NOT_STARTED: 'Not Started',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
} as const

export type SchoolStatusValue = (typeof SCHOOL_STATUS)[keyof typeof SCHOOL_STATUS]

export interface SchoolCompletionStatus {
  teacherFeedbackCompleted: boolean
  studentFeedbackCompleted: boolean
}

// Must never re-derive completion from gradeProgress itself — that's
// teacherStatus.service.ts's job (getSchoolStatusFromProgress) — this only
// combines the two already-correct flags into the tri-state label.
export function computeSchoolOverallStatus(status: SchoolCompletionStatus): SchoolStatusValue {
  if (!status.teacherFeedbackCompleted) return SCHOOL_STATUS.NOT_STARTED
  if (!status.studentFeedbackCompleted) return SCHOOL_STATUS.PENDING
  return SCHOOL_STATUS.COMPLETED
}

interface HasCreatedAt {
  createdAt?: string | null
}

// The latest createdAt across every batch/student/teacher document
// belonging to a school — used by the AFE export as
// completion_date/submission_date, but ONLY once the school has actually
// reached Completed (callers gate on computeSchoolOverallStatus themselves).
export function getSchoolLastActivityDate(input: {
  batchDocs?: HasCreatedAt[]
  studentDocs?: HasCreatedAt[]
  teacherDocs?: HasCreatedAt[]
}): Date | null {
  const { batchDocs = [], studentDocs = [], teacherDocs = [] } = input
  const dates = [...batchDocs, ...studentDocs, ...teacherDocs]
    .map((doc) => doc.createdAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))

  if (dates.length === 0) return null
  return new Date(Math.max(...dates.map((date) => date.getTime())))
}
