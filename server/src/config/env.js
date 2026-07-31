import dotenv from 'dotenv'

dotenv.config()

const requiredVars = ['MONGO_URI', 'JWT_SECRET']

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim()),
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
}
