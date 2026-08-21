// Ported from server/src/services/teacherStatus.service.js. `schoolId`
// throughout is now the school's UDISE. `getSchoolStatusFromProgress` takes
// an explicit `enabledTourCount` parameter instead of reading the original's
// module-level `ENABLED_TOURS.length` — see services/tourCatalog.service.ts.
import type { Env } from '../env'
import { listBatchesForSchool, type StudentFeedbackBatchRecord, type TourRefRecord } from '../repositories/studentFeedbackBatches.repository'
import { listStudentFeedbackForSchool } from '../repositories/studentFeedbacks.repository'
import { listTeacherFeedbackForSchool, countTeacherFeedbackForSchool } from '../repositories/teacherFeedbacks.repository'
import { findSchoolByUdise } from '../repositories/schools.repository'
import { computeRequiredFeedbackCount, STUDENT_FEEDBACK_TARGET_RATE } from '../utils/studentFeedbackTarget'
import { getTargetPercentForDistrict } from './districtFeedbackTarget.service'
import { getGradeRank } from '../utils/feedbackSort'
import { REQUIRED_GRADES, type SchoolCompletionStatus } from './schoolStatus.service'
import { ApiError } from '../utils/ApiError'

export interface GradeFeedbackProgress {
  grade: string
  tours: TourRefRecord[]
  language: string
  month: string
  financialYear: string
  createdAt: string
  totalStudents: number
  target: number
  targetPercent: number
  submittedCount: number
  targetMet: boolean
}

// Pure version — takes already-fetched batch/feedback records instead of
// querying itself, so callers that already hold everything in memory (e.g.
// afeExport.service.ts) can reuse this exact rule without extra queries.
export function computeGradeFeedbackProgressFromDocs(
  batchRecords: StudentFeedbackBatchRecord[],
  feedbackDocs: Array<{ grade: string }>,
  targetPercent?: number | null,
): GradeFeedbackProgress[] {
  const submittedByGrade = new Map<string, number>()
  feedbackDocs.forEach((doc) => {
    submittedByGrade.set(doc.grade, (submittedByGrade.get(doc.grade) || 0) + 1)
  })
  const resolvedTargetPercent = targetPercent ?? STUDENT_FEEDBACK_TARGET_RATE * 100

  return batchRecords
    .map((batch) => {
      const target = computeRequiredFeedbackCount(batch.studentCount, resolvedTargetPercent)
      const submittedCount = submittedByGrade.get(batch.grade) || 0
      return {
        grade: batch.grade,
        tours: batch.tours,
        language: batch.language,
        month: batch.month,
        financialYear: batch.financialYear,
        createdAt: batch.createdAt,
        totalStudents: batch.studentCount,
        target,
        targetPercent: resolvedTargetPercent,
        submittedCount,
        targetMet: submittedCount >= target,
      }
    })
    .sort((a, b) => getGradeRank(a.grade) - getGradeRank(b.grade))
}

export async function computeGradeFeedbackProgress(env: Env, udise: string): Promise<GradeFeedbackProgress[]> {
  const [batchDocs, feedbackDocs, school] = await Promise.all([
    listBatchesForSchool(env, udise),
    listStudentFeedbackForSchool(env, udise),
    findSchoolByUdise(env, udise),
  ])
  const targetPercent = await getTargetPercentForDistrict(env, school?.data.district)

  return computeGradeFeedbackProgressFromDocs(
    batchDocs.map((doc) => doc.data),
    feedbackDocs.map((doc) => ({ grade: doc.data.grade })),
    targetPercent,
  )
}

// Pure version of getSchoolStatus() below.
export function getSchoolStatusFromProgress(
  teacherFeedbackCount: number,
  gradeProgress: GradeFeedbackProgress[],
  enabledTourCount: number,
): SchoolCompletionStatus {
  // `enabledTourCount > 0` guards against the classic empty-array vacuous-
  // truth bug: `0 >= 0` is `true` in JS, so a school with ZERO submitted
  // teacher feedback records must never read as "completed" just because
  // the live tour catalog also happened to resolve to zero enabled tours
  // (e.g. a brand-new school queried before the Firestore `tours`
  // collection is seeded/available). No enabled tours means teacher
  // feedback cannot possibly be complete yet, full stop.
  const teacherFeedbackCompleted = enabledTourCount > 0 && teacherFeedbackCount >= enabledTourCount

  // Student Feedback is only "completed" once EVERY required grade (6-12)
  // has a batch AND has met its target — not just whatever grades happen
  // to exist so far (a school that only ever started Grade 6, even fully
  // met, must not read as done here).
  const gradesWithBatches = new Set(gradeProgress.map((grade) => grade.grade))
  const allRequiredGradesPresent = REQUIRED_GRADES.every((grade) => gradesWithBatches.has(grade))
  const requiredGradeProgress = gradeProgress.filter((grade) => REQUIRED_GRADES.includes(grade.grade))
  const studentFeedbackCompleted = allRequiredGradesPresent && requiredGradeProgress.every((grade) => grade.targetMet)

  return { teacherFeedbackCompleted, studentFeedbackCompleted }
}

export async function getSchoolStatus(env: Env, udise: string, enabledTourCount: number): Promise<SchoolCompletionStatus> {
  const [teacherFeedbackCount, gradeProgress] = await Promise.all([
    countTeacherFeedbackForSchool(env, udise),
    computeGradeFeedbackProgress(env, udise),
  ])

  return getSchoolStatusFromProgress(teacherFeedbackCount, gradeProgress, enabledTourCount)
}

// Backend gate for every Student Feedback write (starting a batch,
// submitting a student's feedback) — re-derived from real Firestore data on
// every call, never trusted from the frontend. This is the server-side half
// of Step 4/5 of the required workflow: Student Feedback must be rejected
// with a clear error until Teacher Feedback has actually been completed for
// this school, no matter what the UI already gated on or bypassed.
export async function assertTeacherFeedbackCompleted(env: Env, udise: string, enabledTourCount: number): Promise<void> {
  const teacherFeedbackCount = await countTeacherFeedbackForSchool(env, udise)
  const teacherFeedbackCompleted = enabledTourCount > 0 && teacherFeedbackCount >= enabledTourCount
  if (!teacherFeedbackCompleted) {
    throw new ApiError(403, 'Please complete Teacher Feedback before submitting Student Feedback.')
  }
}

export async function getDashboardOverview(env: Env, udise: string) {
  const [batchDocs, responsesCount, teacherDocs] = await Promise.all([
    listBatchesForSchool(env, udise),
    (await listStudentFeedbackForSchool(env, udise)).length,
    listTeacherFeedbackForSchool(env, udise),
  ])

  const batchRecords = batchDocs.map((doc) => doc.data)
  const totalStudentsTargeted = batchRecords.reduce((sum, batch) => sum + batch.studentCount, 0)
  const totalExperiences = batchRecords.reduce((sum, batch) => sum + batch.studentCount * Math.max(1, batch.tours.length), 0)

  const latestFeedback = teacherDocs
    .map((doc) => doc.data)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  return {
    totalStudentsTargeted,
    totalExperiences,
    totalResponses: responsesCount,
    teacherFormSubmittedBy: latestFeedback ? latestFeedback.submittedBy : null,
  }
}
