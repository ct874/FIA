import { TeacherFeedback } from '../models/teacherFeedback.model.js'
import { TOUR_BY_ID, TOUR_IDS } from '../constants/tours.js'
import { getCurrentMonthName, getCurrentFinancialYear } from '../utils/academicPeriod.js'
import { ApiError } from '../utils/ApiError.js'

export async function listTeacherFeedback(schoolId) {
  const docs = await TeacherFeedback.find({ school: schoolId }).sort({ createdAt: 1 })
  return docs.map((doc) => doc.toSafeJSON())
}

export async function submitTeacherFeedback(school, { submittedBy, contactNumber, tours }) {
  if (!submittedBy || !String(submittedBy).trim()) {
    throw new ApiError(400, 'Your name is required.')
  }
  if (!Array.isArray(tours) || tours.length !== TOUR_IDS.length) {
    throw new ApiError(400, `Feedback for all ${TOUR_IDS.length} Career Tours is required.`)
  }

  const existingCount = await TeacherFeedback.countDocuments({ school: school._id })
  if (existingCount > 0) {
    throw new ApiError(409, 'Teacher Feedback has already been submitted.')
  }

  const month = getCurrentMonthName()
  const financialYear = getCurrentFinancialYear()

  const docs = tours.map((tourAnswer) => {
    const tour = TOUR_BY_ID.get(tourAnswer.tourId)
    if (!tour) {
      throw new ApiError(400, `Unknown tour: ${tourAnswer.tourId}`)
    }
    return {
      school: school._id,
      udise: school.udise,
      schoolName: school.schoolName,
      tourId: tour.tourId,
      tourName: tour.tourName,
      language: tourAnswer.language,
      submittedBy: String(submittedBy).trim(),
      contactNumber: contactNumber ? String(contactNumber).trim() : '',
      month,
      financialYear,
      recommendScore: tourAnswer.recommendScore,
      satisfactionResources: tourAnswer.satisfactionResources,
      easeIntegration: tourAnswer.easeIntegration,
      biggestBenefit: tourAnswer.biggestBenefit ? String(tourAnswer.biggestBenefit).trim() : '',
      improvements: tourAnswer.improvements ? String(tourAnswer.improvements).trim() : '',
    }
  })

  const created = await TeacherFeedback.insertMany(docs)
  return created.map((doc) => doc.toSafeJSON())
}
