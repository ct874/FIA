// Centralized "unique teacher" counting rule — mirrors
// src/data/schoolRecords.derive.js's countUniqueTeacherResponses() on the
// frontend (two separate runtimes, so the rule is duplicated, not shared,
// but must stay identical). A teacher who submits feedback for N Career
// Tours creates N TeacherFeedback documents (one per tour) but represents
// exactly ONE person's feedback session, so every "Teacher Responses" count
// must be a DISTINCT count of teachers, not a row count.
//
// A teacher is identified by their submitted email (preferred) or, for
// older records saved before the email field existed, their submitted
// name — always scoped to the school, since the same identifier at two
// different schools is two different participations, not one merged count.
//
// Every backend endpoint that reports a Teacher Responses count must call
// this function instead of `.length`-counting TeacherFeedback documents.
export function countUniqueTeacherResponses(teacherDocs) {
  const uniqueKeys = new Set(
    teacherDocs.map((doc) => {
      const schoolKey = String(doc.school ?? doc.udise ?? '')
      const identity = (doc.email || doc.submittedBy || '').trim().toLowerCase()
      return `${schoolKey}::${identity}`
    }),
  )
  return uniqueKeys.size
}
