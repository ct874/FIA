// Firestore collection: districtFeedbackTargets/{normalizedDistrict} — one
// row per district that has an EXPLICIT override of the default 40%
// Student Feedback response target. An unconfigured district simply has no
// row; the 40% default is applied in code (services/districtFeedbackTarget.service.ts).
//
// IMPORTANT: the document ID uses `normalizeDistrict()` (lowercased/trimmed)
// purely so it's always a valid, collision-free Firestore ID — but every
// function here still returns/compares the district's ORIGINAL stored
// casing for actual business-logic matching (e.g. the 40% rule's per-
// district lookup), exactly matching the original Mongo behavior (which
// matched districts by exact stored string, never case-normalized). This
// distinction matters: normalizing the LOOKUP KEY is safe and makes ID
// generation robust; normalizing the VALUE used for business comparisons
// would silently change which schools get which target (see the doc
// comment on normalizeDistrict in firestore/codec.ts).
import type { Env } from '../env'
import { getDoc, patchDoc, runQueryAll } from '../firestore/client'
import { normalizeDistrict } from '../firestore/codec'

const COLLECTION = 'districtFeedbackTargets'

export interface DistrictFeedbackTargetRecord {
  district: string
  targetPercent: number
  updatedBy: string
  updatedAt: string
}

export async function findDistrictFeedbackTarget(env: Env, district: string) {
  return getDoc<DistrictFeedbackTargetRecord>(env, COLLECTION, normalizeDistrict(district))
}

export async function listDistrictFeedbackTargets(env: Env) {
  return runQueryAll<DistrictFeedbackTargetRecord>(env, { from: COLLECTION })
}

export async function upsertDistrictFeedbackTarget(env: Env, district: string, targetPercent: number, updatedBy: string) {
  return patchDoc<DistrictFeedbackTargetRecord>(
    env,
    COLLECTION,
    normalizeDistrict(district),
    { district, targetPercent, updatedBy, updatedAt: new Date().toISOString() },
    { fullOverwrite: true, updateMask: [] },
  )
}
