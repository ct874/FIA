import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function generateAuthToken(payload, { rememberMe = false } = {}) {
  const expiresIn = rememberMe ? env.jwt.expiresInRememberMe : env.jwt.expiresIn
  const token = jwt.sign(payload, env.jwt.secret, { expiresIn })
  const maxAgeMs = parseExpiryToMs(expiresIn)
  return { token, maxAgeMs }
}

function parseExpiryToMs(expiresIn) {
  const match = /^(\d+)([smhd])$/.exec(expiresIn)
  if (!match) return 24 * 60 * 60 * 1000

  const value = Number(match[1])
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }
  return value * unitMs[match[2]]
}
