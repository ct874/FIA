// Single source of truth for the official platform-wide NPS (Net Promoter
// Score) formula — collected from teachers/facilitators via "How likely are
// you to recommend this tour to other teachers/schools?" (0-10 scale).
// EVERY place on the frontend that aggregates teacher NPS responses must go
// through this file instead of re-deriving its own formula, so no two views
// can ever disagree.
//
// NPS is NEVER a simple average of ratings. It's always:
//
//   Promoters  = responses rated 9-10
//   Passives   = responses rated 7-8
//   Detractors = responses rated 0-6
//   Total      = Promoters + Passives + Detractors (Passives count toward
//                the denominator even though they don't add/subtract)
//
//   % Promoters  = (Promoters / Total) x 100
//   % Detractors = (Detractors / Total) x 100
//   NPS          = % Promoters - % Detractors
//
// e.g. raw scores [10, 9, 8, 7] -> NOT (10+9+8+7)/4 = 8.5 — instead
// Promoters=2, Passives=2, Detractors=0, Total=4 -> 50% - 0% = 50.
//
// Non-responses must never appear in the `scores` array passed in at all,
// must never be counted as a Detractor, and must never be treated as 0.
//
// NPS is collected only at the teacher/classroom level, never per
// individual student — don't use this for any student-level metric.
// NPS is also a completely separate metric from CSAT/ITP (see
// utils/csat.js / utils/itp.js) — never mix their inputs.

function computeNpsFromCounts(promoters, detractors, totalResponses) {
  if (totalResponses === 0) {
    return { promoterPercentage: null, detractorPercentage: null, nps: null }
  }
  const promoterPercentage = Number(((promoters / totalResponses) * 100).toFixed(2))
  const detractorPercentage = Number(((detractors / totalResponses) * 100).toFixed(2))
  const nps = Number((promoterPercentage - detractorPercentage).toFixed(2))
  return { promoterPercentage, detractorPercentage, nps }
}

/**
 * Categorizes a list of valid submitted 0-10 NPS scores and returns the
 * full breakdown — promoter/passive/detractor counts, total responses,
 * both percentages, and the final NPS. All percentage-derived fields are
 * null (never NaN/Infinity) when there are zero valid scores — render the
 * caller's own existing empty-state for that.
 */
export function summarizeNpsResponses(scores) {
  const validScores = (scores || []).filter((value) => value !== null && value !== undefined)
  const promoters = validScores.filter((score) => score >= 9).length
  const passives = validScores.filter((score) => score >= 7 && score <= 8).length
  const detractors = validScores.filter((score) => score <= 6).length
  const totalResponses = validScores.length
  const { promoterPercentage, detractorPercentage, nps } = computeNpsFromCounts(promoters, detractors, totalResponses)

  return { promoters, passives, detractors, totalResponses, promoterPercentage, detractorPercentage, nps }
}

/**
 * The NPS score alone, for call sites that only need the final number.
 */
export function calculateNps(scores) {
  return summarizeNpsResponses(scores).nps
}

/**
 * Combines several ALREADY-categorized groups (e.g. per-school
 * promoter/detractor/total counts) into one higher-level NPS — sums the
 * raw counts first, then computes the percentages/NPS once at the combined
 * level. Never average several groups' already-computed NPS values equally
 * against each other; a group with more responses must weigh more.
 */
export function calculateNpsFromCounts(promoters, detractors, totalResponses) {
  return computeNpsFromCounts(promoters, detractors, totalResponses).nps
}
