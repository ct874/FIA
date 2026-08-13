// Ported from server/src/utils/ApiResponse.js — same {success, message,
// data} envelope shape, built with Hono's Context instead of Express's res.
import type { Context } from 'hono'

export function sendSuccess(c: Context, options: { statusCode?: number; message?: string; data?: unknown } = {}) {
  const { statusCode = 200, message = 'Success', data = null } = options
  return c.json({ success: true, message, data }, statusCode as never)
}
