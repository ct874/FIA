// Ported from server/src/middleware/authenticateSchool.js — School/Teacher
// Portal auth. Additionally checks `decoded.role === 'school'` (rejects a
// Super Admin token used on a teacher route, and vice versa).
import type { Context, Next } from 'hono'
import type { AppEnv } from '../types'
import { verifyToken, InvalidTokenError, type SchoolTokenPayload } from '../auth/jwt'
import { ApiError } from '../utils/ApiError'

export async function authenticateSchool(c: Context<AppEnv>, next: Next): Promise<void | Response> {
  const header = c.req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    throw new ApiError(401, 'Session expired or invalid, please log in again')
  }

  try {
    const decoded = await verifyToken<SchoolTokenPayload>(c.env, token)
    if (decoded.role !== 'school') {
      throw new InvalidTokenError('Session expired or invalid, please log in again')
    }
    c.set('schoolId', decoded.sub)
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      throw new ApiError(401, error.message)
    }
    throw error
  }

  await next()
}
