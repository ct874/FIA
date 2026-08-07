import { School } from '../models/school.model.js'
import { StudentFeedbackBatch } from '../models/studentFeedbackBatch.model.js'
import { StudentFeedback } from '../models/studentFeedback.model.js'
import { TeacherFeedback } from '../models/teacherFeedback.model.js'
import { getSchoolStatus, computeGradeFeedbackProgress } from './teacherStatus.service.js'
import { computeSchoolOverallStatus } from './schoolStatus.service.js'
import { sortByFeedbackHierarchy, sortBySchoolName } from '../utils/feedbackSort.js'

function buildStudentFeedbackRows(doc) {
  return doc.tours.map((tourAnswer) => ({
    grade: doc.grade,
    studentDummyId: doc.studentDummyId,
    tourId: tourAnswer.tourId,
    tourName: tourAnswer.tourName,
    language: tourAnswer.language,
    enjoyment: tourAnswer.enjoyment,
    overallExperience: tourAnswer.overallExperience,
    interestInFutureCareer: tourAnswer.interestInFutureCareer,
    wantExploreCareer: tourAnswer.wantExploreCareer,
    wantMoreTours: tourAnswer.wantMoreTours,
    month: doc.month,
    financialYear: doc.financialYear,
    createdAt: doc.createdAt,
  }))
}

function buildTeacherFeedbackRow(doc) {
  return {
    tourId: doc.tourId,
    tourName: doc.tourName,
    language: doc.language,
    submittedBy: doc.submittedBy,
    contactNumber: doc.contactNumber,
    email: doc.email || '',
    recommendScore: doc.recommendScore,
    satisfactionResources: doc.satisfactionResources,
    easeIntegration: doc.easeIntegration,
    biggestBenefit: doc.biggestBenefit,
    improvements: doc.improvements,
    month: doc.month,
    financialYear: doc.financialYear,
    createdAt: doc.createdAt,
  }
}

// Every school's real feedback-batch/student-feedback/teacher-feedback data,
// in the same raw shape the Teacher Portal itself uses — the Admin panel
// derives every dashboard number, table row, and export row from this single
// source. `feedbackBatches` (grade/tours/language/target/submittedCount) is
// exactly computeGradeFeedbackProgress()'s own output — no separate lookup
// needed since StudentFeedbackBatch already carries everything.
export async function getSchoolsOverview() {
  // Level 1 of the required hierarchy: one school's entire data finishes
  // before the next school begins, in a fixed (alphabetical) school order.
  const schools = sortBySchoolName(await School.find(), (school) => school.schoolName)

  return Promise.all(
    schools.map(async (school) => {
      const [status, gradeProgress, studentDocs, teacherDocs] = await Promise.all([
        getSchoolStatus(school._id),
        computeGradeFeedbackProgress(school._id),
        StudentFeedback.find({ school: school._id }),
        TeacherFeedback.find({ school: school._id }),
      ])

      const studentFeedback = sortByFeedbackHierarchy(studentDocs.flatMap(buildStudentFeedbackRows), (row) => ({
        schoolName: school.schoolName,
        grade: row.grade,
        type: 'Student',
        identifier: row.studentDummyId,
        tourId: row.tourId,
      }))
      const teacherFeedback = sortByFeedbackHierarchy(teacherDocs.map(buildTeacherFeedbackRow), (row) => ({
        schoolName: school.schoolName,
        grade: null,
        type: 'Teacher',
        identifier: row.email || row.submittedBy,
        tourId: row.tourId,
      }))

      return {
        id: school._id,
        udise: school.udise,
        schoolName: school.schoolName,
        district: school.district,
        state: school.state,
        createdAt: school.createdAt,
        status,
        overallStatus: computeSchoolOverallStatus(status),
        feedbackBatches: gradeProgress,
        studentFeedback,
        teacherFeedback,
      }
    }),
  )
}

function buildTeacherActivityRows(teacherDocs) {
  return teacherDocs.map((doc) => ({
    id: `teacher-${doc._id}`,
    type: 'Teacher',
    school: doc.schoolName,
    tour: doc.tourName,
    tourId: doc.tourId,
    identifier: doc.email || doc.submittedBy,
    grade: null,
    month: doc.month,
    time: doc.createdAt,
    csat: null,
  }))
}

function buildStudentActivityRows(studentDocs) {
  const rows = []
  studentDocs.forEach((doc) => {
    doc.tours.forEach((tourAnswer) => {
      rows.push({
        id: `student-${doc._id}-${tourAnswer.tourId}`,
        type: 'Student',
        school: doc.schoolName,
        tour: tourAnswer.tourName,
        tourId: tourAnswer.tourId,
        identifier: doc.studentDummyId,
        grade: doc.grade,
        month: doc.month,
        time: doc.createdAt,
        csat: tourAnswer.enjoyment,
      })
    })
  })
  return rows
}

// Cross-school activity log for the Admin "All Submissions" page — the same
// idea as the per-school Teacher Portal responses list, without the
// school scope.
export async function getAdminSubmissions() {
  const [teacherDocs, studentDocs] = await Promise.all([TeacherFeedback.find(), StudentFeedback.find()])

  // School -> Grade -> Student/Teacher -> Career Tour, per the required
  // hierarchy — replaces the old chronological ("time") ordering.
  const rows = sortByFeedbackHierarchy([...buildTeacherActivityRows(teacherDocs), ...buildStudentActivityRows(studentDocs)], (row) => ({
    schoolName: row.school,
    grade: row.grade,
    type: row.type,
    identifier: row.identifier,
    tourId: row.tourId,
  }))

  return { rows }
}

// Admin "Delete All Feedback Data" — clears every real submission while
// leaving registered schools (and their Teacher Portal logins) intact.
export async function deleteAllProgramData() {
  await Promise.all([StudentFeedbackBatch.deleteMany({}), StudentFeedback.deleteMany({}), TeacherFeedback.deleteMany({})])
}
