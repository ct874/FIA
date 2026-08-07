import { TeacherFeedback } from '../models/teacherFeedback.model.js'
import { StudentFeedback } from '../models/studentFeedback.model.js'
import { countUniqueTeacherResponses } from '../utils/teacherResponseCount.js'
import { sortByFeedbackHierarchy } from '../utils/feedbackSort.js'

function buildTeacherRows(teacherDocs) {
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
  }))
}

function buildStudentRows(studentDocs) {
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
      })
    })
  })
  return rows
}

function computeTopGrade(studentDocs) {
  const countByGrade = new Map()
  studentDocs.forEach((doc) => {
    countByGrade.set(doc.grade, (countByGrade.get(doc.grade) || 0) + 1)
  })

  let topGrade = null
  countByGrade.forEach((count, grade) => {
    if (!topGrade || count > topGrade.count) topGrade = { grade, count }
  })
  return topGrade
}

export async function getAllResponses(schoolId, { search = '', page = 1, limit = 100 } = {}) {
  const [teacherDocs, studentDocs] = await Promise.all([
    TeacherFeedback.find({ school: schoolId }),
    StudentFeedback.find({ school: schoolId }),
  ])

  // School -> Grade -> Student/Teacher -> Career Tour, per the required
  // hierarchy (single-school query, so "School" is constant here).
  const allRows = sortByFeedbackHierarchy([...buildTeacherRows(teacherDocs), ...buildStudentRows(studentDocs)], (row) => ({
    schoolName: row.school,
    grade: row.grade,
    type: row.type,
    identifier: row.identifier,
    tourId: row.tourId,
  }))

  const query = search.trim().toLowerCase()
  const filteredRows = query
    ? allRows.filter((row) =>
        [row.type, row.school, row.tour, row.grade, row.month]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query)),
      )
    : allRows

  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.max(1, Number(limit) || 100)
  const total = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  const start = (safePage - 1) * safeLimit
  const rows = filteredRows.slice(start, start + safeLimit)

  return {
    summary: {
      totalStudentFeedback: studentDocs.length,
      teacherResponses: countUniqueTeacherResponses(teacherDocs),
      topGrade: computeTopGrade(studentDocs),
    },
    rows,
    pagination: { page: safePage, limit: safeLimit, total, totalPages },
  }
}
