// Centralized Student Dummy ID format — the single place this rule is
// defined, so every caller (currently just studentFeedback.service.js) stays
// consistent by construction instead of duplicating the format logic.
//
// Format: <first 4 uppercase ALPHABETIC letters of the last alphabetic word
// of the School Name><3-digit school-scoped running number>
//   "Government Senior Secondary School Churu" -> last alphabetic word
//     "Churu" -> "CHUR" + "001" -> "CHUR001"
//   "Govt. Sen. Sec. School, Sahwa (01223)" -> last WORD is "(01223)", which
//     has no letters at all, so it's skipped in favor of the previous word,
//     "Sahwa" -> "SAHW" + "001" -> "SAHW001" (never "0122...")
// The running number is claimed atomically per school (see
// claimNextStudentDummySequence in studentFeedback.service.js) so it never
// resets across grades and never collides across concurrent submissions.

// Walks the school name's words from the end and returns the first one
// (i.e. the last, most-meaningful word) that contains any alphabetic
// character, with every non-alphabetic character (digits, punctuation,
// parentheses, commas, symbols) stripped out of it. A trailing "(01223)" or
// similar numeric/punctuation-only token is skipped entirely rather than
// contributing digits to the prefix. A prefix shorter than 4 letters (or no
// alphabetic word found at all) is padded with 'X' so the prefix is always
// exactly 4 characters — the format spec doesn't cover this edge case, but a
// fixed-width prefix keeps every generated ID visually consistent instead of
// varying in length.
function buildSchoolPrefix(schoolName) {
  const words = String(schoolName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  for (let i = words.length - 1; i >= 0; i -= 1) {
    const alphaOnly = words[i].replace(/[^a-zA-Z]/g, '')
    if (alphaOnly.length > 0) {
      return alphaOnly.toUpperCase().slice(0, 4).padEnd(4, 'X')
    }
  }

  return 'XXXX'
}

export function formatStudentDummyId(schoolName, sequenceNumber) {
  const prefix = buildSchoolPrefix(schoolName)
  const paddedSequence = String(sequenceNumber).padStart(3, '0')
  return `${prefix}${paddedSequence}`
}
