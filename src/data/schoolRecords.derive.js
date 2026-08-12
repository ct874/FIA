import { ENABLED_TOURS } from './schoolRecords.schema'
import { sortByFeedbackHierarchy, sortBySchoolName, getGradeRank } from '../utils/feedbackSort'
import { calculateCsat, summarizeCsatRatings } from '../utils/csat'
import { calculateItp } from '../utils/itp'
import { summarizeNpsResponses } from '../utils/nps'

function schoolMatchesFilters(school, filters) {
  return !filters.district || school.district === filters.district
}

function batchMatchesFilters(batch, filters) {
  if (filters.tourId && !batch.tours.some((tour) => tour.tourId === filters.tourId)) return false
  if (filters.month && batch.month !== filters.month) return false
  return true
}

function feedbackRowMatchesFilters(row, filters) {
  if (filters.tourId && row.tourId !== filters.tourId) return false
  if (filters.month && row.month !== filters.month) return false
  return true
}

/**
 * Centralized "unique teacher" counting rule for the entire Super Admin
 * Panel — a teacher who submits feedback for N Career Tours creates N
 * TeacherFeedback documents (one per tour) but represents exactly ONE
 * person's feedback session, so every "Teacher Responses" count must be a
 * DISTINCT count of teachers, not a row count.
 *
 * A teacher is identified by their submitted email (preferred) or, for
 * older records saved before the email field existed, their submitted
 * name — always scoped to the school (`udise`), since the same identifier
 * at two different schools is two different participations, not one
 * merged count.
 *
 * Every place that reports a Teacher Responses count must call this
 * function instead of `.length`-counting teacher feedback rows directly.
 * `entries` is any array of `{ udise, email, submittedBy }`-shaped objects.
 */
export function countUniqueTeacherResponses(entries) {
  const uniqueKeys = new Set(
    entries.map((entry) => {
      const identity = (entry.email || entry.submittedBy || '').trim().toLowerCase()
      return `${entry.udise}::${identity}`
    }),
  )
  return uniqueKeys.size
}

/**
 * District/Tour/Month option lists for the overview dashboard's filter bar.
 *
 * `tours` (optional) overrides the static ENABLED_TOURS fallback with the
 * live tour catalog (see useTourCatalog()) — additive only: AWS/Robotics/
 * Music always resolve from ENABLED_TOURS if a live list hasn't loaded yet.
 */
export function getOverviewFilterOptions(schools, tours = ENABLED_TOURS) {
  const districts = Array.from(new Set(schools.map((school) => school.district))).sort()
  const months = Array.from(new Set(schools.flatMap((school) => school.feedbackBatches.map((batch) => batch.month))))
  return { districts, months, tours }
}

/**
 * Top-level KPI row for the Home dashboard overview: target students,
 * feedback response counts, and overall CSAT/ITP, all respecting the
 * district/tour/month filter.
 */
export function computeOverviewSummary(schools, filters = {}) {
  const filteredSchools = schools.filter((school) => schoolMatchesFilters(school, filters))

  const batchEntries = filteredSchools.flatMap((school) =>
    school.feedbackBatches.filter((batch) => batchMatchesFilters(batch, filters)).map((batch) => ({ school, batch })),
  )
  const studentEntries = filteredSchools.flatMap((school) =>
    school.studentFeedback.filter((row) => feedbackRowMatchesFilters(row, filters)).map((row) => ({ school, row })),
  )
  const teacherEntries = filteredSchools.flatMap((school) =>
    school.teacherFeedback.filter((row) => feedbackRowMatchesFilters(row, filters)).map((row) => ({ school, row })),
  )

  const totalTargetStudents = batchEntries.reduce((sum, entry) => sum + entry.batch.target, 0)

  const csatValues = studentEntries.map((entry) => entry.row.enjoyment).filter((value) => value != null)
  const itpValues = studentEntries
    .map((entry) => entry.row.interestInFutureCareer)
    .filter((value) => value != null)

  // "Total Schools" counts only schools that have actually logged into the
  // Teacher Portal and submitted something (a feedback batch, student
  // feedback, or teacher feedback) — a School record with no activity yet is
  // just an unused login, not a participating school.
  const activeSchoolIds = new Set([
    ...batchEntries.map((entry) => entry.school.udise),
    ...studentEntries.map((entry) => entry.school.udise),
    ...teacherEntries.map((entry) => entry.school.udise),
  ])

  return {
    schoolsCount: activeSchoolIds.size,
    totalTargetStudents,
    studentResponses: studentEntries.length,
    teacherResponses: countUniqueTeacherResponses(
      teacherEntries.map((entry) => ({
        udise: entry.school.udise,
        email: entry.row.email,
        submittedBy: entry.row.submittedBy,
      })),
    ),
    overallCsat: calculateCsat(csatValues) ?? 0,
    overallItp: calculateItp(itpValues) ?? 0,
  }
}

