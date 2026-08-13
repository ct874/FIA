// Ported from server/src/services/adminDashboard.service.js — the Super
// Admin panel's per-school overview and cross-school activity log.
import type { Env } from '../env'
import { listAllSchools, type SchoolRecord } from '../repositories/schools.repository'
import { listAllStudentFeedback, type StudentFeedbackRecord } from '../repositories/studentFeedbacks.repository'
import { listAllTeacherFeedback, type TeacherFeedbackRecord } from '../repositories/teacherFeedbacks.repository'
import { listAllBatches } from '../repositories/studentFeedbackBatches.repository'
import { getSchoolStatusFromProgress, computeGradeFeedbackProgressFromDocs } from './teacherStatus.service'
import { computeSchoolOverallStatus } from './schoolStatus.service'
import { sortByFeedbackHierarchy, sortBySchoolName } from '../utils/feedbackSort'
import { getTargetPercentForDistrict } from './districtFeedbackTarget.service'
import type { TourCatalog } from '../constants/tours'
import type { DecodedDocument } from '../firestore/codec'
import { deleteDoc } from '../firestore/client'

function buildStudentFeedbackRows(doc: DecodedDocument<StudentFeedbackRecord>) {
  return doc.data.tours.map((tourAnswer) => ({
    grade: doc.data.grade,
    studentDummyId: doc.data.studentDummyId,
    tourId: tourAnswer.tourId,
    tourName: tourAnswer.tourName,
    language: tourAnswer.language,
    enjoyment: tourAnswer.enjoyment,
    overallExperience: tourAnswer.overallExperience,
    interestInFutureCareer: tourAnswer.interestInFutureCareer,
    wantExploreCareer: tourAnswer.wantExploreCareer,
    wantMoreTours: tourAnswer.wantMoreTours,
    month: doc.data.month,
    financialYear: doc.data.financialYear,
    createdAt: doc.data.createdAt,
  }))
}

function buildTeacherFeedbackRow(doc: DecodedDocument<TeacherFeedbackRecord>) {
  return {
    tourId: doc.data.tourId,
    tourName: doc.data.tourName,
    language: doc.data.language,
    submittedBy: doc.data.submittedBy,
    contactNumber: doc.data.contactNumber,
    email: doc.data.email || '',
    recommendScore: doc.data.recommendScore,
    satisfactionResources: doc.data.satisfactionResources,
    easeIntegration: doc.data.easeIntegration,
    biggestBenefit: doc.data.biggestBenefit,
    improvements: doc.data.improvements,
    month: doc.data.month,
    financialYear: doc.data.financialYear,
    createdAt: doc.data.createdAt,
  }
}

// Every school's real feedback-batch/student-feedback/teacher-feedback
// data, in the same raw shape the Teacher Portal itself uses — the Admin
// panel derives every dashboard number, table row, and export row from
// this single source.
export async function getSchoolsOverview(env: Env, tourCatalog: TourCatalog) {
  const [allSchools, allBatches, allStudentFeedback, allTeacherFeedback] = await Promise.all([
    listAllSchools(env),
    listAllBatches(env),
    listAllStudentFeedback(env),
    listAllTeacherFeedback(env),
  ])

  const schools = sortBySchoolName(allSchools, (school) => school.data.schoolName)

  const batchesByUdise = groupByUdise(allBatches)
  const studentsByUdise = groupByUdise(allStudentFeedback)
  const teachersByUdise = groupByUdise(allTeacherFeedback)

  return Promise.all(
    schools.map(async (school) => {
      const udise = school.data.udise
      const batchDocs = batchesByUdise.get(udise) ?? []
      const studentDocs = studentsByUdise.get(udise) ?? []
      const teacherDocs = teachersByUdise.get(udise) ?? []

      const targetPercent = await getTargetPercentForDistrict(env, school.data.district)
      const gradeProgress = computeGradeFeedbackProgressFromDocs(
        batchDocs.map((doc) => doc.data),
        studentDocs.map((doc) => ({ grade: doc.data.grade })),
        targetPercent,
      )
      const status = getSchoolStatusFromProgress(teacherDocs.length, gradeProgress, tourCatalog.tourIds.length)

      const studentFeedback = sortByFeedbackHierarchy(studentDocs.flatMap(buildStudentFeedbackRows), (row) => ({
        schoolName: school.data.schoolName,
        grade: row.grade,
        type: 'Student' as const,
        identifier: row.studentDummyId,
        tourId: row.tourId,
      }))
      const teacherFeedback = sortByFeedbackHierarchy(teacherDocs.map(buildTeacherFeedbackRow), (row) => ({
        schoolName: school.data.schoolName,
        grade: null,
        type: 'Teacher' as const,
        identifier: row.email || row.submittedBy,
        tourId: row.tourId,
      }))

      return {
        id: udise,
        udise: school.data.udise,
        schoolName: school.data.schoolName,
        district: school.data.district,
        state: school.data.state,
        districtCode: school.data.districtCode || '',
        postalCode: school.data.postalCode || '',
        createdAt: school.data.createdAt,
        status,
        overallStatus: computeSchoolOverallStatus(status),
        feedbackBatches: gradeProgress,
        studentFeedback,
        teacherFeedback,
      }
    }),
  )
}

