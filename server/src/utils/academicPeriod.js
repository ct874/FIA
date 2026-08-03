const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function getCurrentMonthName(date = new Date()) {
  return MONTH_NAMES[date.getMonth()]
}

// Indian financial year: April–March, formatted like "2026-27".
export function getCurrentFinancialYear(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const startYear = month >= 4 ? year : year - 1
  const endYearSuffix = String((startYear + 1) % 100).padStart(2, '0')
  return `${startYear}-${endYearSuffix}`
}
