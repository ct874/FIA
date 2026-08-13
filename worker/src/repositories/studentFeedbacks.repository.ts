// Firestore collection: studentFeedbacks/{udise}_{studentDummyId} — the
// deterministic ID replaces Mongo's compound-unique-index safety net on
// {school, studentDummyId}. Since the Dummy ID is claimed atomically per
// submission (see repositories/schools.repository.ts's
// claimNextStudentDummySequence), this ID can never collide in practice —
// using it as the document ID (via `createDoc`, which fails on conflict)
// keeps that guarantee even if it somehow did.
import type { Env } from '../env'
import { countDocs, createDoc, runQueryAll } from '../firestore/client'
import { encodeIdSegment } from '../firestore/codec'

const COLLECTION = 'studentFeedbacks'

export interface TourAnswerRecord {
  tourId: string
  tourName: string
  language?: string
  enjoyment: number
  overallExperience: number
  interestInFutureCareer: number
  wantExploreCareer: 'Yes' | 'No' | 'Maybe'
  wantMoreTours: 'Yes' | 'No' | 'Maybe'
}

export interface StudentFeedbackRecord {
  udise: string
  schoolName: string
  grade: string
  studentDummyId: string
  month: string
  financialYear: string
  tours: TourAnswerRecord[]
  createdAt: string
}

function buildId(udise: string, studentDummyId: string): string {
  return `${encodeIdSegment(udise)}_${encodeIdSegment(studentDummyId)}`
}

export async function createStudentFeedback(env: Env, data: Omit<StudentFeedbackRecord, 'createdAt'>) {
  return createDoc<StudentFeedbackRecord>(env, COLLECTION, buildId(data.udise, data.studentDummyId), {
    ...data,
    createdAt: new Date().toISOString(),
  })
}

// Uses Firestore's aggregation `count()` (billed ~1 read per 1000 index
// entries scanned, not 1 per document) instead of fetching every
// submission just to count them — this backs the 40% rule's "has this
// school+grade already hit its quota?" check, which runs on EVERY
// submission and must stay cheap. Requires a composite index on
// (udise ASC, grade ASC) — see firestore.indexes.json.
export async function countStudentFeedbackForSchoolGrade(env: Env, udise: string, grade: string) {
  return countDocs(env, {
    from: COLLECTION,
    where: [
      { field: 'udise', op: 'EQUAL', value: udise },
      { field: 'grade', op: 'EQUAL', value: grade },
    ],
  })
}

export async function listStudentFeedbackForSchool(env: Env, udise: string) {
  return runQueryAll<StudentFeedbackRecord>(env, { from: COLLECTION, where: [{ field: 'udise', op: 'EQUAL', value: udise }] })
}

export async function listAllStudentFeedback(env: Env) {
  return runQueryAll<StudentFeedbackRecord>(env, { from: COLLECTION })
}
