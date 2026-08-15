import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { getStudentFeedbackSummary, submitStudentFeedback } from '../services/studentFeedback.service'
import { getSchoolById } from '../services/teacherAuth.service'
import { getTourCatalog } from '../services/tourCatalog.service'
import { sendSuccess } from '../utils/ApiResponse'

export async function getStudentFeedbackSummaryHandler(c: Context<AppEnv>) {
  const schoolId = c.get('schoolId') as string
  const grades = await getStudentFeedbackSummary(c.env, schoolId)
  return sendSuccess(c, { message: 'Student feedback summary fetched', data: { grades } })
}

export async function postStudentFeedback(c: Context<AppEnv>) {
  const schoolId = c.get('schoolId') as string
  const body = await c.req.json()
  const [school, tourCatalog] = await Promise.all([getSchoolById(c.env, schoolId), getTourCatalog(c.env)])
  const submission = await submitStudentFeedback(c.env, school, body, tourCatalog)
  return sendSuccess(c, { statusCode: 201, message: 'Student feedback submitted', data: { submission } })
}
