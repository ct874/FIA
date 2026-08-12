import { DistrictFeedbackTarget } from '../models/districtFeedbackTarget.model.js'
import { getDistrictOptions } from './target.service.js'
import { ApiError } from '../utils/ApiError.js'

// Same lightweight-passcode convention as target.service.js's
// SET_TARGET_PASSCODE and tours.service.js's TOUR_MANAGEMENT_PASSCODE — a UI
// confirmation gate, not a substitute for the Super Admin session already
// required by every route in routes/districtFeedbackTarget.routes.js.
export const DISTRICT_TARGET_PASSCODE = 'fia@123'

// The existing default — every district not explicitly configured below
// keeps using exactly this, unchanged from before this feature existed.
export const DEFAULT_STUDENT_FEEDBACK_TARGET_PERCENT = 40

function assertPasscode(password) {
  if (!password || typeof password !== 'string') {
    throw new ApiError(400, 'Password is required.')
  }
  if (password !== DISTRICT_TARGET_PASSCODE) {
    throw new ApiError(403, 'Incorrect password.')
  }
}

// Every real district (from School records, via target.service.js's
// getDistrictOptions() — never a separate hardcoded list), each paired with
// its configured percent or the 40% default when unconfigured.
export async function listDistrictTargets() {
  const [districts, configured] = await Promise.all([
    getDistrictOptions(),
    DistrictFeedbackTarget.find(),
  ])

  const percentByDistrict = new Map(configured.map((doc) => [doc.district, doc.targetPercent]))

  return districts.map(({ district, state }) => ({
    district,
    state,
    targetPercent: percentByDistrict.get(district) ?? DEFAULT_STUDENT_FEEDBACK_TARGET_PERCENT,
  }))
}

// Internal helper for the actual feedback-flow call sites — returns the
// configured percent for a district, or the 40% default when unconfigured.
export async function getTargetPercentForDistrict(district) {
  if (!district) return DEFAULT_STUDENT_FEEDBACK_TARGET_PERCENT
  const doc = await DistrictFeedbackTarget.findOne({ district })
  return doc?.targetPercent ?? DEFAULT_STUDENT_FEEDBACK_TARGET_PERCENT
}

// Precomputes every configured district's percent in a single query — for
// callers (afeExport.service.js) that already loop over every school and
// would otherwise issue one findOne() per school.
export async function getTargetPercentMap() {
  const configured = await DistrictFeedbackTarget.find()
  return new Map(configured.map((doc) => [doc.district, doc.targetPercent]))
}

export async function setDistrictTarget(superAdminId, { district, targetPercent, password }) {
  assertPasscode(password)

  const trimmedDistrict = String(district ?? '').trim()
  if (!trimmedDistrict) {
    throw new ApiError(400, 'District is required.')
  }

  const knownDistricts = await getDistrictOptions()
  if (!knownDistricts.some((entry) => entry.district === trimmedDistrict)) {
    throw new ApiError(400, `Unknown district: ${trimmedDistrict}`)
  }

  const percent = Number(targetPercent)
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new ApiError(400, 'Student Feedback Target must be a number between 0 and 100.')
  }

  const target = await DistrictFeedbackTarget.findOneAndUpdate(
    { district: trimmedDistrict },
    { $set: { targetPercent: percent, updatedBy: superAdminId } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true, context: 'query' },
  )

  return target.toSafeJSON()
}
