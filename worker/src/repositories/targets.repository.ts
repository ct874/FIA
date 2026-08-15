// Firestore collection: targets/{financialYear}_{month}_{district} — the
// deterministic ID replaces Mongo's compound unique index on
// {financialYear, month, district}. Each segment is encodeURIComponent'd
// (see firestore/codec.ts's encodeIdSegment) so a free-text district name
// containing spaces/punctuation can never collide with or invalidate the ID.
import type { Env } from '../env'
import { getDoc, patchDoc, runQueryAll } from '../firestore/client'
import { encodeIdSegment, normalizeDistrict } from '../firestore/codec'

const COLLECTION = 'targets'

export interface TargetRecord {
  financialYear: string
  month: string
  state: string
  district: string
  teacherTarget: number
  studentTarget: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

function buildTargetId(financialYear: string, month: string, district: string): string {
  return `${encodeIdSegment(financialYear)}_${encodeIdSegment(month)}_${encodeIdSegment(normalizeDistrict(district))}`
}

// Creates or updates the one Target row for a Financial Year + Month +
// District combination — re-submitting the same combination edits it in
// place (matches the original `$set` fields + `$setOnInsert: {createdBy}`
// upsert). Firestore has no server-side "set on insert" for a partial
// field, so this reads first to decide whether `createdBy`/`createdAt`
// should be preserved (existing doc) or newly written (new doc). The read-
// then-write window is a narrow, low-traffic Super-Admin-only path (target
// editing is not a concurrent public endpoint like student submissions),
// so this is an acceptable non-transactional upsert.
export async function upsertTarget(
  env: Env,
  input: { financialYear: string; month: string; district: string; state: string; teacherTarget: number; studentTarget: number; createdBy: string },
) {
  const id = buildTargetId(input.financialYear, input.month, input.district)
  const existing = await getDoc<TargetRecord>(env, COLLECTION, id)
  const now = new Date().toISOString()

  if (existing) {
    return patchDoc<Partial<TargetRecord>>(
      env,
      COLLECTION,
      id,
      { state: input.state, teacherTarget: input.teacherTarget, studentTarget: input.studentTarget, updatedAt: now },
      { updateMask: ['state', 'teacherTarget', 'studentTarget', 'updatedAt'] },
    )
  }

  return patchDoc<TargetRecord>(
    env,
    COLLECTION,
    id,
    {
      financialYear: input.financialYear,
      month: input.month,
      district: input.district,
      state: input.state,
      teacherTarget: input.teacherTarget,
      studentTarget: input.studentTarget,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    },
    { fullOverwrite: true, updateMask: [] },
  )
}

// Single equality filter — no composite index needed.
export async function listTargetsForFinancialYear(env: Env, financialYear: string) {
  return runQueryAll<TargetRecord>(env, { from: COLLECTION, where: [{ field: 'financialYear', op: 'EQUAL', value: financialYear }] })
}
