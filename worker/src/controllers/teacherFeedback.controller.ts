import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { listTeacherFeedback, submitTeacherFeedback } from '../services/teacherFeedback.service'
import { getSchoolById } from '../services/teacherAuth.service'
import { getTourCatalog } from '../services/tourCatalog.service'
import { sendSuccess } from '../utils/ApiResponse'

export async function getTeacherFeedback(c: Context<AppEnv>) {
  const schoolId = c.get('schoolId') as string
  const submissions = await listTeacherFeedback(c.env, schoolId)
  return sendSuccess(c, { message: 'Teacher feedback fetched', data: { submissions } })
}

export async function postTeacherFeedback(c: Context<AppEnv>) {
  const schoolId = c.get('schoolId') as string
  const body = await c.req.json()
  const [school, tourCatalog] = await Promise.all([getSchoolById(c.env, schoolId), getTourCatalog(c.env)])
  const submissions = await submitTeacherFeedback(c.env, school, body, tourCatalog)
  return sendSuccess(c, { statusCode: 201, message: 'Feedback submitted', data: { submissions } })
}
