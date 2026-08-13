// Ported verbatim from server/src/utils/studentDummyId.js — 4-letter
// uppercase alphabetic prefix (from the last alphabetic word of the school
// name) + 3-digit zero-padded per-school sequence number. The sequence
// itself is claimed atomically via Firestore's `increment` field transform
// (see repositories/schools.repository.ts's claimNextStudentDummySequence),
// not here — this module only formats the final ID string.
function buildSchoolPrefix(schoolName: string): string {
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

export function formatStudentDummyId(schoolName: string, sequenceNumber: number): string {
  const prefix = buildSchoolPrefix(schoolName)
  const paddedSequence = String(sequenceNumber).padStart(3, '0')
  return `${prefix}${paddedSequence}`
}
