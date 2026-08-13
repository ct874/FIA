// Ported verbatim from server/src/utils/ApiError.js — every service throws
// this, and the Hono error handler (see index.ts) maps it to the exact same
// `{success:false, message, data}`-shaped response the Express backend
// produced, since the frontend's getApiErrorMessage() depends on it.
export class ApiError extends Error {
  statusCode: number
  details?: unknown

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }
}
