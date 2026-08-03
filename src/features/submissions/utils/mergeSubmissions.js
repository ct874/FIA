import { computeSubmissionRows } from '../../../data/schoolRecords.derive'

export function getAllSubmissionRows(schools) {
  return computeSubmissionRows(schools)
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
