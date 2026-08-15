import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { getDistrictOptions, upsertTarget, getTargetProgress, SET_TARGET_PASSCODE } from '../services/target.service'
import { sendSuccess } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'

export async function getProgress(c: Context<AppEnv>) {
  const data = await getTargetProgress(c.env)
  return sendSuccess(c, { message: 'Target progress fetched', data })
}

export async function getDistricts(c: Context<AppEnv>) {
  const districts = await getDistrictOptions(c.env)
  return sendSuccess(c, { message: 'Districts fetched', data: districts })
}

// UI confirmation gate before opening the Set Target screen — not a
// replacement for the Super Admin session `authenticate` already requires.
// 403 (not 401) on a wrong guess, same convention as verifySuperAdminPassword.
export async function verifyAccess(c: Context<AppEnv>) {
  const body = await c.req.json()
  const { password } = body
  if (!password || typeof password !== 'string') {
    throw new ApiError(400, 'Password is required.')
  }
  if (password !== SET_TARGET_PASSCODE) {
    throw new ApiError(403, 'Incorrect password.')
  }
  return sendSuccess(c, { message: 'Access granted' })
}

export async function saveTarget(c: Context<AppEnv>) {
  const superAdminId = c.get('superAdminId') as string
  const body = await c.req.json()
  const target = await upsertTarget(c.env, superAdminId, body)
  return sendSuccess(c, { message: 'Target saved', data: target })
}
