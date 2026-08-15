import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

function extractBearerToken(req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  return scheme === 'Bearer' && token ? token : null
}

// Mirrors middleware/authenticate.js but issued/verified as a separate token
// "role" (school vs super-admin) so the two auth flows never cross over.
export const authenticateSchool = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req)

  if (!token) {
    throw new ApiError(401, 'Authentication required')
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret)
    if (decoded.role !== 'school') {
      throw new Error('Wrong token role')
    }
    req.schoolId = decoded.sub
    next()
  } catch {
    throw new ApiError(401, 'Session expired or invalid, please log in again')
  }
})
