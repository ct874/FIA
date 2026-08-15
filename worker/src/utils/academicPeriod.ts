// Ported from server/src/utils/academicPeriod.js, with one correction: all
// "current date" derivation is pinned to Asia/Kolkata (IST) explicitly.
// Workers execute in UTC — deriving month/financial-year from a naive
// `new Date()` would mis-file a submission made at, say, 00:30 IST on
// April 1st as March 31st UTC, silently attributing it to the wrong
// financial year. The exported functions still accept an optional `date`
// override (tests / historical backfills), but default to "right now, as
// seen from IST".
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

const IST_TIME_ZONE = 'Asia/Kolkata'

// Returns {year, month(1-12)} as seen in Asia/Kolkata, regardless of the
// runtime's own timezone (Workers run in UTC).
function getIstYearMonth(date: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  return { year, month }
}

export function getCurrentMonthName(date: Date = new Date()): string {
  const { month } = getIstYearMonth(date)
  return MONTH_NAMES[month - 1]
}

// Calendar month name -> 1-12 numeric code, for the AFE export (which
// requires month_name to be numeric). Returns '' for an unrecognized value
// rather than throwing, so a stray/legacy value never crashes an export.
export function getMonthNumber(monthName: string): number | '' {
  const index = MONTH_NAMES.indexOf(monthName as (typeof MONTH_NAMES)[number])
  return index === -1 ? '' : index + 1
}

// Indian financial year: April-March, formatted like "2026-27".
export function getCurrentFinancialYear(date: Date = new Date()): string {
  const { year, month } = getIstYearMonth(date)
  const startYear = month >= 4 ? year : year - 1
  const endYearSuffix = String((startYear + 1) % 100).padStart(2, '0')
  return `${startYear}-${endYearSuffix}`
}
