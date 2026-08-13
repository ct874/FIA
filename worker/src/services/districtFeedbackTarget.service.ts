// Ported from server/src/services/districtFeedbackTarget.service.js —
// per-district overrides of the default 40% Student Feedback quota.
import type { Env } from '../env'
import { getDistrictOptions } from '../repositories/schools.repository'
import {
  findDistrictFeedbackTarget,
  listDistrictFeedbackTargets,
  upsertDistrictFeedbackTarget,
} from '../repositories/districtFeedbackTargets.repository'
import { ApiError } from '../utils/ApiError'

// Same lightweight-passcode convention as target.service.ts's
// SET_TARGET_PASSCODE and tours.service.ts's TOUR_MANAGEMENT_PASSCODE.
export const DISTRICT_TARGET_PASSCODE = 'fia@123'

// Every district not explicitly configured keeps using exactly this.
export const DEFAULT_STUDENT_FEEDBACK_TARGET_PERCENT = 40

function assertPasscode(password: unknown): void {
  if (!password || typeof password !== 'string') {
    throw new ApiError(400, 'Password is required.')
  }
  if (password !== DISTRICT_TARGET_PASSCODE) {
    throw new ApiError(403, 'Incorrect password.')
  }
}

export async function listDistrictTargets(env: Env) {
  const [districts, configured] = await Promise.all([getDistrictOptions(env), listDistrictFeedbackTargets(env)])

  const percentByDistrict = new Map(configured.map((doc) => [doc.data.district, doc.data.targetPercent]))

  return districts.map(({ district, state }) => ({
    district,
    state,
    targetPercent: percentByDistrict.get(district) ?? DEFAULT_STUDENT_FEEDBACK_TARGET_PERCENT,
  }))
}

// The real feedback-flow call site — returns the configured percent for a
// district, or the 40% default when unconfigured. Never trust this being
// bypassed: callers (studentFeedback.service.ts) recompute the actual quota
// from this value on every submission.
export async function getTargetPercentForDistrict(env: Env, district: string | undefined | null): Promise<number> {
  if (!district) return DEFAULT_STUDENT_FEEDBACK_TARGET_PERCENT
  const doc = await findDistrictFeedbackTarget(env, district)
  return doc?.data.targetPercent ?? DEFAULT_STUDENT_FEEDBACK_TARGET_PERCENT
}

// Precomputes every configured district's percent in one query — for
// callers (afeExport.service.ts) that already loop over every school and
// would otherwise issue one lookup per school. Keyed by each doc's ORIGINAL
// stored `district` casing (not the normalized Firestore document ID) so
// afeExport's `map.get(school.district)` behaves exactly like the Mongo
// version's exact-string Map lookup — see
// repositories/districtFeedbackTargets.repository.ts's doc comment.
export async function getTargetPercentMap(env: Env): Promise<Map<string, number>> {
  const configured = await listDistrictFeedbackTargets(env)
  return new Map(configured.map((doc) => [doc.data.district, doc.data.targetPercent]))
}

export async function setDistrictTarget(
  env: Env,
  superAdminId: string,
  input: { district?: unknown; targetPercent?: unknown; password?: unknown },
) {
  assertPasscode(input.password)

  const trimmedDistrict = String(input.district ?? '').trim()
  if (!trimmedDistrict) {
    throw new ApiError(400, 'District is required.')
  }

  const knownDistricts = await getDistrictOptions(env)
  if (!knownDistricts.some((entry) => entry.district === trimmedDistrict)) {
    throw new ApiError(400, `Unknown district: ${trimmedDistrict}`)
  }

  const percent = Number(input.targetPercent)
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new ApiError(400, 'Student Feedback Target must be a number between 0 and 100.')
  }

  const target = await upsertDistrictFeedbackTarget(env, trimmedDistrict, percent, superAdminId)
  return { district: target.data.district, targetPercent: target.data.targetPercent, updatedAt: target.data.updatedAt }
}
