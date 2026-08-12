import { listDistrictTargets, setDistrictTarget } from '../services/districtFeedbackTarget.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'

export const getDistrictTargets = asyncHandler(async (_req, res) => {
  const data = await listDistrictTargets()
  sendSuccess(res, { message: 'District Student Feedback Targets fetched', data })
})

// Password (fia@123) is re-checked inside setDistrictTarget() itself, right
// before saving — per the required flow (enter percentage, click Save,
// THEN confirm password), not a separate "unlock this screen" step like
// target.controller.js's verifyAccess.
export const postDistrictTarget = asyncHandler(async (req, res) => {
  const target = await setDistrictTarget(req.superAdminId, req.body)
  sendSuccess(res, { message: 'District Student Feedback Target saved', data: target })
})
