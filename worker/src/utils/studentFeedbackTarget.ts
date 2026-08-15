// Ported verbatim from server/src/utils/studentFeedbackTarget.js — the 40%
// rule. THE hard business rule of this whole app: never trust the
// frontend, always recompute this server-side from live Firestore counts
// before accepting a Student Feedback submission (see
// services/studentFeedback.service.ts).
export const STUDENT_FEEDBACK_TARGET_RATE = 0.4

// Always rounds UP — e.g. 31 students * 40% = 12.4, required = 13.
export function computeRequiredFeedbackCount(totalStudents: number, targetPercent: number = STUDENT_FEEDBACK_TARGET_RATE * 100): number {
  return Math.max(1, Math.ceil(Number(totalStudents) * (Number(targetPercent) / 100)))
}
