import { StudentReach } from '../models/studentReach.model.js'
import { TOUR_BY_ID } from '../constants/tours.js'
import { GRADES } from '../constants/grades.js'
import { getCurrentMonthName, getCurrentFinancialYear } from '../utils/academicPeriod.js'
import { ApiError } from '../utils/ApiError.js'

export async function listStudentReach(schoolId) {
  const docs = await StudentReach.find({ school: schoolId }).sort({ grade: 1 })
  return docs.map((doc) => doc.toSafeJSON())
}

function unionTours(existingTours, incomingTours) {
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

// Repeat submissions for a grade never overwrite or get rejected — they
// merge into the same document: student counts add up, tours union (no
// duplicates), and month/financialYear move forward to the latest submission.
export async function submitStudentReach(
  school,
  { grade, studentsReached, uniqueStudentCount, tourIds, language },
) {
  const normalizedGrade = String(grade ?? '').trim()
  if (!normalizedGrade || !GRADES.includes(normalizedGrade)) {
    throw new ApiError(400, 'Please select a valid grade.')
  }
  if (!Number.isFinite(Number(studentsReached)) || Number(studentsReached) <= 0) {
    throw new ApiError(400, 'Enter the number of students reached.')
  }
  if (!Number.isFinite(Number(uniqueStudentCount)) || Number(uniqueStudentCount) < 0) {
    throw new ApiError(400, 'Enter the total unique student count.')
  }
  if (!Array.isArray(tourIds) || tourIds.length === 0) {
    throw new ApiError(400, 'Select at least one Career Tour.')
  }

  const incomingTours = tourIds.map((tourId) => {
    const tour = TOUR_BY_ID.get(tourId)
    if (!tour) throw new ApiError(400, `Unknown tour: ${tourId}`)
    return { tourId: tour.tourId, tourName: tour.tourName }
  })

  const month = getCurrentMonthName()
  const financialYear = getCurrentFinancialYear()

  const existing = await StudentReach.findOne({ school: school._id, grade: normalizedGrade })

  if (existing) {
    existing.studentsReached += Number(studentsReached)
    existing.uniqueStudentCount += Number(uniqueStudentCount)
    existing.tours = unionTours(existing.tours, incomingTours)
    existing.month = month
    existing.financialYear = financialYear
    if (language) existing.language = language
    await existing.save()
    return existing.toSafeJSON()
  }

  const created = await StudentReach.create({
    school: school._id,
    udise: school.udise,
    schoolName: school.schoolName,
    grade: normalizedGrade,
    studentsReached: Number(studentsReached),
    uniqueStudentCount: Number(uniqueStudentCount),
    tours: incomingTours,
    language,
    month,
    financialYear,
  })

  return created.toSafeJSON()
}
