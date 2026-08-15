// Ported from server/src/middleware/errorHandler.js. CRITICAL for frontend
// compatibility: Hono's own default error/404 responses are plain text,
// which would break the frontend's getApiErrorMessage() (it reads
// `err.response.data.message`) — every error path here must return the
// exact same `{success:false, message, details?}` JSON envelope the
// Express backend produced.
import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { ApiError } from '../utils/ApiError'

export function errorHandler(err: Error, c: Context<AppEnv>): Response {
  if (err instanceof ApiError) {
    return c.json(
      { success: false, message: err.message, ...(err.details !== undefined ? { details: err.details } : {}) },
      err.statusCode as never,
    )
  }

  // Any other error becomes a 500; message is masked in production
  // (matches the original's env.isProduction check) and logged.
  console.error(err)
  const message = c.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  return c.json({ success: false, message }, 500)
}

export function notFoundHandler(c: Context<AppEnv>): Response {
  return c.json({ success: false, message: 'Not found' }, 404)
}
