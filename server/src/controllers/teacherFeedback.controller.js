import { listTeacherFeedback, submitTeacherFeedback } from '../services/teacherFeedback.service.js'
import { getSchoolById } from '../services/teacherAuth.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'

export const getTeacherFeedback = asyncHandler(async (req, res) => {
  const submissions = await listTeacherFeedback(req.schoolId)
  sendSuccess(res, { message: 'Teacher feedback fetched', data: { submissions } })
})

export const postTeacherFeedback = asyncHandler(async (req, res) => {
  const school = await getSchoolById(req.schoolId)
  const submissions = await submitTeacherFeedback(school, req.body)
  sendSuccess(res, { statusCode: 201, message: 'Feedback submitted', data: { submissions } })
})
