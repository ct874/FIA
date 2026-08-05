// Single source of truth for a school's overall "Not Started / Pending /
// Completed" status shown across the Super Admin panel. Every page that
// displays a school's status must go through this function (directly, or
// via the admin/teacher payloads that already call it) so they can never
// disagree with each other.
//
// Only grades 6–12 count toward "all required grades" — matches the Teacher
// Portal's own Student Reach grade range (ReachDataPage only ever lets a
// teacher submit these grades), so reach data never contains anything else
// in normal use; filtering to this list here just keeps the rule explicit
// and correct even if that ever changes.
export const REQUIRED_GRADES = ['6', '7', '8', '9', '10', '11', '12']

export const SCHOOL_STATUS = {
  NOT_STARTED: 'Not Started',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
}

// status: { teacherFeedbackCompleted } — from teacherStatus.service.js's
// getSchoolStatus(), so the "is teacher feedback done" rule is defined in
// exactly one place.
// gradeProgress: the array from computeGradeFeedbackProgress() — each entry
// already carries { grade, targetMet } for the 40%-rule Student Feedback
// completion check.
export function computeSchoolOverallStatus(status, gradeProgress) {
  if (!status.teacherFeedbackCompleted) {
    return SCHOOL_STATUS.NOT_STARTED
  }

  const gradesWithReach = new Set(gradeProgress.map((grade) => grade.grade))
  const allRequiredGradesPresent = REQUIRED_GRADES.every((grade) => gradesWithReach.has(grade))
  if (!allRequiredGradesPresent) {
    return SCHOOL_STATUS.PENDING
  }

  const requiredGradeProgress = gradeProgress.filter((grade) => REQUIRED_GRADES.includes(grade.grade))
  const studentFeedbackCompleted = requiredGradeProgress.every((grade) => grade.targetMet)
  if (!studentFeedbackCompleted) {
    return SCHOOL_STATUS.PENDING
  }

  return SCHOOL_STATUS.COMPLETED
}
