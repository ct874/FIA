// Single source of truth for a school's overall "Not Started / Pending /
// Completed" status shown across the Super Admin panel. Every page that
// displays a school's status must go through this function (directly, or
// via the admin/teacher payloads that already call it) so they can never
// disagree with each other.
//
// Only grades 6–12 count toward "all required grades" — matches the Teacher
// Portal's own Student Feedback grade range (only these grades are ever
// offered when starting a feedback batch), so batch data never contains
// anything else in normal use; filtering to this list here just keeps the
// rule explicit and correct even if that ever changes.
export const REQUIRED_GRADES = ['6', '7', '8', '9', '10', '11', '12']

export const SCHOOL_STATUS = {
  NOT_STARTED: 'Not Started',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
}

// status: { teacherFeedbackCompleted, studentFeedbackCompleted } — entirely
// from teacherStatus.service.js's getSchoolStatus(), which is the ONE place
// that decides what "done" means for each half (teacher: submitted for
// every enabled tour; student: EVERY required grade 6–12 has a batch AND has
// met its 40% target — see REQUIRED_GRADES above). This function only
// combines those two already-correct flags into the tri-state label; it
// must never re-derive completion from gradeProgress itself, or the two
// "what counts as done" rules could drift apart again.
export function computeSchoolOverallStatus(status) {
  if (!status.teacherFeedbackCompleted) {
    return SCHOOL_STATUS.NOT_STARTED
  }

  // Partial progress on Student Feedback (even 6 of 7 required grades)
  // must stay Pending — Completed requires every one of REQUIRED_GRADES.
  if (!status.studentFeedbackCompleted) {
    return SCHOOL_STATUS.PENDING
  }

  return SCHOOL_STATUS.COMPLETED
}

// A school's "final/last activity date" — the same rule the Super Admin
// dashboard already uses (see src/data/schoolRecords.derive.js's
// computeLastActivity on the frontend) to show "Last Activity" for a
// school: the latest createdAt across every StudentFeedbackBatch,
// StudentFeedback, and TeacherFeedback document belonging to it. Used by
// the AFE CSV (Official) export as completion_date/submission_date — but
// ONLY once the school has actually reached Completed (callers must gate
// on computeSchoolOverallStatus() themselves; this function just finds the
// date, it doesn't know about completion).
export function getSchoolLastActivityDate({ batchDocs = [], studentDocs = [], teacherDocs = [] }) {
  const dates = [...batchDocs, ...studentDocs, ...teacherDocs]
    .map((doc) => doc.createdAt)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))

  if (dates.length === 0) return null
  return new Date(Math.max(...dates.map((date) => date.getTime())))
}
