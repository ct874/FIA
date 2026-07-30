import mongoose from 'mongoose'
import { connectDB } from '../src/config/db.js'
import { ensureDefaultSuperAdmin } from '../src/services/superAdminBootstrap.service.js'

async function seedSuperAdmin() {
  await connectDB()

  const { created, loginId } = await ensureDefaultSuperAdmin()
  if (created) {
    console.log(`[seed] Super Admin "${loginId}" created successfully.`)
  } else {
    console.log(`[seed] Super Admin "${loginId}" already exists. Skipping.`)
  }

  await mongoose.disconnect()
  process.exit(0)
}

seedSuperAdmin().catch((error) => {
  console.error('[seed] Failed to seed Super Admin:', error)
  process.exit(1)
})
