import {
  getStudentFeedbackSummary,
  submitStudentFeedback,
} from '../services/studentFeedback.service.js'
import { getSchoolById } from '../services/teacherAuth.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'

export const getStudentFeedbackSummaryHandler = asyncHandler(async (req, res) => {
  const grades = await getStudentFeedbackSummary(req.schoolId)
  sendSuccess(res, { message: 'Student feedback summary fetched', data: { grades } })
})

export const postStudentFeedback = asyncHandler(async (req, res) => {
  const school = await getSchoolById(req.schoolId)
  const submission = await submitStudentFeedback(school, req.body)
  sendSuccess(res, { statusCode: 201, message: 'Student feedback submitted', data: { submission } })
})
