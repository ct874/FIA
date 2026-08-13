// Ported from server/src/services/teacherFeedback.service.js. Uniqueness:
// one submission SESSION per school, ever (existingCount > 0 check) — a
// session creates one document per currently-enabled tour.
import type { Env } from '../env'
import { listTeacherFeedbackForSchool, countTeacherFeedbackForSchool, createTeacherFeedback } from '../repositories/teacherFeedbacks.repository'
import { getCurrentMonthName, getCurrentFinancialYear } from '../utils/academicPeriod'
import { ApiError } from '../utils/ApiError'
import { sortByFeedbackHierarchy } from '../utils/feedbackSort'
import type { TourCatalog } from '../constants/tours'
import type { SchoolRecord } from '../repositories/schools.repository'
import type { DecodedDocument } from '../firestore/codec'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email: unknown): string {
  const trimmed = String(email ?? '').trim().toLowerCase()
  if (!trimmed || !EMAIL_PATTERN.test(trimmed)) {
    throw new ApiError(400, 'Please enter a valid email address.')
  }
  return trimmed
}

export async function listTeacherFeedback(env: Env, udise: string) {
  const docs = await listTeacherFeedbackForSchool(env, udise)
  const sorted = sortByFeedbackHierarchy(docs, (doc) => ({
    schoolName: doc.data.schoolName,
    grade: null,
    type: 'Teacher' as const,
    identifier: doc.data.email || doc.data.submittedBy,
    tourId: doc.data.tourId,
  }))
  return sorted.map((doc) => ({
    id: doc.id,
    udise: doc.data.udise,
    schoolName: doc.data.schoolName,
    tourId: doc.data.tourId,
    tourName: doc.data.tourName,
    language: doc.data.language,
    submittedBy: doc.data.submittedBy,
    contactNumber: doc.data.contactNumber,
    email: doc.data.email,
    month: doc.data.month,
    financialYear: doc.data.financialYear,
    recommendScore: doc.data.recommendScore,
    satisfactionResources: doc.data.satisfactionResources,
    easeIntegration: doc.data.easeIntegration,
    biggestBenefit: doc.data.biggestBenefit,
    improvements: doc.data.improvements,
    createdAt: doc.data.createdAt,
  }))
}

interface SubmitTeacherFeedbackInput {
  submittedBy: unknown
  contactNumber?: unknown
  email: unknown
  tours: unknown
}

export async function submitTeacherFeedback(
  env: Env,
  school: DecodedDocument<SchoolRecord>,
  input: SubmitTeacherFeedbackInput,
  tourCatalog: TourCatalog,
) {
  if (!input.submittedBy || !String(input.submittedBy).trim()) {
    throw new ApiError(400, 'Your name is required.')
  }
  const normalizedEmail = normalizeEmail(input.email)
  const tours = input.tours as Array<Record<string, unknown>>
  if (!Array.isArray(tours) || tours.length !== tourCatalog.tourIds.length) {
    throw new ApiError(400, `Feedback for all ${tourCatalog.tourIds.length} Career Tours is required.`)
  }

  const existingCount = await countTeacherFeedbackForSchool(env, school.data.udise)
  if (existingCount > 0) {
    throw new ApiError(409, 'Teacher Feedback has already been submitted.')
  }

  const month = getCurrentMonthName()
  const financialYear = getCurrentFinancialYear()

  const docsToCreate = tours.map((tourAnswer) => {
    const tour = tourCatalog.tourById.get(String(tourAnswer.tourId))
    if (!tour) {
      throw new ApiError(400, `Unknown tour: ${tourAnswer.tourId}`)
    }
    return {
      udise: school.data.udise,
      schoolName: school.data.schoolName,
      tourId: tour.tourId,
      tourName: tour.tourName,
      language: tourAnswer.language as string,
      submittedBy: String(input.submittedBy).trim(),
      contactNumber: input.contactNumber ? String(input.contactNumber).trim() : '',
      email: normalizedEmail,
      month,
      financialYear,
      recommendScore: tourAnswer.recommendScore as number,
      satisfactionResources: tourAnswer.satisfactionResources as number,
      easeIntegration: tourAnswer.easeIntegration as number,
      biggestBenefit: tourAnswer.biggestBenefit ? String(tourAnswer.biggestBenefit).trim() : '',
      improvements: tourAnswer.improvements ? String(tourAnswer.improvements).trim() : '',
    }
  })

  // Sequential (not Promise.all) — at most a handful of enabled tours, but
  // keeps subrequest usage predictable and lets createDoc's 409-on-conflict
  // behave as a clean per-doc guard rather than a racing batch.
  const created = []
  for (const doc of docsToCreate) {
    created.push(await createTeacherFeedback(env, doc))
  }

  return created.map((doc) => ({
    id: doc.id,
    udise: doc.data.udise,
    schoolName: doc.data.schoolName,
    tourId: doc.data.tourId,
    tourName: doc.data.tourName,
    language: doc.data.language,
    submittedBy: doc.data.submittedBy,
    contactNumber: doc.data.contactNumber,
    email: doc.data.email,
    month: doc.data.month,
    financialYear: doc.data.financialYear,
    recommendScore: doc.data.recommendScore,
    satisfactionResources: doc.data.satisfactionResources,
    easeIntegration: doc.data.easeIntegration,
    biggestBenefit: doc.data.biggestBenefit,
    improvements: doc.data.improvements,
    createdAt: doc.data.createdAt,
  }))
}
