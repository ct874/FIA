export const GRADES = Array.from({ length: 12 }, (_, index) => String(index + 1))

// Order matches the client's official option-code mapping (Hindi=1 ... Gujarati=7),
// used by src/features/export/utils/exportMappings.js to derive export codes.
export const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Gujarati']
