// Ported from server/src/services/auth.service.js — Super Admin
// authentication. `id` throughout is the Firestore doc ID (normalized
// login ID) instead of a Mongo ObjectId — see repositories/superAdmins.repository.ts.
import type { Env } from '../env'
import { findSuperAdminByLoginId, findSuperAdminById, type SuperAdminRecord } from '../repositories/superAdmins.repository'
import { comparePassword } from '../auth/password'
import { ApiError } from '../utils/ApiError'
import type { DecodedDocument } from '../firestore/codec'

export async function authenticateSuperAdmin(env: Env, loginId: string, password: string): Promise<DecodedDocument<SuperAdminRecord>> {
  const superAdmin = await findSuperAdminByLoginId(env, loginId)
  if (!superAdmin) {
    throw new ApiError(401, 'Invalid login ID or password')
  }

  const isPasswordValid = await comparePassword(password, superAdmin.data.passwordHash)
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid login ID or password')
  }

  return superAdmin
}

export async function getSuperAdminById(env: Env, id: string): Promise<DecodedDocument<SuperAdminRecord>> {
  const superAdmin = await findSuperAdminById(env, id)
  if (!superAdmin) {
    throw new ApiError(401, 'Session is no longer valid')
  }
  return superAdmin
}

// Re-verifies the currently logged-in Super Admin's password for a
// dangerous, hard-to-reverse action. 403 (not 401) on a wrong password —
// the axios client interceptor treats any 401 as "session expired" and
// force-logs the admin out, which this must not trigger just for a typo.
export async function verifySuperAdminPassword(env: Env, superAdminId: string, password: unknown): Promise<void> {
  if (!password || typeof password !== 'string') {
    throw new ApiError(400, 'Password is required.')
  }

  const superAdmin = await findSuperAdminById(env, superAdminId)
  if (!superAdmin) {
    throw new ApiError(401, 'Session is no longer valid')
  }

  const isPasswordValid = await comparePassword(password, superAdmin.data.passwordHash)
  if (!isPasswordValid) {
    throw new ApiError(403, 'Incorrect password.')
  }
}
