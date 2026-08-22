import dotenv from 'dotenv'

dotenv.config()

const requiredVars = ['MONGO_URI', 'JWT_SECRET']

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

// Local dev frontends are always allowed, on top of whatever production
// origin(s) CLIENT_ORIGIN configures — so the same deployed backend works
// against both without ever needing an env change per environment.
const LOCAL_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://fia.ct-cb1.workers.dev',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5000',
]

// A browser's Origin header is always scheme+host+port, never a trailing
// slash — normalize away any trailing slash so a value like
// "https://fia-nu.vercel.app/" (easy to paste by mistake into an env var)
// still matches the real "https://fia-nu.vercel.app" the browser sends.
const configuredOrigins = (process.env.CLIENT_ORIGIN || 'https://fia-nu.vercel.app')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean)

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientOrigins: Array.from(new Set([...configuredOrigins, ...LOCAL_DEV_ORIGINS])),
  mongoUri: process.env.MONGO_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    expiresInRememberMe: process.env.JWT_EXPIRES_IN_REMEMBER_ME || '30d',
  },
  superAdminSeed: {
    loginId: process.env.SUPER_ADMIN_LOGIN_ID || 'fia@admin.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'fia@123',
  },
  isProduction: process.env.NODE_ENV === 'production',
  // Number of reverse-proxy hops in front of this process that should be
  // trusted for `X-Forwarded-For` (Express's `trust proxy` setting) — see
  // app.js for why this matters for rate limiting. Render's edge is one
  // hop; adjust via env if the hosting provider changes.
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS) || 1,
}
