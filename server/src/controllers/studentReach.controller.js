import { listStudentReach, submitStudentReach } from '../services/studentReach.service.js'
import { getSchoolById } from '../services/teacherAuth.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'

export const getStudentReach = asyncHandler(async (req, res) => {
  const records = await listStudentReach(req.schoolId)
  sendSuccess(res, { message: 'Student reach fetched', data: { records } })
})

export const postStudentReach = asyncHandler(async (req, res) => {
  const school = await getSchoolById(req.schoolId)
  const record = await submitStudentReach(school, req.body)
  sendSuccess(res, { statusCode: 201, message: 'Reach data saved', data: { record } })
})