/**
 * Per-tour CSAT/ITP/NPS averages for the "CSAT & ITP by Tour" and "NPS by
 * Tour" sections, respecting the district/tour/month filter.
 *
 * `tours` (optional) overrides the static ENABLED_TOURS fallback with the
 * live tour catalog (see useTourCatalog()) so a Super-Admin-created tour
 * gets its own breakdown card too — additive only: AWS/Robotics/Music
 * always resolve from ENABLED_TOURS if a live list hasn't loaded yet.
 */
export function computeTourBreakdown(schools, filters = {}, tours = ENABLED_TOURS) {
  const filteredSchools = schools.filter((school) => schoolMatchesFilters(school, filters))
  const studentRows = filteredSchools.flatMap((school) =>
    school.studentFeedback.filter((row) => feedbackRowMatchesFilters(row, filters)),
  )
  const teacherRows = filteredSchools.flatMap((school) =>
    school.teacherFeedback.filter((row) => feedbackRowMatchesFilters(row, filters)),
  )

  return tours.map((tour) => {
    const tourStudentRows = studentRows.filter((row) => row.tourId === tour.id)
    const tourTeacherRows = teacherRows.filter((row) => row.tourId === tour.id)

    return {
      tourId: tour.id,
      tourName: tour.name,
      csat: calculateCsat(tourStudentRows.map((row) => row.enjoyment).filter((value) => value != null)),
      itp: calculateItp(tourStudentRows.map((row) => row.interestInFutureCareer).filter((value) => value != null)),
      nps: summarizeNpsResponses(tourTeacherRows.map((row) => row.recommendScore).filter((value) => value != null)).nps,
    }
  })
}

function statusLabel(isDone, hasAnyActivity) {
  if (isDone) return 'Completed'
  return hasAnyActivity ? 'In Progress' : 'Pending'
}

