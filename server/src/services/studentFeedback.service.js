import crypto from 'node:crypto'
import { StudentFeedback } from '../models/studentFeedback.model.js'
import { StudentReach } from '../models/studentReach.model.js'
import { TOUR_BY_ID } from '../constants/tours.js'
import { computeGradeFeedbackProgress } from './teacherStatus.service.js'
import { getCurrentMonthName, getCurrentFinancialYear } from '../utils/academicPeriod.js'
import { ApiError } from '../utils/ApiError.js'

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

  const reachRecord = await StudentReach.findOne({ school: school._id, grade: normalizedGrade })
  if (!reachRecord) {
    throw new ApiError(400, `No Student Reach data found for Grade ${normalizedGrade} yet.`)
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
      wantExploreCareer: Boolean(answer.wantExploreCareer),
      wantMoreTours: Boolean(answer.wantMoreTours),
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
