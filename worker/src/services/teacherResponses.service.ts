// Ported verbatim (logic-wise) from server/src/services/teacherResponses.service.js
// — the Teacher Portal's per-school "All Responses" activity log.
import type { Env } from '../env'
import { listTeacherFeedbackForSchool, type TeacherFeedbackRecord } from '../repositories/teacherFeedbacks.repository'
import { listStudentFeedbackForSchool, type StudentFeedbackRecord } from '../repositories/studentFeedbacks.repository'
import { countUniqueTeacherResponses } from '../utils/teacherResponseCount'
import { sortByFeedbackHierarchy } from '../utils/feedbackSort'

interface ActivityRow {
  id: string
  type: 'Teacher' | 'Student'
  school: string
  tour: string
  tourId: string
  identifier: string
  grade: string | null
  month: string
  time: string
}

function buildTeacherRows(teacherDocs: Array<{ id: string; data: TeacherFeedbackRecord }>): ActivityRow[] {
  return teacherDocs.map((doc) => ({
    id: `teacher-${doc.id}`,
    type: 'Teacher',
    school: doc.data.schoolName,
    tour: doc.data.tourName,
    tourId: doc.data.tourId,
    identifier: doc.data.email || doc.data.submittedBy,
    grade: null,
    month: doc.data.month,
    time: doc.data.createdAt,
  }))
}

function buildStudentRows(studentDocs: Array<{ id: string; data: StudentFeedbackRecord }>): ActivityRow[] {
  const rows: ActivityRow[] = []
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
      })
    })
  })
  return rows
}

function computeTopGrade(studentDocs: Array<{ data: StudentFeedbackRecord }>): { grade: string; count: number } | null {
  const countByGrade = new Map<string, number>()
  studentDocs.forEach((doc) => {
    countByGrade.set(doc.data.grade, (countByGrade.get(doc.data.grade) || 0) + 1)
  })

  let topGrade: { grade: string; count: number } | null = null
  countByGrade.forEach((count, grade) => {
    if (!topGrade || count > topGrade.count) topGrade = { grade, count }
  })
  return topGrade
}

export async function getAllResponses(env: Env, udise: string, options: { search?: string; page?: number; limit?: number } = {}) {
  const { search = '', page = 1, limit = 100 } = options

  const [teacherDocs, studentDocs] = await Promise.all([
    listTeacherFeedbackForSchool(env, udise),
    listStudentFeedbackForSchool(env, udise),
  ])

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
      teacherResponses: countUniqueTeacherResponses(teacherDocs.map((doc) => doc.data)),
      topGrade: computeTopGrade(studentDocs),
    },
    rows,
    pagination: { page: safePage, limit: safeLimit, total, totalPages },
  }
}
