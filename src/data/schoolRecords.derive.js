import { TOURS } from './schoolRecords.schema'

function average(values) {
  if (values.length === 0) return null
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
}

// True NPS: % promoters (score 9-10) minus % detractors (score 0-6), from the
// real 0-10 "how likely to recommend" teacher answer — a -100..100 value,
// matching the "%" the UI already expects.
function computeNps(scores) {
  if (scores.length === 0) return null
  const promoters = scores.filter((score) => score >= 9).length
  const detractors = scores.filter((score) => score <= 6).length
  return Math.round(((promoters - detractors) / scores.length) * 100)
}

function schoolMatchesFilters(school, filters) {
  return !filters.district || school.district === filters.district
}

function reachMatchesFilters(reach, filters) {
  if (filters.tourId && !reach.tours.some((tour) => tour.tourId === filters.tourId)) return false
  if (filters.month && reach.month !== filters.month) return false
  return true
}

function feedbackRowMatchesFilters(row, filters) {
  if (filters.tourId && row.tourId !== filters.tourId) return false
  if (filters.month && row.month !== filters.month) return false
  return true
}

/**
 * District/Tour/Month option lists for the overview dashboard's filter bar.
 */
export function getOverviewFilterOptions(schools) {
  const districts = Array.from(new Set(schools.map((school) => school.district))).sort()
  const months = Array.from(new Set(schools.flatMap((school) => school.reach.map((reach) => reach.month))))
  return { districts, months, tours: Object.values(TOURS) }
}

/**
 * Top-level KPI row for the Home dashboard overview: schools, reach,
 * feedback response counts, and overall CSAT/ITP, all respecting the
 * district/tour/month filter.
 */
export function computeOverviewSummary(schools, filters = {}) {
  const filteredSchools = schools.filter((school) => schoolMatchesFilters(school, filters))

  const reachEntries = filteredSchools.flatMap((school) =>
    school.reach.filter((reach) => reachMatchesFilters(reach, filters)).map((reach) => ({ school, reach })),
  )
  const studentRows = filteredSchools.flatMap((school) =>
    school.studentFeedback.filter((row) => feedbackRowMatchesFilters(row, filters)),
  )
  const teacherRows = filteredSchools.flatMap((school) =>
    school.teacherFeedback.filter((row) => feedbackRowMatchesFilters(row, filters)),
  )

  const schoolIds = new Set(reachEntries.map((entry) => entry.school.udise))
  const totalReach = reachEntries.reduce((sum, entry) => sum + entry.reach.uniqueStudentCount, 0)

  const csatValues = studentRows.map((row) => row.enjoyment).filter((value) => value != null)
  const itpValues = studentRows.map((row) => row.interestInFutureCareer).filter((value) => value != null)

  return {
    schoolsCount: schoolIds.size,
    totalReach,
    studentResponses: studentRows.length,
    teacherResponses: teacherRows.length,
    overallCsat: average(csatValues) ?? 0,
    overallItp: average(itpValues) ?? 0,
  }
}

/**
 * Per-tour CSAT/ITP/NPS averages for the "CSAT & ITP by Tour" and "NPS by
 * Tour" sections, respecting the district/tour/month filter.
 */
export function computeTourBreakdown(schools, filters = {}) {
  const filteredSchools = schools.filter((school) => schoolMatchesFilters(school, filters))
  const studentRows = filteredSchools.flatMap((school) =>
    school.studentFeedback.filter((row) => feedbackRowMatchesFilters(row, filters)),
  )
  const teacherRows = filteredSchools.flatMap((school) =>
    school.teacherFeedback.filter((row) => feedbackRowMatchesFilters(row, filters)),
  )

  return Object.values(TOURS).map((tour) => {
    const tourStudentRows = studentRows.filter((row) => row.tourId === tour.id)
    const tourTeacherRows = teacherRows.filter((row) => row.tourId === tour.id)

    return {
      tourId: tour.id,
      tourName: tour.name,
      csat: average(tourStudentRows.map((row) => row.enjoyment).filter((value) => value != null)),
      itp: average(tourStudentRows.map((row) => row.interestInFutureCareer).filter((value) => value != null)),
      nps: computeNps(tourTeacherRows.map((row) => row.recommendScore).filter((value) => value != null)),
    }
  })
}

