// HS256 JWT sign/verify via `jose` (Web Crypto), replacing `jsonwebtoken`.
// Same algorithm, same shared secret, same claim shapes as the existing
// Express backend — HS256 over a UTF-8 secret produces byte-identical
// tokens between jsonwebtoken and jose, so a token minted by the OLD
// server still verifies here and vice versa: sessions survive a cutover
// (and a rollback) with no forced logout.
import { SignJWT, jwtVerify, errors as joseErrors } from 'jose'
import type { Env } from '../env'

export type SuperAdminTokenPayload = { sub: string }
export type SchoolTokenPayload = { sub: string; role: 'school' }

function getSecretKey(env: Env): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET)
}

// Mirrors server/src/utils/generateToken.js's expiry-string parsing (e.g.
// '1d' / '30d') so JWT_EXPIRES_IN / JWT_EXPIRES_IN_REMEMBER_ME keep working
// unchanged as plain env var strings.
function parseExpiryToSeconds(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn.trim())
  if (!match) return 24 * 60 * 60 // default: 1 day
  const amount = Number(match[1])
  const unit = match[2]
  const unitSeconds = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 86400
  return amount * unitSeconds
}

export interface IssuedToken {
  token: string
  maxAgeMs: number
}

export async function generateAuthToken(
  env: Env,
  payload: SuperAdminTokenPayload | SchoolTokenPayload,
  options: { rememberMe?: boolean } = {},
): Promise<IssuedToken> {
  const expiresIn = options.rememberMe ? env.JWT_EXPIRES_IN_REMEMBER_ME : env.JWT_EXPIRES_IN
  const expiresInSeconds = parseExpiryToSeconds(expiresIn)

  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(getSecretKey(env))

  return { token, maxAgeMs: expiresInSeconds * 1000 }
}

export class InvalidTokenError extends Error {}

export async function verifyToken<T extends Record<string, unknown>>(env: Env, token: string): Promise<T> {
  try {
    // `algorithms` is explicit and mandatory here — jose (unlike
    // jsonwebtoken) will not infer/accept an algorithm you didn't ask for,
    // which is the correct, safer default (prevents alg-confusion attacks).
    const { payload } = await jwtVerify(token, getSecretKey(env), { algorithms: ['HS256'] })
    return payload as unknown as T
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired || error instanceof joseErrors.JWSSignatureVerificationFailed) {
      throw new InvalidTokenError('Session expired or invalid, please log in again')
    }
    throw new InvalidTokenError('Session expired or invalid, please log in again')
  }
}
