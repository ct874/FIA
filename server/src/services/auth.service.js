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
