import { authenticateSuperAdmin, getSuperAdminById } from '../services/auth.service.js'
import { generateAuthToken } from '../utils/generateToken.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'

export const login = asyncHandler(async (req, res) => {
  const { loginId, password, rememberMe } = req.body

  if (!loginId || !String(loginId).trim()) {
    throw new ApiError(400, 'Login ID is required')
  }
  if (!password) {
    throw new ApiError(400, 'Password is required')
  }

  const superAdmin = await authenticateSuperAdmin(String(loginId).trim(), password)

  const { token } = generateAuthToken(
    { sub: superAdmin._id.toString() },
    { rememberMe: Boolean(rememberMe) },
  )

  sendSuccess(res, {
    message: 'Login successful',
    data: {
      token,
      admin: superAdmin.toSafeJSON(),
    },
  })
})

export const logout = asyncHandler(async (_req, res) => {
  // JWTs are stateless; the client discards the token. This endpoint exists
  // as a stable place to hook in future server-side invalidation (e.g. a
  // token blacklist) without changing the frontend contract.
  sendSuccess(res, { message: 'Logged out successfully' })
})

export const getCurrentSuperAdmin = asyncHandler(async (req, res) => {
  const superAdmin = await getSuperAdminById(req.superAdminId)
  sendSuccess(res, { message: 'Session valid', data: superAdmin.toSafeJSON() })
})
