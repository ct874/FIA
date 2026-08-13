// Firestore collection: superAdmins/{normalizedLoginId} — using the
// normalized login ID as the document ID makes uniqueness free (no
// separate unique-index concept in Firestore) and gives O(1) lookup by
// login ID, matching how SuperAdmin.findOne({loginId}) was used everywhere.
import type { Env } from '../env'
import { createDoc, getDoc, patchDoc } from '../firestore/client'

const COLLECTION = 'superAdmins'

export interface SuperAdminRecord {
  loginId: string
  passwordHash: string
  createdAt: string
  updatedAt: string
}

function normalizeLoginId(loginId: string): string {
  return String(loginId ?? '').trim().toLowerCase()
}

export async function findSuperAdminByLoginId(env: Env, loginId: string) {
  return getDoc<SuperAdminRecord>(env, COLLECTION, normalizeLoginId(loginId))
}

export async function findSuperAdminById(env: Env, id: string) {
  return getDoc<SuperAdminRecord>(env, COLLECTION, id)
}

export async function createSuperAdmin(env: Env, loginId: string, passwordHash: string) {
  const now = new Date().toISOString()
  return createDoc<SuperAdminRecord>(env, COLLECTION, normalizeLoginId(loginId), {
    loginId: loginId.trim(),
    passwordHash,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateSuperAdminPasswordHash(env: Env, id: string, passwordHash: string) {
  return patchDoc<Partial<SuperAdminRecord>>(env, COLLECTION, id, { passwordHash, updatedAt: new Date().toISOString() }, {
    updateMask: ['passwordHash', 'updatedAt'],
  })
}
