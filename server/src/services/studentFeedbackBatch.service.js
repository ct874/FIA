import { StudentFeedbackBatch } from '../models/studentFeedbackBatch.model.js'
import { ENABLED_TOURS } from '../constants/tours.js'
import { GRADES } from '../constants/grades.js'
import { getCurrentMonthName, getCurrentFinancialYear } from '../utils/academicPeriod.js'
import { ApiError } from '../utils/ApiError.js'

// Every Student Feedback batch now always covers every currently-enabled
// Career Tour — teachers no longer choose which tours were shown, the
// platform assumes every class watched all of them. This is the single
// place that decides that, in ENABLED_TOURS' own canonical order (AWS ->
// Robotics -> Music), so no caller/API needs to send (or can override) a
// tour selection.
const ALL_TOURS = ENABLED_TOURS.map((tour) => ({ tourId: tour.tourId, tourName: tour.tourName }))

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

// Starts (or tops up) the Student Feedback batch for a grade — how many
// students' feedback the teacher intends to collect. Every batch
// automatically covers all of ALL_TOURS — there is no tour selection to
// accept or validate here anymore (any `tourIds` a caller still sends is
// simply ignored; nothing depends on it). Repeat submissions for the same
// grade never overwrite or get rejected — they merge into the same
// document: student count adds up, tours union (no duplicates, and picks up
// any newly-enabled tour on a later top-up), and month/financialYear move
// forward to the latest submission.
// `language` is no longer collected from the teacher (the "In which
// language did students watch the Career Tour?" question was removed from
// the Start Feedback form) — still accepted here and passed through as-is
// if an older/other caller happens to send one, but never required, and
// never overwrites an already-stored value with a blank one on top-up.
export async function startStudentFeedbackBatch(school, { grade, studentCount, language }) {
  const normalizedGrade = String(grade ?? '').trim()
  if (!normalizedGrade || !GRADES.includes(normalizedGrade)) {
    throw new ApiError(400, 'Please select a valid grade.')
  }
  if (!Number.isFinite(Number(studentCount)) || Number(studentCount) <= 0) {
    throw new ApiError(400, 'Enter the number of students.')
  }

  const month = getCurrentMonthName()
  const financialYear = getCurrentFinancialYear()

  const existing = await StudentFeedbackBatch.findOne({ school: school._id, grade: normalizedGrade })

  if (existing) {
    existing.studentCount += Number(studentCount)
    existing.tours = unionTours(existing.tours, ALL_TOURS)
    if (language) existing.language = language
    existing.month = month
    existing.financialYear = financialYear
    await existing.save()
    return existing.toSafeJSON()
  }

  const created = await StudentFeedbackBatch.create({
    school: school._id,
    udise: school.udise,
    schoolName: school.schoolName,
    grade: normalizedGrade,
    studentCount: Number(studentCount),
    tours: ALL_TOURS,
    language: language || '',
    month,
    financialYear,
  })

  return created.toSafeJSON()
}
