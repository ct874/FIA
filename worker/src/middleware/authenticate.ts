// Ported from server/src/middleware/authenticate.js — Super Admin auth.
// Same token shape/verification as before: `Authorization: Bearer <token>`,
// payload `{sub}` (no `role` claim at all for this path — any validly-
// signed token with a `sub` is accepted, exactly like the original).
import type { Context, Next } from 'hono'
import type { AppEnv } from '../types'
import { verifyToken, InvalidTokenError, type SuperAdminTokenPayload } from '../auth/jwt'
import { ApiError } from '../utils/ApiError'

export async function authenticate(c: Context<AppEnv>, next: Next): Promise<void | Response> {
  const header = c.req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    throw new ApiError(401, 'Session expired or invalid, please log in again')
  }

  try {
    const decoded = await verifyToken<SuperAdminTokenPayload>(c.env, token)
    c.set('superAdminId', decoded.sub)
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      throw new ApiError(401, error.message)
    }
    throw error
  }

  await next()
}
