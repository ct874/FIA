// Ported verbatim from server/src/utils/itp.js. Separate metric from CSAT —
// never mixed together, same shape/formula (mean of 1-5 scores, null if
// zero responses).
import type { RatingSummary } from './csat'

export function summarizeItpScores(scores: Array<number | null | undefined>): RatingSummary {
  const validScores = (scores || []).filter((value): value is number => value !== null && value !== undefined)
  const responseCount = validScores.length
  const scoreSum = validScores.reduce((sum, value) => sum + value, 0)
  return {
    responseCount,
    scoreSum,
    average: responseCount === 0 ? null : Number((scoreSum / responseCount).toFixed(2)),
  }
}

export function calculateItp(scores: Array<number | null | undefined>): number | null {
  return summarizeItpScores(scores).average
}