function computeLastActivity(school) {
  const dates = [
    ...school.feedbackBatches.map((batch) => batch.createdAt),
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
 * One row per school, for the "Registered Schools" table. `overallStatus`
 * (Not Started / Pending / Completed) is calculated once, server-side, by
 * computeSchoolOverallStatus() — this just passes it through so every page
 * that renders a school's status agrees with every other one.
 */
export function computeRegisteredRows(schools) {
  // Level 1 of the required hierarchy: schools always listed in the same
  // fixed (alphabetical) order, regardless of the order the API returned them.
  return sortBySchoolName(schools, (school) => school.schoolName).map((school) => {
    const teacherFb = statusLabel(school.status.teacherFeedbackCompleted, school.teacherFeedback.length > 0)
    const studentFb = statusLabel(school.status.studentFeedbackCompleted, school.studentFeedback.length > 0)

    return {
      id: school.udise,
      school: school.schoolName,
      udise: school.udise,
      district: school.district,
      teacherFb,
      studentFb,
      overallStatus: school.overallStatus,
      lastActivity: computeLastActivity(school),
    }
  })
}

/**
 * One row per (school, grade, tour) combination, for the "Completed
 * Schools" table — but ONLY for schools whose overall status (the same
 * computeSchoolOverallStatus() value the "Registered Schools" table already
 * shows, passed through as `school.overallStatus`) is exactly "Completed":
 * every one of REQUIRED_GRADES (6–12) has met its Student Feedback target
 * AND Teacher Feedback is done. A school with only some grades finished
 * (even Grade 6 alone, or Grade 6–11) must never appear here — that used to
 * be exactly this function's bug (it included a school as soon as any
 * single grade+tour had both student and teacher rows).
 */
export function computeCompletedRows(schools) {
  const rows = []

  sortBySchoolName(schools, (school) => school.schoolName)
    .filter((school) => school.overallStatus === 'Completed')
    .forEach((school) => {
      const seenGradeTours = new Set()

      school.studentFeedback.forEach((studentRow) => {
        const key = `${studentRow.grade}-${studentRow.tourId}`
        if (seenGradeTours.has(key)) return
        seenGradeTours.add(key)

        const studentRows = school.studentFeedback.filter(
          (row) => row.grade === studentRow.grade && row.tourId === studentRow.tourId,
        )
        const teacherRows = school.teacherFeedback.filter((row) => row.tourId === studentRow.tourId)
        if (teacherRows.length === 0) return

        const batch = school.feedbackBatches.find((entry) => entry.grade === studentRow.grade)
        const csatSummary = summarizeCsatRatings(studentRows.map((row) => row.enjoyment))
        const npsSummary = summarizeNpsResponses(teacherRows.map((row) => row.recommendScore))

        rows.push({
          id: `${school.udise}-${studentRow.tourId}-${studentRow.grade}`,
          school: school.schoolName,
          district: school.district,
          tour: studentRow.tourName,
          tourId: studentRow.tourId,
          grade: studentRow.grade,
          month: studentRow.month,
          target: batch?.target ?? studentRows.length,
          responses: studentRows.length,
          avgCsat: csatSummary.average ?? 0,
          // Raw sum/count behind avgCsat above — NOT displayed anywhere,
          // only so a caller aggregating several of these rows together
          // (e.g. dashboardStats.js's computeCompletedSchoolsSummary) can
          // compute a correctly weighted overall CSAT instead of averaging
          // already-rounded per-row averages against each other.
          csatScoreSum: csatSummary.scoreSum,
          csatResponseCount: csatSummary.responseCount,
          nps: npsSummary.nps ?? 0,
          // Raw promoter/detractor/total counts behind nps above — same
          // reasoning as csatScoreSum/csatResponseCount: lets a caller
          // combining several of these rows compute a correctly weighted
          // overall NPS instead of averaging already-computed per-row NPS
          // values equally against each other.
          npsPromoters: npsSummary.promoters,
          npsDetractors: npsSummary.detractors,
          npsTotalResponses: npsSummary.totalResponses,
        })
      })
    })

  // Grade (ascending) -> Career Tour, within the already school-ordered rows above.
  return sortByFeedbackHierarchy(rows, (row) => ({
    schoolName: row.school,
    grade: row.grade,
    identifier: '',
    tourId: row.tourId,
  }))
}

/**
 * One card per grade found anywhere in the database, aggregated across every
 * school — e.g. Grade 6 across School A (15 students targeted) + School B
 * (19 students targeted) = one "Grade 6" card with Total Students 34. No
 * grade is hardcoded; the set of cards is whatever grades currently have a
 * feedback batch.
 */
export function computeGradeSummaryCards(schools) {
  const byGrade = new Map()

  schools.forEach((school) => {
    school.feedbackBatches.forEach((batch) => {
      const entry = byGrade.get(batch.grade) || { grade: batch.grade, totalStudents: 0, required: 0, submitted: 0 }
      entry.totalStudents += batch.totalStudents
      entry.required += batch.target
      entry.submitted += batch.submittedCount
      byGrade.set(batch.grade, entry)
    })
  })

  return Array.from(byGrade.values())
    .map((entry) => ({
      grade: entry.grade,
      totalStudents: entry.totalStudents,
      totalSubmitted: entry.submitted,
      // "Remaining"/completion here are against the REQUIRED (40%) feedback
      // count, not the full class size — a teacher's job for a grade is
      // done once the 40% quota is met, not once every student has replied.
      totalRemaining: Math.max(0, entry.required - entry.submitted),
      completionPercentage:
        entry.required > 0 ? Math.min(100, Math.round((entry.submitted / entry.required) * 100)) : 0,
    }))
    .sort((a, b) => getGradeRank(a.grade) - getGradeRank(b.grade))
}

/**
 * One row per individual feedback submission event (Teacher or Student),
 * for the "All Submissions" activity log.
 */
export function computeSubmissionRows(schools) {
  const rows = []

  sortBySchoolName(schools, (school) => school.schoolName).forEach((school) => {
    school.teacherFeedback.forEach((row) => {
      rows.push({
        id: `sub-teacher-${school.udise}-${row.tourId}-${row.createdAt}`,
        type: 'Teacher',
        school: school.schoolName,
        udise: school.udise,
        email: row.email,
        submittedBy: row.submittedBy,
        tour: row.tourName,
        tourId: row.tourId,
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
        tourId: row.tourId,
        identifier: row.studentDummyId,
        grade: row.grade,
        month: row.month,
        time: row.createdAt,
        csat: row.enjoyment,
      })
    })
  })

  // School -> Grade -> Student/Teacher -> Career Tour, per the required
  // hierarchy (replaces the old chronological ordering).
  return sortByFeedbackHierarchy(rows, (row) => ({
    schoolName: row.school,
    grade: row.grade === '—' ? null : row.grade,
    type: row.type,
    identifier: row.type === 'Teacher' ? row.email || row.submittedBy : row.identifier,
    tourId: row.tourId,
  }))
}
