// Ported verbatim from server/src/utils/teacherResponseCount.js — a
// "Teacher Responses" count must always be the count of DISTINCT teachers
// (by school-scoped email-or-name identity), never a raw document count,
// since one teacher submitting for N tours creates N TeacherFeedback docs.
export interface TeacherFeedbackLike {
  udise?: string
  email?: string
  submittedBy?: string
}

export function countUniqueTeacherResponses(teacherDocs: TeacherFeedbackLike[]): number {
  const uniqueKeys = new Set(
    teacherDocs.map((doc) => {
      const schoolKey = String(doc.udise ?? '')
      const identity = (doc.email || doc.submittedBy || '').trim().toLowerCase()
      return `${schoolKey}::${identity}`
    }),
  )
  return uniqueKeys.size
}