function groupByUdise<T extends { data: { udise: string } }>(docs: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  docs.forEach((doc) => {
    const key = doc.data.udise
    if (!map.has(key)) map.set(key, [])
    map.get(key)?.push(doc)
  })
  return map
}

function buildTeacherActivityRows(teacherDocs: Array<DecodedDocument<TeacherFeedbackRecord>>) {
  return teacherDocs.map((doc) => ({
    id: `teacher-${doc.id}`,
    type: 'Teacher' as const,
    school: doc.data.schoolName,
    tour: doc.data.tourName,
    tourId: doc.data.tourId,
    identifier: doc.data.email || doc.data.submittedBy,
    grade: null as string | null,
    month: doc.data.month,
    time: doc.data.createdAt,
    csat: null as number | null,
  }))
}

function buildStudentActivityRows(studentDocs: Array<DecodedDocument<StudentFeedbackRecord>>) {
  const rows: Array<{
    id: string
    type: 'Student'
    school: string
    tour: string
    tourId: string
    identifier: string
    grade: string | null
    month: string
    time: string
    csat: number | null
  }> = []
  studentDocs.forEach((doc) => {
    doc.data.tours.forEach((tourAnswer) => {
      rows.push({
        id: `student-${doc.id}-${tourAnswer.tourId}`,
        type: 'Student',
        school: doc.data.schoolName,
        tour: tourAnswer.tourName,
        tourId: tourAnswer.tourId,
        identifier: doc.data.studentDummyId,
        grade: doc.data.grade,
        month: doc.data.month,
        time: doc.data.createdAt,
        csat: tourAnswer.enjoyment,
      })
    })
  })
  return rows
}

// Cross-school activity log for the Admin "All Submissions" page.
export async function getAdminSubmissions(env: Env) {
  const [teacherDocs, studentDocs] = await Promise.all([listAllTeacherFeedback(env), listAllStudentFeedback(env)])

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
export async function deleteAllProgramData(env: Env): Promise<void> {
  const [batches, studentFeedback, teacherFeedback] = await Promise.all([
    listAllBatches(env),
    listAllStudentFeedback(env),
    listAllTeacherFeedback(env),
  ])

  await Promise.all([
    ...batches.map((doc) => deleteDoc(env, 'studentFeedbackBatches', doc.id)),
    ...studentFeedback.map((doc) => deleteDoc(env, 'studentFeedbacks', doc.id)),
    ...teacherFeedback.map((doc) => deleteDoc(env, 'teacherFeedbacks', doc.id)),
  ])
}

export async function deleteAllSchoolsData(env: Env): Promise<void> {
  const schools = await listAllSchools(env)
  await Promise.all(schools.map((doc) => deleteDoc(env, 'schools', doc.id)))
}
