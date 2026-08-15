// Backend twin of src/utils/csat.js — kept in sync manually (frontend and
// backend are separate runtimes with no shared module boundary in this
// repo). Both implement the exact same official CSAT formula (see the
// client's CSAT calculation guide); if this formula ever changes, update
// BOTH files identically.
//
//   CSAT Average = (sum of every submitted 1-5 rating) / (count of submitted ratings)
//
// Non-responses must never appear in the `ratings` array passed in at all —
// callers filter students who didn't submit a rating out BEFORE calling
// this (never pass a placeholder like 0/null for a non-response); this
// module only guards against null/undefined slipping through regardless.
//
// Aggregating a higher-level group (e.g. a whole school) from several
// already-computed per-group CSATs? Don't average those averages — sum
// every group's underlying `scoreSum`/`responseCount` (see
// summarizeCsatRatings below) first, then divide once at the end.

/**
 * Reduces a list of submitted 1-5 ratings to the sum, count, and rounded
 * average. `average` is null (never NaN/Infinity/0) when there are zero
 * valid ratings — callers render their own existing empty-state (e.g. AFE's
 * blank cell convention) for that, never a placeholder like 0.
 */
export function summarizeCsatRatings(ratings) {
  const validRatings = (ratings || []).filter((value) => value !== null && value !== undefined)
  const responseCount = validRatings.length
  const scoreSum = validRatings.reduce((sum, value) => sum + value, 0)
  return {
    responseCount,
    scoreSum,
    average: responseCount === 0 ? null : Number((scoreSum / responseCount).toFixed(2)),
  }
}

/**
 * The CSAT average alone, for call sites that only need the final number.
 */
export function calculateCsat(ratings) {
  return summarizeCsatRatings(ratings).average
}
