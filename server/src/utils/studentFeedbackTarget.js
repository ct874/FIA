// Centralized 40% rule for Student Feedback — the project requirement is to
// collect feedback from only 40% of a class's students, not all of them.
// Every place in the application that computes how many Student Feedback
// submissions are required for a grade must go through this function, so
// the rate only ever needs to change in one place.
//
// This is still the DEFAULT rate — a district can now override it (see
// services/districtFeedbackTarget.service.js); `targetPercent` below
// defaults to this exact rate so any caller that doesn't pass one keeps
// getting exactly 40%, unchanged from before that feature existed.
export const STUDENT_FEEDBACK_TARGET_RATE = 0.4

// Always rounds UP — e.g. 31 students * 40% = 12.4, required = 13.
export function computeRequiredFeedbackCount(totalStudents, targetPercent = STUDENT_FEEDBACK_TARGET_RATE * 100) {
  return Math.max(1, Math.ceil(Number(totalStudents) * (Number(targetPercent) / 100)))
}
