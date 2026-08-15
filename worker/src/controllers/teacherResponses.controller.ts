import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { getAllResponses } from '../services/teacherResponses.service'
import { sendSuccess } from '../utils/ApiResponse'

export async function getResponses(c: Context<AppEnv>) {
  const schoolId = c.get('schoolId') as string
  const search = c.req.query('search')
  const page = c.req.query('page')
  const limit = c.req.query('limit')
  const data = await getAllResponses(c.env, schoolId, {
    search: search ?? '',
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 100,
  })
  return sendSuccess(c, { message: 'Responses fetched', data })
}
