import { computeSubmissionRows, countUniqueTeacherResponses } from '../../../data/schoolRecords.derive'
import { calculateCsat } from '../../../utils/csat'

export function getAllSubmissionRows(schools) {
  return computeSubmissionRows(schools)
}

export function computeSubmissionsSummary(rows) {
  const studentRows = rows.filter((row) => row.type === 'Student')
  const teacherRows = rows.filter((row) => row.type === 'Teacher')

  const csatValues = studentRows.map((row) => row.csat).filter((value) => value != null)

  return {
    totalStudentFeedback: studentRows.length,
    // Same centralized rule as the Home dashboard — one teacher who
    // submitted feedback for several Career Tours is still one response.
    teacherResponses: countUniqueTeacherResponses(teacherRows),
    avgCsat: calculateCsat(csatValues) ?? 0,
  }
}
