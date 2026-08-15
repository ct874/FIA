import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'

export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500
  const message =
    statusCode === 500 && env.isProduction ? 'Internal server error' : err.message

  if (statusCode === 500) {
    console.error('[error]', err)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err instanceof ApiError && err.details ? { details: err.details } : {}),
  })
}