function statusLabel(isDone, hasAnyActivity) {
  if (isDone) return 'Completed'
  return hasAnyActivity ? 'In Progress' : 'Pending'
}

function overallStatusFrom(teacherFb, reachData, studentFb) {
  if (teacherFb === 'Completed' && reachData === 'Completed' && studentFb === 'Completed') {
    return 'Completed'
  }
  if (teacherFb === 'Pending' && reachData === 'Pending' && studentFb === 'Pending') {
    return 'Not Started'
  }
  return 'In Progress'
}

function computeLastActivity(school) {
  const dates = [
    ...school.reach.map((reach) => reach.createdAt),
    ...school.studentFeedback.map((row) => row.createdAt),
    ...school.teacherFeedback.map((row) => row.createdAt),
  ]
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))

  if (dates.length === 0) return '—'
  const latest = new Date(Math.max(...dates.map((date) => date.getTime())))
  return latest.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * One row per school, for the "Registered Schools" table.
 */
export function computeRegisteredRows(schools) {
  return schools.map((school) => {
    const teacherFb = statusLabel(school.status.teacherFeedbackCompleted, school.teacherFeedback.length > 0)
    const reachData = statusLabel(school.status.reachSubmitted, school.reach.length > 0)
    const studentFb = statusLabel(school.status.studentFeedbackCompleted, school.studentFeedback.length > 0)

    return {
      id: school.udise,
      school: school.schoolName,
      udise: school.udise,
      district: school.district,
      teacherFb,
      reachData,
      studentFb,
      overallStatus: overallStatusFrom(teacherFb, reachData, studentFb),
      lastActivity: computeLastActivity(school),
    }
  })
}

/**
 * One row per (school, grade, tour) combination that has reach data plus at
 * least one student and one teacher feedback submission for that tour, for
 * the "Completed Schools" table.
 */
export function computeCompletedRows(schools) {
  const rows = []

  schools.forEach((school) => {
    school.reach.forEach((reach) => {
      reach.tours.forEach((tour) => {
        const studentRows = school.studentFeedback.filter(
          (row) => row.grade === reach.grade && row.tourId === tour.tourId,
        )
        const teacherRows = school.teacherFeedback.filter((row) => row.tourId === tour.tourId)
        if (studentRows.length === 0 || teacherRows.length === 0) return

        rows.push({
          id: `${school.udise}-${tour.tourId}-${reach.grade}`,
          school: school.schoolName,
          district: school.district,
          tour: tour.tourName,
          grade: reach.grade,
          month: reach.month,
          reach: reach.uniqueStudentCount,
          responses: studentRows.length,
          avgCsat: average(studentRows.map((row) => row.enjoyment).filter((value) => value != null)) ?? 0,
          nps: computeNps(teacherRows.map((row) => row.recommendScore).filter((value) => value != null)) ?? 0,
        })
      })
    })
  })

  return rows
}

/**
 * One row per individual feedback submission event (Teacher or Student),
 * for the "All Submissions" activity log.
 */
export function computeSubmissionRows(schools) {
  const rows = []

  schools.forEach((school) => {
    school.teacherFeedback.forEach((row) => {
      rows.push({
        id: `sub-teacher-${school.udise}-${row.tourId}-${row.createdAt}`,
        type: 'Teacher',
        school: school.schoolName,
        tour: row.tourName,
        grade: '—',
        month: row.month,
        time: row.createdAt,
        csat: null,
      })
    })

    school.studentFeedback.forEach((row) => {
      rows.push({
        id: `sub-student-${school.udise}-${row.tourId}-${row.studentDummyId}-${row.createdAt}`,
        type: 'Student',
        school: school.schoolName,
        tour: row.tourName,
        grade: row.grade,
        month: row.month,
        time: row.createdAt,
        csat: row.enjoyment,
      })
    })
  })

  return rows.sort((a, b) => new Date(a.time) - new Date(b.time))
}
