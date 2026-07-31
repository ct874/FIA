import { TOURS } from './schoolRecords.schema'

function allTourEntries(school) {
  return school.classes.flatMap((classRecord) =>
    classRecord.tours.map((tour) => ({ school, classRecord, tour })),
  )
}

function flattenAllEntries(schools) {
  return schools.flatMap((school) => allTourEntries(school))
}

/**
 * Every {school, classRecord, tour} combination across all schools — the
 * shared traversal used by the export CSV builders.
 */
export function flattenSchoolTours(schools) {
  return flattenAllEntries(schools)
}

function entryMatchesFilters(entry, filters) {
  if (filters.district && entry.school.district !== filters.district) return false
  if (filters.tourId && entry.tour.tourId !== filters.tourId) return false
  if (filters.month && entry.tour.month !== filters.month) return false
  return true
}

function average(values) {
  if (values.length === 0) return null
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
}

/**
 * One row per individual feedback submission event (Teacher or Student),
 * for the "All Submissions" activity log. Reach-data entries aren't
 * submission "events" in the same sense, so they're intentionally excluded.
 */
export function computeSubmissionRows(schools) {
  const rows = []

  flattenAllEntries(schools).forEach(({ school, classRecord, tour }) => {
    if (tour.teacherFeedback) {
      rows.push({
        id: `sub-teacher-${school.udise}-${tour.tourId}-${classRecord.grade}`,
        type: 'Teacher',
        school: school.schoolName,
        tour: tour.tourName,
        grade: '—',
        month: tour.month,
        time: tour.teacherFeedback.submittedAt,
        csat: null,
      })
    }
    if (tour.studentFeedback) {
      rows.push({
        id: `sub-student-${school.udise}-${tour.tourId}-${classRecord.grade}`,
        type: 'Student',
        school: school.schoolName,
        tour: tour.tourName,
        grade: classRecord.grade,
        month: tour.month,
        time: tour.studentFeedback.submittedAt,
        csat: tour.studentFeedback.csatAvg,
      })
    }
  })

  return rows
}

/**
 * District/Tour/Month option lists for the overview dashboard's filter bar.
 */
export function getOverviewFilterOptions(schools) {
  const districts = Array.from(new Set(schools.map((school) => school.district))).sort()
  const months = Array.from(new Set(flattenAllEntries(schools).map(({ tour }) => tour.month)))
  return { districts, months, tours: Object.values(TOURS) }
}

/**
 * Top-level KPI row for the Home dashboard overview: schools, reach,
 * feedback response counts, and overall CSAT/ITP (PDF formulas), all
 * respecting the district/tour/month filter.
 */
export function computeOverviewSummary(schools, filters = {}) {
  const entries = flattenAllEntries(schools).filter((entry) => entryMatchesFilters(entry, filters))
  const schoolIds = new Set(entries.map((entry) => entry.school.udise))

  const totalReach = entries.reduce(
    (sum, entry) => sum + (entry.tour.reach?.uniqueStudentCount ?? 0),
    0,
  )
  const studentResponses = entries.reduce(
    (sum, entry) => sum + (entry.tour.studentFeedback?.respondedCount ?? 0),
    0,
  )
  const teacherResponses = entries.filter((entry) => entry.tour.teacherFeedback).length

  const csatValues = entries
    .map((entry) => entry.tour.studentFeedback?.csatAvg)
    .filter((value) => value != null)
  const itpValues = entries
    .map((entry) => entry.tour.studentFeedback?.itpAvg)
    .filter((value) => value != null)

  return {
    schoolsCount: schoolIds.size,
    totalReach,
    studentResponses,
    teacherResponses,
    overallCsat: average(csatValues) ?? 0,
    overallItp: average(itpValues) ?? 0,
  }
}

/**
 * Per-tour CSAT/ITP/NPS averages for the "CSAT & ITP by Tour" and "NPS by
 * Tour" sections, respecting the district/tour/month filter.
 */
export function computeTourBreakdown(schools, filters = {}) {
  const entries = flattenAllEntries(schools).filter((entry) => entryMatchesFilters(entry, filters))

  return Object.values(TOURS).map((tour) => {
    const tourEntries = entries.filter((entry) => entry.tour.tourId === tour.id)

    const csatValues = tourEntries
      .map((entry) => entry.tour.studentFeedback?.csatAvg)
      .filter((value) => value != null)
    const itpValues = tourEntries
      .map((entry) => entry.tour.studentFeedback?.itpAvg)
      .filter((value) => value != null)
    const npsValues = tourEntries
      .map((entry) => entry.tour.teacherFeedback?.nps)
      .filter((value) => value != null)

    return {
      tourId: tour.id,
      tourName: tour.name,
      csat: average(csatValues),
      itp: average(itpValues),
      nps: average(npsValues),
    }
  })
}

/**
 * One row per fully-completed (reach + student feedback + teacher feedback)
 * tour entry, for the "Completed Schools" table.
 */
export function computeCompletedRows(schools) {
  return schools.flatMap((school) =>
    allTourEntries(school)
      .filter(({ tour }) => tour.reach && tour.studentFeedback && tour.teacherFeedback)
      .map(({ classRecord, tour }) => ({
        id: `${school.udise}-${tour.tourId}-${classRecord.grade}`,
        school: school.schoolName,
        district: school.district,
        tour: tour.tourName,
        grade: classRecord.grade,
        month: tour.month,
        reach: tour.reach.uniqueStudentCount,
        responses: tour.studentFeedback.respondedCount,
        avgCsat: tour.studentFeedback.csatAvg,
        nps: tour.teacherFeedback.nps,
      })),
  )
}

function fieldStatus(entries, hasField) {
  if (entries.length === 0) return 'Pending'
  return entries.every(hasField) ? 'Completed' : 'Pending'
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

/**
 * Flat UDISE/School Name/District/State directory, for the Admin "School
 * Management" list (the source of truth for which UDISEs can log in as
 * teachers).
 */
export function computeSchoolDirectory(schools) {
  return schools.map((school) => ({
    udise: school.udise,
    schoolName: school.schoolName,
    district: school.district,
    state: school.state,
  }))
}

/**
 * One row per school, for the "Registered Schools" table.
 */
export function computeRegisteredRows(schools) {
  return schools.map((school) => {
    const entries = allTourEntries(school).map(({ tour }) => tour)

    const teacherFb = fieldStatus(entries, (tour) => Boolean(tour.teacherFeedback))
    const reachData = fieldStatus(entries, (tour) => Boolean(tour.reach))
    const studentFb = fieldStatus(entries, (tour) => Boolean(tour.studentFeedback))

    return {
      id: school.udise,
      school: school.schoolName,
      udise: school.udise,
      district: school.district,
      teacherFb,
      reachData,
      studentFb,
      overallStatus: overallStatusFrom(teacherFb, reachData, studentFb),
      lastActivity: school.lastActivityLabel,
    }
  })
}
