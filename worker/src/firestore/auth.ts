// Mints a short-lived Google OAuth2 access token from the Firebase service
// account, using the standard GCP "JWT bearer" flow — this is how Firestore
// is reached from Cloudflare Workers instead of the Firebase Admin SDK
// (which depends on gRPC/Node TCP sockets and does not run in a Workers
// isolate). Everything below uses only Web Crypto + fetch, no Node APIs.
import type { Env } from '../env'

interface CachedToken {
  accessToken: string
  expiresAtMs: number
}

// Cached at MODULE scope, not per-request — this is a pure performance
// optimization (a cold isolate just mints a fresh token; a warm isolate
// reuses it for ~55 minutes), never a correctness dependency. Caching the
// in-flight PROMISE (not just the resolved token) matters: without it, N
// concurrent requests hitting a cold isolate would each independently mint
// their own token instead of sharing one in-flight mint.
let cachedTokenPromise: Promise<CachedToken> | null = null

const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
// Refresh 5 minutes before actual expiry (Google tokens last 3600s) to
// avoid ever handing out a token that expires mid-request.
const REFRESH_SKEW_MS = 5 * 60 * 1000

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const byte of arr) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlEncodeString(value: string): string {
  return base64UrlEncode(new TextEncoder().encode(value))
}

// Cloudflare secrets frequently arrive with literal `\n` (two characters,
// backslash+n) instead of real newlines if the PEM was pasted from the
// service-account JSON file as a single-line string — this must be
// unescaped before stripping the PEM header/footer, or `importKey` fails
// with an opaque "invalid PKCS#8 data" error.
function pemToPkcs8(pem: string): ArrayBuffer {
  const normalized = pem.replace(/\\n/g, '\n').trim()
  const base64 = normalized
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function signServiceAccountJwt(env: Env): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: FIRESTORE_SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  }

  const unsignedToken = `${base64UrlEncodeString(JSON.stringify(header))}.${base64UrlEncodeString(JSON.stringify(claims))}`

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(env.FIREBASE_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsignedToken))

  return `${unsignedToken}.${base64UrlEncode(signature)}`
}

async function mintAccessToken(env: Env): Promise<CachedToken> {
  const assertion = await signServiceAccountJwt(env)

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to mint Firebase access token (${response.status}): ${body}`)
  }

  const json = (await response.json()) as { access_token: string; expires_in: number }
  return {
    accessToken: json.access_token,
    expiresAtMs: Date.now() + json.expires_in * 1000,
  }
}

export async function getFirestoreAccessToken(env: Env): Promise<string> {
  if (cachedTokenPromise) {
    const cached = await cachedTokenPromise
    if (cached.expiresAtMs - REFRESH_SKEW_MS > Date.now()) {
      return cached.accessToken
    }
  }

  cachedTokenPromise = mintAccessToken(env)
  try {
    const token = await cachedTokenPromise
    return token.accessToken
  } catch (error) {
    cachedTokenPromise = null // don't cache a failed mint — next call retries cleanly
    throw error
  }
}
