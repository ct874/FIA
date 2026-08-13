// Ported verbatim from server/src/constants/grades.js.
export const GRADES: string[] = Array.from({ length: 12 }, (_, index) => String(index + 1))

// Career Tour viewing-language options on the Teacher Feedback form. The
// EXPORTED "language" value is always numeric code 2 regardless of which of
// these is picked (see constants/afeExport.ts / AFE_LANGUAGE) — this list
// only governs what's selectable in the UI.
export const LANGUAGES: string[] = ['Hindi', 'English']
