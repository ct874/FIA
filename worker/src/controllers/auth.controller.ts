// Ported from server/src/controllers/auth.controller.js. `sub` is now the
// Firestore doc ID (normalized login ID) instead of a Mongo ObjectId — see
// repositories/superAdmins.repository.ts.
import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { authenticateSuperAdmin, getSuperAdminById } from '../services/auth.service'
import { generateAuthToken } from '../auth/jwt'
import { sendSuccess } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'

export async function login(c: Context<AppEnv>) {
  const body = await c.req.json()
  const { loginId, password, rememberMe } = body

  if (!loginId || !String(loginId).trim()) {
    throw new ApiError(400, 'Login ID is required')
  }
  if (!password) {
    throw new ApiError(400, 'Password is required')
  }

  const superAdmin = await authenticateSuperAdmin(c.env, String(loginId).trim(), password)

  const { token } = await generateAuthToken(c.env, { sub: superAdmin.id }, { rememberMe: Boolean(rememberMe) })

  return sendSuccess(c, {
    message: 'Login successful',
    data: { token, admin: { id: superAdmin.id, loginId: superAdmin.data.loginId, createdAt: superAdmin.data.createdAt, updatedAt: superAdmin.data.updatedAt } },
  })
}

export async function logout(c: Context<AppEnv>) {
  // JWTs are stateless; the client discards the token.
  return sendSuccess(c, { message: 'Logged out successfully' })
}

export async function getCurrentSuperAdmin(c: Context<AppEnv>) {
  const superAdminId = c.get('superAdminId') as string
  const superAdmin = await getSuperAdminById(c.env, superAdminId)
  return sendSuccess(c, {
    message: 'Session valid',
    data: { id: superAdmin.id, loginId: superAdmin.data.loginId, createdAt: superAdmin.data.createdAt, updatedAt: superAdmin.data.updatedAt },
  })
}
