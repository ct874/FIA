// Single source of truth for the official platform-wide CSAT formula (see
// the client's CSAT calculation guide). EVERY place on the frontend that
// aggregates "How much did you enjoy this Career Tour?" ratings into a
// CSAT average must go through this file instead of re-deriving its own
// sum/divide logic, so no two views can ever disagree.
//
//   CSAT Average = (sum of every submitted 1-5 rating) / (count of submitted ratings)
//
// Non-responses must never appear in the `ratings` array passed in at all —
// callers filter students who didn't submit a rating out BEFORE calling
// this (never pass a placeholder like 0/null for a non-response); this
// module only guards against null/undefined slipping through regardless.
//
// Individual student CSAT is NOT computed here — for a single student, the
// "CSAT" is simply their own submitted rating, used directly wherever it's
// displayed (see e.g. schoolRecords.derive.js's computeSubmissionRows).
//
// Aggregating a higher-level group (e.g. "all tours" from several
// already-computed per-tour CSATs)? Don't average those averages — sum
// every group's underlying `scoreSum`/`responseCount` (see
// summarizeCsatRatings below) first, then divide once at the end. Groups
// with different response counts must never be weighted equally.

/**
 * Reduces a list of submitted 1-5 ratings to the sum, count, and rounded
 * average needed by both simple ("this tour's CSAT") and higher-level
 * ("combine several already-summarized groups without re-reading raw
 * ratings") call sites. `average` is null (never NaN/Infinity/0) when
 * there are zero valid ratings — render the caller's own existing
 * empty-state ("—", blank cell, etc.) for that, don't invent a placeholder.
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
 * The CSAT average alone, for call sites that only need the final number
 * (most of them) — see summarizeCsatRatings() when you also need the raw
 * scoreSum/responseCount (e.g. to correctly combine several groups).
 */
export function calculateCsat(ratings) {
  return summarizeCsatRatings(ratings).average
}
