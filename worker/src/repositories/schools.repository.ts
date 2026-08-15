// Firestore collection: schools/{udise} — UDISE is already the school's
// real-world unique identifier, so using it as the document ID gives free
// uniqueness (no separate unique-index concept in Firestore) and O(1)
// lookup, matching how School.findOne({udise}) was used everywhere. Every
// OTHER collection in this app references a school by `udise` (a plain
// string) instead of a Mongo ObjectId ref — simpler, and it's the natural
// key every query already has.
import type { Env } from '../env'
import { countDocs, createDoc, getDoc, getDocsByIds, incrementField, patchDoc, runQueryAll } from '../firestore/client'

const COLLECTION = 'schools'

export interface SchoolRecord {
  udise: string
  schoolName: string
  district: string
  state: string
  passwordHash?: string // absent = legacy school, falls back to "password === udise" (see auth/password.ts callers)
  studentDummyIdSequence: number
  districtCode: string
  postalCode: string
  createdAt: string
  updatedAt: string
}

export async function findSchoolByUdise(env: Env, udise: string) {
  return getDoc<SchoolRecord>(env, COLLECTION, udise)
}

export async function findSchoolsByUdises(env: Env, udises: string[]) {
  return getDocsByIds<SchoolRecord>(env, COLLECTION, udises)
}

export async function listAllSchools(env: Env) {
  return runQueryAll<SchoolRecord>(env, { from: COLLECTION })
}

export async function countAllSchools(env: Env) {
  return countDocs(env, { from: COLLECTION })
}

export async function createSchool(env: Env, data: Omit<SchoolRecord, 'createdAt' | 'updatedAt' | 'studentDummyIdSequence'> & { studentDummyIdSequence?: number }) {
  const now = new Date().toISOString()
  return createDoc<SchoolRecord>(env, COLLECTION, data.udise, {
    ...data,
    studentDummyIdSequence: data.studentDummyIdSequence ?? 0,
    createdAt: now,
    updatedAt: now,
  } as SchoolRecord)
}

export async function patchSchool(env: Env, udise: string, data: Partial<SchoolRecord>, updateMask: string[]) {
  return patchDoc<Partial<SchoolRecord>>(
    env,
    COLLECTION,
    udise,
    { ...data, updatedAt: new Date().toISOString() },
    { updateMask: [...updateMask, 'updatedAt'] },
  )
}

// Atomic per-school counter behind every Student Dummy ID — see
// utils/studentDummyId.ts for the formatting step. Retries with backoff are
// already built into the underlying commit (see firestore/client.ts's
// commitWithRetry) to absorb the occasional ABORTED under a burst of
// simultaneous submissions from the same school (Firestore sustains
// roughly 1 write/sec to a single document).
export async function claimNextStudentDummySequence(env: Env, udise: string): Promise<number> {
  return incrementField(env, COLLECTION, udise, 'studentDummyIdSequence', 1)
}

// Dynamic district catalog (never hardcoded) for the Set Target / District
// Feedback Target dropdowns — one representative `state` per district,
// derived from real school records. Firestore has no server-side
// GROUP BY/DISTINCT over REST, so this fetches every school (small dataset
// for a single state program) and dedupes in the Worker, same result as the
// original Mongo `$group` aggregate.
export async function getDistrictOptions(env: Env): Promise<Array<{ district: string; state: string }>> {
  const schools = await runQueryAll<SchoolRecord>(env, { from: COLLECTION, select: ['district', 'state'] })
  const stateByDistrict = new Map<string, string>()
  for (const school of schools) {
    if (school.data.district && !stateByDistrict.has(school.data.district)) {
      stateByDistrict.set(school.data.district, school.data.state)
    }
  }
  return Array.from(stateByDistrict.entries())
    .map(([district, state]) => ({ district, state }))
    .sort((a, b) => a.district.localeCompare(b.district, 'en', { sensitivity: 'base' }))
}
