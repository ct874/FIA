import { getAllResponses } from '../services/teacherResponses.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'

export const getResponses = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query
  const data = await getAllResponses(req.schoolId, { search, page, limit })
  sendSuccess(res, { message: 'Responses fetched', data })
})
