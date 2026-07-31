import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

function extractBearerToken(req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  return scheme === 'Bearer' && token ? token : null
}

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req)

  if (!token) {
    throw new ApiError(401, 'Authentication required')
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret)
    req.superAdminId = decoded.sub
    next()
  } catch {
    throw new ApiError(401, 'Session expired or invalid, please log in again')
  }
})
