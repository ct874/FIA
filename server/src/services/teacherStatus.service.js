import { TeacherFeedback } from '../models/teacherFeedback.model.js'
import { StudentFeedbackBatch } from '../models/studentFeedbackBatch.model.js'
import { StudentFeedback } from '../models/studentFeedback.model.js'
import { School } from '../models/school.model.js'
import { ENABLED_TOURS } from '../constants/tours.js'
import { computeRequiredFeedbackCount, STUDENT_FEEDBACK_TARGET_RATE } from '../utils/studentFeedbackTarget.js'
import { getTargetPercentForDistrict } from './districtFeedbackTarget.service.js'
import { getGradeRank } from '../utils/feedbackSort.js'
import { REQUIRED_GRADES } from './schoolStatus.service.js'

// Pure version of computeGradeFeedbackProgress() below — takes already-
// fetched documents instead of querying itself, so callers that already
// hold every school's batches/feedback in memory (e.g.
// afeExport.service.js, which loads all schools' data in 4 queries total)
// can reuse this exact rule without an extra pair of queries per school.
// `feedbackDocs` only needs a `grade` field on each entry. `targetPercent`
// is the school's district-configured Student Feedback Target — omit it (or
// pass null/undefined) to fall back to the platform default (40%), exactly
// the same behavior as before districts became configurable.
export function computeGradeFeedbackProgressFromDocs(batchRecords, feedbackDocs, targetPercent) {
  const submittedByGrade = new Map()
  feedbackDocs.forEach((doc) => {
    submittedByGrade.set(doc.grade, (submittedByGrade.get(doc.grade) || 0) + 1)
  })
  const resolvedTargetPercent = targetPercent ?? STUDENT_FEEDBACK_TARGET_RATE * 100

  return batchRecords
    .map((batch) => {
      const target = computeRequiredFeedbackCount(batch.studentCount, resolvedTargetPercent)
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
        // The actual configured percent (not a value derived/rounded back
        // from target/totalStudents) — the Teacher Portal grade card
        // displays this directly (e.g. "Required (50%)").
        targetPercent: resolvedTargetPercent,
        submittedCount,
        targetMet: submittedCount >= target,
      }
    })
    .sort((a, b) => getGradeRank(a.grade) - getGradeRank(b.grade)) // Grade 6 -> Grade 12, per the required hierarchy
}

// Every submitted-count/target computation used by both the status flags and
// the Student Feedback grade cards, so the two views can never drift apart.
// `target` is the REQUIRED feedback count — the school's district-configured
// percentage of the class (StudentFeedbackBatch.studentCount), 40% for any
// district the Super Admin hasn't configured — not the full class size.
// `totalStudents` is kept alongside it, unreduced, for anywhere that needs
// to show the real class size (e.g. "30 Total Students, 12 Required").
export async function computeGradeFeedbackProgress(schoolId) {
  const [batchRecords, feedbackDocs, school] = await Promise.all([
    StudentFeedbackBatch.find({ school: schoolId }),
    StudentFeedback.find({ school: schoolId }).select('grade'),
    School.findById(schoolId).select('district'),
  ])
  const targetPercent = await getTargetPercentForDistrict(school?.district)

  return computeGradeFeedbackProgressFromDocs(batchRecords, feedbackDocs, targetPercent)
}

// Pure version of getSchoolStatus() below — see computeGradeFeedbackProgressFromDocs
// for why this split exists.
export function getSchoolStatusFromProgress(teacherFeedbackCount, gradeProgress) {
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

export async function getSchoolStatus(schoolId) {
  const [teacherFeedbackCount, gradeProgress] = await Promise.all([
    TeacherFeedback.countDocuments({ school: schoolId }),
    computeGradeFeedbackProgress(schoolId),
  ])

  return getSchoolStatusFromProgress(teacherFeedbackCount, gradeProgress)
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
