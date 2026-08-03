import { TeacherFeedback } from '../models/teacherFeedback.model.js'
import { StudentReach } from '../models/studentReach.model.js'
import { StudentFeedback } from '../models/studentFeedback.model.js'
import { TOURS } from '../constants/tours.js'
import { STUDENT_FEEDBACK_TARGET_RATE } from '../constants/grades.js'

function gradeTarget(uniqueStudentCount) {
  return Math.max(1, Math.ceil(uniqueStudentCount * STUDENT_FEEDBACK_TARGET_RATE))
}

// Every submitted-count/target computation used by both the status flags and
// the Student Feedback grade cards, so the two views can never drift apart.
export async function computeGradeFeedbackProgress(schoolId) {
  const [reachRecords, feedbackDocs] = await Promise.all([
    StudentReach.find({ school: schoolId }),
    StudentFeedback.find({ school: schoolId }).select('grade'),
  ])

  const submittedByGrade = new Map()
  feedbackDocs.forEach((doc) => {
    submittedByGrade.set(doc.grade, (submittedByGrade.get(doc.grade) || 0) + 1)
  })

  return reachRecords.map((reach) => {
    const target = gradeTarget(reach.uniqueStudentCount)
    const submittedCount = submittedByGrade.get(reach.grade) || 0
    return {
      grade: reach.grade,
      studentsReached: reach.studentsReached,
      uniqueStudentCount: reach.uniqueStudentCount,
      tours: reach.tours,
      target,
      submittedCount,
      targetMet: submittedCount >= target,
    }
  })
}

export async function getSchoolStatus(schoolId) {
  const [teacherFeedbackCount, gradeProgress] = await Promise.all([
    TeacherFeedback.countDocuments({ school: schoolId }),
    computeGradeFeedbackProgress(schoolId),
  ])

  const teacherFeedbackCompleted = teacherFeedbackCount >= TOURS.length
  const reachSubmitted = gradeProgress.length > 0
  const studentFeedbackCompleted =
    reachSubmitted && gradeProgress.every((grade) => grade.targetMet)

  return { teacherFeedbackCompleted, reachSubmitted, studentFeedbackCompleted }
}

export async function getDashboardOverview(schoolId) {
  const [reachRecords, responsesCount, latestFeedback] = await Promise.all([
    StudentReach.find({ school: schoolId }),
    StudentFeedback.countDocuments({ school: schoolId }),
    TeacherFeedback.findOne({ school: schoolId }).sort({ createdAt: -1 }),
  ])

  const totalStudentsReached = reachRecords.reduce((sum, r) => sum + r.studentsReached, 0)
  const totalExperiences = reachRecords.reduce(
    (sum, r) => sum + r.studentsReached * Math.max(1, r.tours.length),
    0,
  )

  return {
    totalStudentsReached,
    totalExperiences,
    totalResponses: responsesCount,
    teacherFormSubmittedBy: latestFeedback ? latestFeedback.submittedBy : null,
  }
}
