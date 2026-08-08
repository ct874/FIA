// Backend twin of src/utils/nps.js — kept in sync manually (frontend and
// backend are separate runtimes with no shared module boundary in this
// repo). Both implement the exact same official NPS formula; if this
// formula ever changes, update BOTH files identically.
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
// Non-responses must never appear in the `scores` array passed in at all,
// must never be counted as a Detractor, and must never be treated as 0.
//
// NPS is collected only at the teacher/classroom level, never per
// individual student, and is a completely separate metric from CSAT/ITP
// (see utils/csat.js / utils/itp.js) — never mix their inputs.

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
 * null (never NaN/Infinity) when there are zero valid scores.
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
 * Combines several ALREADY-categorized groups into one higher-level NPS —
 * sums the raw counts first, then computes the percentages/NPS once at the
 * combined level, instead of averaging already-computed NPS values equally.
 */
export function calculateNpsFromCounts(promoters, detractors, totalResponses) {
  return computeNpsFromCounts(promoters, detractors, totalResponses).nps
}
