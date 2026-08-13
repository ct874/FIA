import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { startStudentFeedbackBatch } from '../services/studentFeedbackBatch.service'
import { getSchoolById } from '../services/teacherAuth.service'
import { getTourCatalog } from '../services/tourCatalog.service'
import { sendSuccess } from '../utils/ApiResponse'

export async function postStudentFeedbackBatch(c: Context<AppEnv>) {
  const schoolId = c.get('schoolId') as string
  const body = await c.req.json()
  const [school, tourCatalog] = await Promise.all([getSchoolById(c.env, schoolId), getTourCatalog(c.env)])
  const record = await startStudentFeedbackBatch(c.env, school, body, tourCatalog)
  return sendSuccess(c, { statusCode: 201, message: 'Feedback batch started', data: { record } })
}
