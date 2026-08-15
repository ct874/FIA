import { startStudentFeedbackBatch } from '../services/studentFeedbackBatch.service.js'
import { getSchoolById } from '../services/teacherAuth.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'

export const postStudentFeedbackBatch = asyncHandler(async (req, res) => {
  const school = await getSchoolById(req.schoolId)
  const record = await startStudentFeedbackBatch(school, req.body)
  sendSuccess(res, { statusCode: 201, message: 'Feedback batch started', data: { record } })
})
