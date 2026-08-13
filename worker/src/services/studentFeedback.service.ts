// Ported from server/src/services/studentFeedback.service.js. THE hard
// business rule of this whole app: the 40% quota is recomputed from live
// Firestore data on every single submission and enforced here — never
// trusts whatever the frontend already gated on.
import type { Env } from '../env'
import { findSchoolByUdise, claimNextStudentDummySequence, type SchoolRecord } from '../repositories/schools.repository'
import { findBatch } from '../repositories/studentFeedbackBatches.repository'
import { countStudentFeedbackForSchoolGrade, createStudentFeedback } from '../repositories/studentFeedbacks.repository'
import { computeGradeFeedbackProgress } from './teacherStatus.service'
import { computeRequiredFeedbackCount } from '../utils/studentFeedbackTarget'
import { getTargetPercentForDistrict } from './districtFeedbackTarget.service'
import { formatStudentDummyId } from '../utils/studentDummyId'
import { getCurrentMonthName, getCurrentFinancialYear } from '../utils/academicPeriod'
import { ApiError } from '../utils/ApiError'
import type { TourCatalog } from '../constants/tours'
import type { DecodedDocument } from '../firestore/codec'

async function claimNextStudentDummyId(env: Env, school: DecodedDocument<SchoolRecord>): Promise<string> {
  const nextSequence = await claimNextStudentDummySequence(env, school.id)
  return formatStudentDummyId(school.data.schoolName, nextSequence)
}

const YES_NO_MAYBE = ['Yes', 'No', 'Maybe'] as const
type YesNoMaybe = (typeof YES_NO_MAYBE)[number]

// Accepts the current Yes/No/Maybe strings, plus real booleans for
// backward compatibility with any older client still sending them.
function normalizeYesNoMaybe(value: unknown, fieldLabel: string): YesNoMaybe {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  if (typeof value === 'string' && (YES_NO_MAYBE as readonly string[]).includes(value)) return value as YesNoMaybe
  throw new ApiError(400, `${fieldLabel} must be one of: ${YES_NO_MAYBE.join(', ')}.`)
}

export async function getStudentFeedbackSummary(env: Env, udise: string) {
  return computeGradeFeedbackProgress(env, udise)
}

interface SubmitStudentFeedbackInput {
  grade: unknown
  tours: unknown
}

export async function submitStudentFeedback(
  env: Env,
  school: DecodedDocument<SchoolRecord>,
  input: SubmitStudentFeedbackInput,
  tourCatalog: TourCatalog,
) {
  const normalizedGrade = String(input.grade ?? '').trim()
  if (!normalizedGrade) {
    throw new ApiError(400, 'Grade is required.')
  }
  if (!Array.isArray(input.tours) || input.tours.length === 0) {
    throw new ApiError(400, 'At least one tour response is required.')
  }

  const batch = await findBatch(env, school.data.udise, normalizedGrade)
  if (!batch) {
    throw new ApiError(400, `Start a Student Feedback batch for Grade ${normalizedGrade} first.`)
  }

  // Never trust the frontend's own gating alone — re-check against the
  // real submitted count on every request, even if someone bypasses the UI
  // entirely. This is the 40% rule (district-overridable), enforced
  // server-side, unconditionally, on every submission.
  const targetPercent = await getTargetPercentForDistrict(env, school.data.district)
  const requiredCount = computeRequiredFeedbackCount(batch.data.studentCount, targetPercent)
  const submittedCount = await countStudentFeedbackForSchoolGrade(env, school.data.udise, normalizedGrade)
  if (submittedCount >= requiredCount) {
    throw new ApiError(409, 'Required student feedback for this class has already been completed.')
  }

  const tours = input.tours as Array<Record<string, unknown>>
  const tourAnswers = tours.map((answer) => {
    const tour = tourCatalog.tourById.get(String(answer.tourId))
    if (!tour) throw new ApiError(400, `Unknown tour: ${answer.tourId}`)
    return {
      tourId: tour.tourId,
      tourName: tour.tourName,
      language: answer.language as string | undefined,
      enjoyment: answer.enjoyment as number,
      overallExperience: answer.overallExperience as number,
      interestInFutureCareer: answer.interestInFutureCareer as number,
      wantExploreCareer: normalizeYesNoMaybe(answer.wantExploreCareer, 'wantExploreCareer'),
      wantMoreTours: normalizeYesNoMaybe(answer.wantMoreTours, 'wantMoreTours'),
    }
  })

  const studentDummyId = await claimNextStudentDummyId(env, school)

  const created = await createStudentFeedback(env, {
    udise: school.data.udise,
    schoolName: school.data.schoolName,
    grade: normalizedGrade,
    studentDummyId,
    month: getCurrentMonthName(),
    financialYear: getCurrentFinancialYear(),
    tours: tourAnswers,
  })

  return {
    id: created.id,
    udise: created.data.udise,
    schoolName: created.data.schoolName,
    grade: created.data.grade,
    studentDummyId: created.data.studentDummyId,
    month: created.data.month,
    financialYear: created.data.financialYear,
    tours: created.data.tours,
    createdAt: created.data.createdAt,
  }
}
