// Ported from server/src/services/superAdminBootstrap.service.js — creates
// the seeded default Super Admin if none exists yet for that login ID.
// Called once at Worker cold-start-equivalent (see index.ts) instead of
// Express's one-time server boot — idempotent either way.
import type { Env } from '../env'
import { findSuperAdminByLoginId, createSuperAdmin } from '../repositories/superAdmins.repository'
import { hashPassword } from '../auth/password'

export async function ensureDefaultSuperAdmin(env: Env): Promise<{ created: boolean; loginId: string }> {
  const loginId = env.SUPER_ADMIN_LOGIN_ID
  const password = env.SUPER_ADMIN_PASSWORD

  const existing = await findSuperAdminByLoginId(env, loginId)
  if (existing) {
    return { created: false, loginId }
  }

  const passwordHash = await hashPassword(password)
  await createSuperAdmin(env, loginId, passwordHash)
  return { created: true, loginId }
}
