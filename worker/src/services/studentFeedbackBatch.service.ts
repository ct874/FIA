// Ported from server/src/services/studentFeedbackBatch.service.js. Every
// batch always covers every currently-enabled Career Tour (no tour
// selection accepted). Repeat "Start Feedback" submissions for the same
// (school, grade) MERGE into the same document — studentCount adds up,
// tours union (dedupe by tourId, picks up newly-enabled tours),
// month/financialYear move forward.
import type { Env } from '../env'
import { findBatch, putBatch, type TourRefRecord } from '../repositories/studentFeedbackBatches.repository'
import { GRADES } from '../constants/grades'
import { getCurrentMonthName, getCurrentFinancialYear } from '../utils/academicPeriod'
import { ApiError } from '../utils/ApiError'
import { assertTeacherFeedbackCompleted } from './teacherStatus.service'
import type { TourCatalog } from '../constants/tours'
import type { SchoolRecord } from '../repositories/schools.repository'
import type { DecodedDocument } from '../firestore/codec'

function getAllTours(tourCatalog: TourCatalog): TourRefRecord[] {
  return tourCatalog.enabledTours.map((tour) => ({ tourId: tour.tourId, tourName: tour.tourName }))
}

// Dedupes by tourId only (never by whole-object equality) — this is what
// makes the union correct even if a tour's `tourName` were ever to differ
// slightly between the stored ref and the live catalog (e.g. a rename):
// the ID is the identity, the name is just carried along for display.
function unionTours(existingTours: TourRefRecord[], incomingTours: TourRefRecord[]): TourRefRecord[] {
  const merged = [...existingTours]
  const seenTourIds = new Set(existingTours.map((tour) => tour.tourId))

  incomingTours.forEach((tour) => {
    if (!seenTourIds.has(tour.tourId)) {
      merged.push(tour)
      seenTourIds.add(tour.tourId)
    }
  })

  return merged
}

interface StartBatchInput {
  grade: unknown
  studentCount: unknown
  language?: unknown
}

export async function startStudentFeedbackBatch(
  env: Env,
  school: DecodedDocument<SchoolRecord>,
  input: StartBatchInput,
  tourCatalog: TourCatalog,
) {
  // Student Feedback (starting a batch counts as Student Feedback, not just
  // the final per-student submission) is locked server-side until this
  // school's Teacher Feedback is actually complete — never trust the
  // frontend's own gating alone.
  await assertTeacherFeedbackCompleted(env, school.data.udise, tourCatalog.tourIds.length)

  const normalizedGrade = String(input.grade ?? '').trim()
  if (!normalizedGrade || !GRADES.includes(normalizedGrade)) {
    throw new ApiError(400, 'Please select a valid grade.')
  }
  const studentCountNum = Number(input.studentCount)
  if (!Number.isFinite(studentCountNum) || studentCountNum <= 0) {
    throw new ApiError(400, 'Enter the number of students.')
  }

  const month = getCurrentMonthName()
  const financialYear = getCurrentFinancialYear()
  const language = typeof input.language === 'string' ? input.language : undefined

  const existing = await findBatch(env, school.data.udise, normalizedGrade)

  if (existing) {
    const updated = await putBatch(env, {
      udise: school.data.udise,
      schoolName: school.data.schoolName,
      grade: normalizedGrade,
      studentCount: existing.data.studentCount + studentCountNum,
      tours: unionTours(existing.data.tours, getAllTours(tourCatalog)),
      language: language || existing.data.language,
      month,
      financialYear,
      createdAt: existing.data.createdAt,
    })
    return toSafeJSON(updated.data)
  }

  const created = await putBatch(env, {
    udise: school.data.udise,
    schoolName: school.data.schoolName,
    grade: normalizedGrade,
    studentCount: studentCountNum,
    tours: getAllTours(tourCatalog),
    language: language || '',
    month,
    financialYear,
  })

  return toSafeJSON(created.data)
}

function toSafeJSON(batch: {
  udise: string
  schoolName: string
  grade: string
  studentCount: number
  tours: TourRefRecord[]
  language: string
  month: string
  financialYear: string
  createdAt: string
}) {
  return {
    udise: batch.udise,
    schoolName: batch.schoolName,
    grade: batch.grade,
    studentCount: batch.studentCount,
    tours: batch.tours,
    language: batch.language,
    month: batch.month,
    financialYear: batch.financialYear,
    createdAt: batch.createdAt,
  }
}
