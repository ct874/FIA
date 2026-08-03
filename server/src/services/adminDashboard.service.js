import { School } from '../models/school.model.js'
import { StudentReach } from '../models/studentReach.model.js'
import { StudentFeedback } from '../models/studentFeedback.model.js'
import { TeacherFeedback } from '../models/teacherFeedback.model.js'
import { getSchoolStatus, computeGradeFeedbackProgress } from './teacherStatus.service.js'

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

// Every school's real reach/student-feedback/teacher-feedback data, in the
// same raw shape the Teacher Portal itself uses — the Admin panel derives
// every dashboard number, table row, and export row from this single source.
export async function getSchoolsOverview() {
  const schools = await School.find().sort({ createdAt: -1 })

  return Promise.all(
    schools.map(async (school) => {
      const [status, gradeProgress, reachDocs, studentDocs, teacherDocs] = await Promise.all([
        getSchoolStatus(school._id),
        computeGradeFeedbackProgress(school._id),
        StudentReach.find({ school: school._id }),
        StudentFeedback.find({ school: school._id }),
        TeacherFeedback.find({ school: school._id }),
      ])

      const reachByGrade = new Map(reachDocs.map((doc) => [doc.grade, doc]))
      const reach = gradeProgress.map((progress) => {
        const doc = reachByGrade.get(progress.grade)
        return {
          ...progress,
          language: doc?.language ?? null,
          month: doc?.month ?? null,
          financialYear: doc?.financialYear ?? null,
          createdAt: doc?.createdAt ?? null,
        }
      })

      return {
        id: school._id,
        udise: school.udise,
        schoolName: school.schoolName,
        district: school.district,
        state: school.state,
        createdAt: school.createdAt,
        status,
        reach,
        studentFeedback: studentDocs.flatMap(buildStudentFeedbackRows),
        teacherFeedback: teacherDocs.map(buildTeacherFeedbackRow),
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
  const [teacherDocs, studentDocs] = await Promise.all([
    TeacherFeedback.find().sort({ createdAt: -1 }),
    StudentFeedback.find().sort({ createdAt: -1 }),
  ])

  const rows = [...buildTeacherActivityRows(teacherDocs), ...buildStudentActivityRows(studentDocs)].sort(
    (a, b) => new Date(a.time) - new Date(b.time),
  )

  return { rows }
}

// Admin "Delete All Feedback & Reach Data" — clears every real submission
// while leaving registered schools (and their Teacher Portal logins) intact.
export async function deleteAllProgramData() {
  await Promise.all([StudentReach.deleteMany({}), StudentFeedback.deleteMany({}), TeacherFeedback.deleteMany({})])
}
