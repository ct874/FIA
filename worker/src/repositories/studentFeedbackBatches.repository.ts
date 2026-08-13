// Firestore collection: studentFeedbackBatches/{udise}_{grade} — the
// deterministic ID replaces Mongo's compound unique index on
// {school, grade} AND is exactly the natural key the original's "merge
// repeat submissions into the same document" logic already needed —
// upserting this one doc IS the merge, no separate lookup required.
import type { Env } from '../env'
import { getDoc, patchDoc, runQueryAll } from '../firestore/client'
import { encodeIdSegment } from '../firestore/codec'

const COLLECTION = 'studentFeedbackBatches'

export interface TourRefRecord {
  tourId: string
  tourName: string
}

export interface StudentFeedbackBatchRecord {
  udise: string
  schoolName: string
  grade: string
  studentCount: number
  tours: TourRefRecord[]
  language: string
  month: string
  financialYear: string
  createdAt: string
  updatedAt: string
}

function buildId(udise: string, grade: string): string {
  return `${encodeIdSegment(udise)}_${encodeIdSegment(grade)}`
}

export async function findBatch(env: Env, udise: string, grade: string) {
  return getDoc<StudentFeedbackBatchRecord>(env, COLLECTION, buildId(udise, grade))
}

// Full-document write (create or replace) — the service layer computes the
// merged studentCount/tours/month/financialYear before calling this, so a
// plain overwrite of the whole record is correct and avoids a second
// partial-update round trip.
export async function putBatch(env: Env, data: Omit<StudentFeedbackBatchRecord, 'createdAt' | 'updatedAt'> & { createdAt?: string }) {
  const now = new Date().toISOString()
  return patchDoc<StudentFeedbackBatchRecord>(
    env,
    COLLECTION,
    buildId(data.udise, data.grade),
    { ...data, createdAt: data.createdAt ?? now, updatedAt: now } as StudentFeedbackBatchRecord,
    { fullOverwrite: true, updateMask: [] },
  )
}

// Requires a composite index on (udise ASC, grade ASC) if ever queried
// with an orderBy — this app only filters by udise here (grade is read
// directly via the deterministic ID above when a specific grade is known),
// so the default single-field index already covers it.
export async function listBatchesForSchool(env: Env, udise: string) {
  return runQueryAll<StudentFeedbackBatchRecord>(env, { from: COLLECTION, where: [{ field: 'udise', op: 'EQUAL', value: udise }] })
}

export async function listAllBatches(env: Env) {
  return runQueryAll<StudentFeedbackBatchRecord>(env, { from: COLLECTION })
}

export async function listBatchesForFinancialYear(env: Env, financialYear: string) {
  return runQueryAll<StudentFeedbackBatchRecord>(env, {
    from: COLLECTION,
    where: [{ field: 'financialYear', op: 'EQUAL', value: financialYear }],
  })
}
