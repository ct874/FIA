import crypto from 'node:crypto'
import { StudentFeedback } from '../models/studentFeedback.model.js'
import { StudentFeedbackBatch } from '../models/studentFeedbackBatch.model.js'
import { TOUR_BY_ID } from '../constants/tours.js'
import { computeGradeFeedbackProgress } from './teacherStatus.service.js'
import { computeRequiredFeedbackCount } from '../utils/studentFeedbackTarget.js'
import { getCurrentMonthName, getCurrentFinancialYear } from '../utils/academicPeriod.js'
import { ApiError } from '../utils/ApiError.js'

const YES_NO_MAYBE = ['Yes', 'No', 'Maybe']

// Accepts the current 'Yes'/'No'/'Maybe' string answers, and — for backward
// compatibility with any older client still sending real booleans — maps
// true/false to 'Yes'/'No' so existing callers don't break.
function normalizeYesNoMaybe(value, fieldLabel) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  if (YES_NO_MAYBE.includes(value)) return value
  throw new ApiError(400, `${fieldLabel} must be one of: ${YES_NO_MAYBE.join(', ')}.`)
}

export async function getStudentFeedbackSummary(schoolId) {
  return computeGradeFeedbackProgress(schoolId)
}

export async function submitStudentFeedback(school, { grade, tours }) {
  const normalizedGrade = String(grade ?? '').trim()
  if (!normalizedGrade) {
    throw new ApiError(400, 'Grade is required.')
  }
  if (!Array.isArray(tours) || tours.length === 0) {
    throw new ApiError(400, 'At least one tour response is required.')
  }

  const batch = await StudentFeedbackBatch.findOne({ school: school._id, grade: normalizedGrade })
  if (!batch) {
    throw new ApiError(400, `Start a Student Feedback batch for Grade ${normalizedGrade} first.`)
  }

  // Never trust the frontend's own gating alone — only 40% of the class may
  // give feedback, so re-check against the real submitted count on every
  // request, even if someone bypasses the UI entirely.
  const requiredCount = computeRequiredFeedbackCount(batch.studentCount)
  const submittedCount = await StudentFeedback.countDocuments({ school: school._id, grade: normalizedGrade })
  if (submittedCount >= requiredCount) {
    throw new ApiError(409, 'Required student feedback for this class has already been completed.')
  }

  const tourAnswers = tours.map((answer) => {
    const tour = TOUR_BY_ID.get(answer.tourId)
    if (!tour) throw new ApiError(400, `Unknown tour: ${answer.tourId}`)
    return {
      tourId: tour.tourId,
      tourName: tour.tourName,
      language: answer.language,
      enjoyment: answer.enjoyment,
      overallExperience: answer.overallExperience,
      interestInFutureCareer: answer.interestInFutureCareer,
      wantExploreCareer: normalizeYesNoMaybe(answer.wantExploreCareer, 'wantExploreCareer'),
      wantMoreTours: normalizeYesNoMaybe(answer.wantMoreTours, 'wantMoreTours'),
    }
  })

  const created = await StudentFeedback.create({
    school: school._id,
    udise: school.udise,
    schoolName: school.schoolName,
    grade: normalizedGrade,
    studentDummyId: crypto.randomUUID(),
    month: getCurrentMonthName(),
    financialYear: getCurrentFinancialYear(),
    tours: tourAnswers,
  })

  return created.toSafeJSON()
}
