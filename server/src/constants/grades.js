export const GRADES = Array.from({ length: 12 }, (_, index) => String(index + 1))

// Career Tour viewing-language options offered on the Teacher Feedback
// form (TourFeedbackFields.jsx, via GET /teacher/meta) — restricted to
// exactly these two per the client spec. Note the EXPORTED "In which
// language did you watch the Career Tour?" value is always 1 regardless of
// which of these is picked (see exportFormats.js) — this list only governs
// what's selectable in the UI.
export const LANGUAGES = ['Hindi', 'English']
