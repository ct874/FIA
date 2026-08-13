import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { listDistrictTargets, setDistrictTarget } from '../services/districtFeedbackTarget.service'
import { sendSuccess } from '../utils/ApiResponse'

export async function getDistrictTargets(c: Context<AppEnv>) {
  const data = await listDistrictTargets(c.env)
  return sendSuccess(c, { message: 'District Student Feedback Targets fetched', data })
}

export async function postDistrictTarget(c: Context<AppEnv>) {
  const superAdminId = c.get('superAdminId') as string
  const body = await c.req.json()
  const target = await setDistrictTarget(c.env, superAdminId, body)
  return sendSuccess(c, { message: 'District Student Feedback Target saved', data: target })
}
