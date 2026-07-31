import { computeSubmissionRows } from '../../../data/schoolRecords.derive'
import { getTeacherSubmissions } from '../../../services/teacherSubmissions.service'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function monthFromIso(iso) {
  return MONTH_NAMES[new Date(iso).getMonth()]
}

function localTeacherFeedbackRows() {
  return getTeacherSubmissions()
    .filter((entry) => entry.type === 'feedback')
    .map((entry, index) => ({
      id: `local-teacher-${index}-${entry.submittedAt}`,
      type: 'Teacher',
      school: entry.payload.schoolName,
      tour: entry.payload.tourName,
      grade: '—',
      month: monthFromIso(entry.submittedAt),
      time: entry.submittedAt,
      csat: null,
    }))
}

/**
 * All submission-event rows (Teacher + Student), merging the canonical
 * dummy dataset with whatever this browser's Teacher Portal has actually
 * submitted this session, oldest first.
 */
export function getAllSubmissionRows(schools) {
  const rows = [...computeSubmissionRows(schools), ...localTeacherFeedbackRows()]
  return rows.sort((a, b) => new Date(a.time) - new Date(b.time))
}

export function computeSubmissionsSummary(rows) {
  const studentRows = rows.filter((row) => row.type === 'Student')
  const teacherRows = rows.filter((row) => row.type === 'Teacher')
  const grade6Rows = rows.filter((row) => row.grade === '6')

  const csatValues = studentRows.map((row) => row.csat).filter((value) => value != null)
  const avgCsat = csatValues.length
    ? csatValues.reduce((sum, value) => sum + value, 0) / csatValues.length
    : 0

  return {
    totalStudentFeedback: studentRows.length,
    teacherResponses: teacherRows.length,
    grade6Feedback: grade6Rows.length,
    avgCsat: Number(avgCsat.toFixed(2)),
  }
}
