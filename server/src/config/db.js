import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB() {
  mongoose.set('strictQuery', true)

  try {
    await mongoose.connect(env.mongoUri)
    console.log('[db] MongoDB connected')
  } catch (error) {
    console.error('[db] MongoDB connection failed:', error.message)
    process.exit(1)
  }
}
