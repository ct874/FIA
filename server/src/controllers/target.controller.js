import { getDistrictOptions, upsertTarget, getTargetProgress, SET_TARGET_PASSCODE } from '../services/target.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'

export const getProgress = asyncHandler(async (_req, res) => {
  const data = await getTargetProgress()
  sendSuccess(res, { message: 'Target progress fetched', data })
})

export const getDistricts = asyncHandler(async (_req, res) => {
  const districts = await getDistrictOptions()
  sendSuccess(res, { message: 'Districts fetched', data: districts })
})

// Re-check before opening the Set Target screen — a UI confirmation gate,
// not a replacement for the Super Admin session `authenticate` already
// requires on every route in this router. 403 (not 401) on a wrong guess,
// same convention as verifySuperAdminPassword — a 401 here would force-log
// the admin out of the whole panel over a typo.
export const verifyAccess = asyncHandler(async (req, res) => {
  const { password } = req.body
  if (!password || typeof password !== 'string') {
    throw new ApiError(400, 'Password is required.')
  }
  if (password !== SET_TARGET_PASSCODE) {
    throw new ApiError(403, 'Incorrect password.')
  }
  sendSuccess(res, { message: 'Access granted' })
})

export const saveTarget = asyncHandler(async (req, res) => {
  const target = await upsertTarget(req.superAdminId, req.body)
  sendSuccess(res, { message: 'Target saved', data: target })
})
