import { authenticateSchoolLogin, getSchoolById } from '../services/teacherAuth.service.js'
import { generateAuthToken } from '../utils/generateToken.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'

export const teacherLogin = asyncHandler(async (req, res) => {
  const { udise, password, rememberMe } = req.body

  if (!udise || !String(udise).trim()) {
    throw new ApiError(400, 'UDISE is required')
  }
  if (!password) {
    throw new ApiError(400, 'Password is required')
  }

  const school = await authenticateSchoolLogin(String(udise).trim(), password)

  const { token } = generateAuthToken(
    { sub: school._id.toString(), role: 'school' },
    { rememberMe: Boolean(rememberMe) },
  )

  sendSuccess(res, {
    message: 'Login successful',
    data: { token, school: school.toSafeJSON() },
  })
})

export const teacherLogout = asyncHandler(async (_req, res) => {
  sendSuccess(res, { message: 'Logged out successfully' })
})

export const getCurrentSchool = asyncHandler(async (req, res) => {
  const school = await getSchoolById(req.schoolId)
  sendSuccess(res, { message: 'Session valid', data: school.toSafeJSON() })
})
