import { SuperAdmin } from '../models/superAdmin.model.js'
import { ApiError } from '../utils/ApiError.js'

export async function authenticateSuperAdmin(loginId, password) {
  const superAdmin = await SuperAdmin.findOne({ loginId }).select('+password')

  if (!superAdmin) {
    throw new ApiError(401, 'Invalid login ID or password')
  }

  const isPasswordValid = await superAdmin.comparePassword(password)
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid login ID or password')
  }

  return superAdmin
}

export async function getSuperAdminById(id) {
  const superAdmin = await SuperAdmin.findById(id)
  if (!superAdmin) {
    throw new ApiError(401, 'Session is no longer valid')
  }
  return superAdmin
}

// Re-verifies the currently logged-in Super Admin's password for a
// dangerous, hard-to-reverse action (e.g. resetting the database) — a valid
// session token alone isn't enough for this, the admin must re-enter their
// password immediately before the action runs.
//
// Uses 403 (not 401) for a wrong password: the axios client interceptor
// treats any 401 as "session expired" and force-logs the admin out, which
// would otherwise kick them out of the whole panel just for a typo here.
export async function verifySuperAdminPassword(superAdminId, password) {
  if (!password || typeof password !== 'string') {
    throw new ApiError(400, 'Password is required.')
  }

  const superAdmin = await SuperAdmin.findById(superAdminId).select('+password')
  if (!superAdmin) {
    throw new ApiError(401, 'Session is no longer valid')
  }

  const isPasswordValid = await superAdmin.comparePassword(password)
  if (!isPasswordValid) {
    throw new ApiError(403, 'Incorrect password.')
  }
}
