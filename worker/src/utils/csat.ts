// Ported verbatim from server/src/utils/csat.js. See that file's original
// comments for the full rationale — summary: CSAT Average = mean of every
// submitted 1-5 rating, null (never 0/NaN) if there are zero responses.
// Aggregating a higher group must sum scoreSum/responseCount first, never
// average pre-computed averages.
export interface RatingSummary {
  responseCount: number
  scoreSum: number
  average: number | null
}

export function summarizeCsatRatings(ratings: Array<number | null | undefined>): RatingSummary {
  const validRatings = (ratings || []).filter((value): value is number => value !== null && value !== undefined)
  const responseCount = validRatings.length
  const scoreSum = validRatings.reduce((sum, value) => sum + value, 0)
  return {
    responseCount,
    scoreSum,
    average: responseCount === 0 ? null : Number((scoreSum / responseCount).toFixed(2)),
  }
}

export function calculateCsat(ratings: Array<number | null | undefined>): number | null {
  return summarizeCsatRatings(ratings).average
}
