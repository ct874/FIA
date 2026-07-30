import { SuperAdmin } from '../models/superAdmin.model.js'
import { env } from '../config/env.js'

export async function ensureDefaultSuperAdmin() {
  const { loginId, password } = env.superAdminSeed

  const existing = await SuperAdmin.findOne({ loginId })
  if (existing) {
    return { created: false, loginId }
  }

  await SuperAdmin.create({ loginId, password })
  return { created: true, loginId }
}
