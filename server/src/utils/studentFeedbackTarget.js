// Centralized 40% rule for Student Feedback — the project requirement is to
// collect feedback from only 40% of a class's students, not all of them.
// Every place in the application that computes how many Student Feedback
// submissions are required for a grade must go through this function, so
// the rate only ever needs to change in one place.
export const STUDENT_FEEDBACK_TARGET_RATE = 0.4

// Always rounds UP — e.g. 31 students * 40% = 12.4, required = 13.
export function computeRequiredFeedbackCount(totalStudents) {
  return Math.max(1, Math.ceil(Number(totalStudents) * STUDENT_FEEDBACK_TARGET_RATE))
}
