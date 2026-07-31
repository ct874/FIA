const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function addMonths(year, month, delta) {
  let m = month + delta
  let y = year
  while (m < 0) {
    m += 12
    y -= 1
  }
  while (m > 11) {
    m -= 12
    y += 1
  }
  return { year: y, month: m }
}

function buildCycle(endYear, endMonth) {
  const end = new Date(endYear, endMonth, 4, 23, 59, 59, 999)
  const startRef = addMonths(endYear, endMonth, -1)
  const start = new Date(startRef.year, startRef.month, 5)
  return {
    start,
    end,
    label: `${MONTH_ABBR[start.getMonth()]} 5 – ${MONTH_ABBR[end.getMonth()]} 4`,
  }
}

/**
 * Billing-cycle presets running the 5th of one month to the 4th of the next,
 * most recently closed cycle first (matches the reference export tool).
 */
export function getMonthlyCyclePresets(count = 6, today = new Date()) {
  let candidateYear = today.getFullYear()
  let candidateMonth = today.getMonth()

  while (new Date(candidateYear, candidateMonth, 4, 23, 59, 59, 999) > today) {
    const prev = addMonths(candidateYear, candidateMonth, -1)
    candidateYear = prev.year
    candidateMonth = prev.month
  }

  const presets = []
  for (let i = 0; i < count; i += 1) {
    const ref = addMonths(candidateYear, candidateMonth, -i)
    presets.push(buildCycle(ref.year, ref.month))
  }
  return presets
}

export function formatDateForInput(date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateFromInput(value) {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
