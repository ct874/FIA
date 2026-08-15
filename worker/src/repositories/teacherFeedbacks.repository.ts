// Firestore collection: teacherFeedbacks/{udise}_{tourId}_{month}_{financialYear}
// — the deterministic ID replaces Mongo's compound unique index on
// {school, tourId, month, financialYear}. `createDoc` (fails with 409 on
// conflict) is what actually enforces "never silently overwrite a prior
// submission" here, mirroring what the unique index guaranteed in Mongo —
// the service layer's own `existingCount > 0` pre-check is the primary
// gate (one submission SESSION per school, ever), this is defense in depth.
import type { Env } from '../env'
import { countDocs, createDoc, runQueryAll } from '../firestore/client'
import { encodeIdSegment } from '../firestore/codec'

const COLLECTION = 'teacherFeedbacks'

export interface TeacherFeedbackRecord {
  udise: string
  schoolName: string
  tourId: string
  tourName: string
  language: string
  submittedBy: string
  contactNumber: string
  email: string
  month: string
  financialYear: string
  recommendScore: number
  satisfactionResources: number
  easeIntegration: number
  biggestBenefit: string
  improvements: string
  createdAt: string
}

function buildId(udise: string, tourId: string, month: string, financialYear: string): string {
  return [udise, tourId, month, financialYear].map(encodeIdSegment).join('_')
}

export async function createTeacherFeedback(env: Env, data: Omit<TeacherFeedbackRecord, 'createdAt'>) {
  return createDoc<TeacherFeedbackRecord>(
    env,
    COLLECTION,
    buildId(data.udise, data.tourId, data.month, data.financialYear),
    { ...data, createdAt: new Date().toISOString() },
  )
}

export async function countTeacherFeedbackForSchool(env: Env, udise: string) {
  return countDocs(env, { from: COLLECTION, where: [{ field: 'udise', op: 'EQUAL', value: udise }] })
}

export async function listTeacherFeedbackForSchool(env: Env, udise: string) {
  return runQueryAll<TeacherFeedbackRecord>(env, { from: COLLECTION, where: [{ field: 'udise', op: 'EQUAL', value: udise }] })
}

export async function listAllTeacherFeedback(env: Env) {
  return runQueryAll<TeacherFeedbackRecord>(env, { from: COLLECTION })
}
