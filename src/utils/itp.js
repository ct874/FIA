// Single source of truth for the official platform-wide ITP (Intent to
// Participate) formula — mirrors utils/csat.js exactly, but for the
// separate "How interested are you in learning more about careers of the
// future?" question. EVERY place on the frontend that aggregates ITP
// scores must go through this file instead of re-deriving its own
// sum/divide logic, so no two views can ever disagree.
//
//   ITP Average = (sum of every submitted 1-5 ITP score) / (count of submitted ITP responses)
//
// Non-responses must never appear in the `scores` array passed in at all —
// callers filter students who didn't submit an ITP response out BEFORE
// calling this (never pass a placeholder like 0/null for a non-response);
// this module only guards against null/undefined slipping through
// regardless.
//
// Individual student ITP is NOT computed here — for a single student, ITP
// is simply their own submitted score, used directly wherever it's
// displayed.
//
// ITP and CSAT are separate metrics from separate questions — never mix
// ITP scores into utils/csat.js's calculateCsat(), or vice versa.

/**
 * Reduces a list of submitted 1-5 ITP scores to the sum, count, and rounded
 * average. `average` is null (never NaN/Infinity/0) when there are zero
 * valid scores — render the caller's own existing empty-state for that,
 * don't invent a placeholder.
 */
export function summarizeItpScores(scores) {
  const validScores = (scores || []).filter((value) => value !== null && value !== undefined)
  const responseCount = validScores.length
  const scoreSum = validScores.reduce((sum, value) => sum + value, 0)
  return {
    responseCount,
    scoreSum,
    average: responseCount === 0 ? null : Number((scoreSum / responseCount).toFixed(2)),
  }
}

/**
 * The ITP average alone, for call sites that only need the final number.
 */
export function calculateItp(scores) {
  return summarizeItpScores(scores).average
}
