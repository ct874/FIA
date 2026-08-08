export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function getCurrentMonthName(date = new Date()) {
  return MONTH_NAMES[date.getMonth()]
}

// Calendar month name (as stamped on feedback/batch documents by
// getCurrentMonthName above) -> 1-12 numeric code. Used by the AFE CSV
// (Official) export, which requires month_name to be numeric, never a name.
// Returns '' for an unrecognized/missing month rather than throwing, so a
// stray/legacy value never crashes export generation.
export function getMonthNumber(monthName) {
  const index = MONTH_NAMES.indexOf(monthName)
  return index === -1 ? '' : index + 1
}

// Indian financial year: April–March, formatted like "2026-27".
export function getCurrentFinancialYear(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const startYear = month >= 4 ? year : year - 1
  const endYearSuffix = String((startYear + 1) % 100).padStart(2, '0')
  return `${startYear}-${endYearSuffix}`
}
