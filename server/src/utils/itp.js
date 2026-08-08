// Backend twin of src/utils/itp.js — kept in sync manually (frontend and
// backend are separate runtimes with no shared module boundary in this
// repo). Both implement the exact same official ITP formula; if this
// formula ever changes, update BOTH files identically.
//
//   ITP Average = (sum of every submitted 1-5 ITP score) / (count of submitted ITP responses)
//
// Non-responses must never appear in the `scores` array passed in at all —
// callers filter students who didn't submit an ITP response out BEFORE
// calling this (never pass a placeholder like 0/null for a non-response);
// this module only guards against null/undefined slipping through
// regardless.
//
// ITP and CSAT are separate metrics from separate questions — never mix
// ITP scores into utils/csat.js's calculateCsat(), or vice versa.

/**
 * Reduces a list of submitted 1-5 ITP scores to the sum, count, and rounded
 * average. `average` is null (never NaN/Infinity/0) when there are zero
 * valid scores — callers render their own existing empty-state for that,
 * never a placeholder like 0.
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
