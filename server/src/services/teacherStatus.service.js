import { TeacherFeedback } from '../models/teacherFeedback.model.js'
import { StudentFeedbackBatch } from '../models/studentFeedbackBatch.model.js'
import { StudentFeedback } from '../models/studentFeedback.model.js'
import { ENABLED_TOURS } from '../constants/tours.js'
import { computeRequiredFeedbackCount } from '../utils/studentFeedbackTarget.js'
import { getGradeRank } from '../utils/feedbackSort.js'
import { REQUIRED_GRADES } from './schoolStatus.service.js'

// Every submitted-count/target computation used by both the status flags and
// the Student Feedback grade cards, so the two views can never drift apart.
// `target` is the REQUIRED feedback count — only 40% of the class
// (StudentFeedbackBatch.studentCount), per the project's Student Feedback
// rule — not the full class size. `totalStudents` is kept alongside it,
// unreduced, for anywhere that needs to show the real class size (e.g. "30
// Total Students, 12 Required").
export async function computeGradeFeedbackProgress(schoolId) {
  const [batchRecords, feedbackDocs] = await Promise.all([
    StudentFeedbackBatch.find({ school: schoolId }),
    StudentFeedback.find({ school: schoolId }).select('grade'),
  ])

  const submittedByGrade = new Map()
  feedbackDocs.forEach((doc) => {
    submittedByGrade.set(doc.grade, (submittedByGrade.get(doc.grade) || 0) + 1)
  })

  return batchRecords
    .map((batch) => {
      const target = computeRequiredFeedbackCount(batch.studentCount)
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
        submittedCount,
        targetMet: submittedCount >= target,
      }
    })
    .sort((a, b) => getGradeRank(a.grade) - getGradeRank(b.grade)) // Grade 6 -> Grade 12, per the required hierarchy
}

export async function getSchoolStatus(schoolId) {
  const [teacherFeedbackCount, gradeProgress] = await Promise.all([
    TeacherFeedback.countDocuments({ school: schoolId }),
    computeGradeFeedbackProgress(schoolId),
  ])

  const teacherFeedbackCompleted = teacherFeedbackCount >= ENABLED_TOURS.length

  // Student Feedback is only "completed" once EVERY required grade (6–12)
  // has a batch AND has met its 40% target — not just whatever grades
  // happen to exist so far. A school that only ever started Grade 6 (even
  // with that grade's target fully met) must not read as done here; that
  // used to be exactly this bug (gradeProgress.every() over a short array
  // is vacuously true for whatever few grades were present).
  const gradesWithBatches = new Set(gradeProgress.map((grade) => grade.grade))
  const allRequiredGradesPresent = REQUIRED_GRADES.every((grade) => gradesWithBatches.has(grade))
  const requiredGradeProgress = gradeProgress.filter((grade) => REQUIRED_GRADES.includes(grade.grade))
  const studentFeedbackCompleted = allRequiredGradesPresent && requiredGradeProgress.every((grade) => grade.targetMet)

  return { teacherFeedbackCompleted, studentFeedbackCompleted }
}

export async function getDashboardOverview(schoolId) {
  const [batchRecords, responsesCount, latestFeedback] = await Promise.all([
    StudentFeedbackBatch.find({ school: schoolId }),
    StudentFeedback.countDocuments({ school: schoolId }),
    TeacherFeedback.findOne({ school: schoolId }).sort({ createdAt: -1 }),
  ])

  const totalStudentsTargeted = batchRecords.reduce((sum, batch) => sum + batch.studentCount, 0)
  const totalExperiences = batchRecords.reduce(
    (sum, batch) => sum + batch.studentCount * Math.max(1, batch.tours.length),
    0,
  )

  return {
    totalStudentsTargeted,
    totalExperiences,
    totalResponses: responsesCount,
    teacherFormSubmittedBy: latestFeedback ? latestFeedback.submittedBy : null,
  }
}
