// AFE CSV (Official) export — an isolated transformation layer over the
// same live School / StudentFeedbackBatch / StudentFeedback / TeacherFeedback
// collections every other Admin panel view already reads. Deliberately kept
// separate from adminDashboard.service.js and exportFormats.js (the normal
// portal's export) so a future change to the normal dashboards/exports can
// never silently change this locked government format, and vice versa.
//
// Required row hierarchy per school block (client spec — CLASS + TOUR level,
// NOT individual student rows):
//   For each school (alphabetical), for each Class 6 -> 12 (ascending, only
//   classes that actually have Student Feedback), exactly 3 rows — one per
//   tour, always AWS -> Robotics -> Music — aggregating that class+tour's
//   student answers. The school's Teacher Feedback (per tour) attaches onto
//   its FIRST class block only (unit_type becomes Student+Teacher=3 there),
//   never as separate rows and never duplicated onto later classes.
import { School } from '../models/school.model.js'
import { StudentFeedbackBatch } from '../models/studentFeedbackBatch.model.js'
import { StudentFeedback } from '../models/studentFeedback.model.js'
import { TeacherFeedback } from '../models/teacherFeedback.model.js'
import { sortBySchoolName } from '../utils/feedbackSort.js'
import { computeRequiredFeedbackCount } from '../utils/studentFeedbackTarget.js'
import { getMonthNumber } from '../utils/academicPeriod.js'
import { computeGradeFeedbackProgressFromDocs, getSchoolStatusFromProgress } from './teacherStatus.service.js'
import {
  computeSchoolOverallStatus,
  getSchoolLastActivityDate,
  REQUIRED_GRADES,
  SCHOOL_STATUS,
} from './schoolStatus.service.js'
import { AFE_OFFICIAL_COLUMNS, AFE_ALWAYS_EMPTY_COLUMNS } from '../constants/afeOfficialColumns.js'
import {
  AFE_TOUR_SEQUENCE,
  getAfeTourMeta,
  AFE_DEVICE_ID,
  AFE_COUNTRY_CODE,
  AFE_STATE,
  AFE_COMPLETION_RATE,
  AFE_VIDEO_COMPLETION_RATE,
  AFE_UNDERSERVED_REACH,
  AFE_DISTRIBUTION_CHANNEL_HOST,
  AFE_SCHOOL_YEAR,
  AFE_DATA_COLLECTION_METHOD,
  AFE_PARTNER_NAME,
  AFE_SCHOOL_TYPE,
  AFE_LANGUAGE,
  AFE_ACADEMIC_YEAR_ID,
  AFE_UNIT_TYPE_STUDENT,
  AFE_UNIT_TYPE_TEACHER,
  AFE_UNIT_TYPE_BOTH,
  AFE_ROWS_PER_CLASS,
} from '../constants/afeExport.js'
import { ApiError } from '../utils/ApiError.js'

function formatYYYYMMDD(date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// completion_date/submission_date's exact date format isn't locked by the
// client spec the way session_id's YYYYMMDD is — ISO (YYYY-MM-DD) is used
// as the least ambiguous, spreadsheet-friendly representation.
function formatIsoDate(date) {
  return date.toISOString().slice(0, 10)
}

// Average of a numeric field across a class+tour's student answers — used
// ONLY for student_csat / itp_avg / response_rate_percentage, per the client
// spec (every other column keeps its existing, non-aggregated source).
// Rounded to 2 decimals, matching the same convention the normal portal's
// own CSAT/ITP averages already use (src/data/schoolRecords.derive.js).
// Returns '' (never 0/null) when there's nothing to average, consistent
// with the rest of this export's "blank means no data" rule.
function average(values) {
  const nums = values.filter((value) => value !== null && value !== undefined)
  if (nums.length === 0) return ''
  return Number((nums.reduce((sum, value) => sum + value, 0) / nums.length).toFixed(2))
}

function groupBySchool(docs) {
  const map = new Map()
  docs.forEach((doc) => {
    const key = String(doc.school)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(doc)
  })
  return map
}

// Every AFE Official row has exactly these 73 keys, defaulted to '' — call
// sites only ever need to set the columns that differ from blank. `__meta`
// is an internal-only field (never a real column) carrying just enough
// structured context for validateAfeOfficialRows() to check ordering
// without re-parsing session_id strings; it's stripped before the row is
// ever turned into CSV or sent to the frontend.
function blankRow(meta) {
  const row = {}
  AFE_OFFICIAL_COLUMNS.forEach((column) => {
    row[column] = ''
  })
  Object.defineProperty(row, '__meta', { value: meta, enumerable: false })
  return row
}

function buildSharedRowFields({ school, tourMeta, unitType, completionDate, submissionDate, meta }) {
  const row = blankRow(meta)
  row.DeviceId = AFE_DEVICE_ID
  row.DistrictCode = school.districtCode || ''
  row.distribution_channel_host_id = tourMeta.hostId
  row.product_name = tourMeta.code
  row.cc = AFE_COUNTRY_CODE
  row.completion_date = completionDate
  row.completion_rate = AFE_COMPLETION_RATE
  row.underserved_reach = AFE_UNDERSERVED_REACH
  row.distribution_channel_host = AFE_DISTRIBUTION_CHANNEL_HOST
  row.school_year = AFE_SCHOOL_YEAR
  row.state = AFE_STATE
  row.district = school.district
  row.tour_id = tourMeta.code
  row.data_collection_method = AFE_DATA_COLLECTION_METHOD
  row.partner_name = AFE_PARTNER_NAME
  row.academic_year = AFE_ACADEMIC_YEAR_ID
  row.school_udise = school.udise
  row.school_name = school.schoolName
  row.school_type = AFE_SCHOOL_TYPE
  row.language = AFE_LANGUAGE
  row.unit_type = unitType
  row.session_duration_minutes = tourMeta.durationMinutes
  row.video_completion_rate = AFE_VIDEO_COMPLETION_RATE
  row.submission_date = submissionDate
  return row
}

// Builds the full, ordered AFE Official row set from live MongoDB data in
// exactly 4 queries total (School / StudentFeedbackBatch / StudentFeedback /
// TeacherFeedback, each unfiltered + `.lean()`), regardless of how many
// schools exist — no N+1, no repeated per-school lookups.
export async function buildAfeOfficialRows() {
  const [schools, allBatches, allStudentFeedback, allTeacherFeedback] = await Promise.all([
    School.find().lean(),
    StudentFeedbackBatch.find().lean(),
    StudentFeedback.find().lean(),
    TeacherFeedback.find().lean(),
  ])

  const batchesBySchool = groupBySchool(allBatches)
  const studentsBySchool = groupBySchool(allStudentFeedback)
  const teachersBySchool = groupBySchool(allTeacherFeedback)

  const rows = []

  sortBySchoolName(schools, (school) => school.schoolName).forEach((school) => {
    const schoolId = String(school._id)
    const batchDocs = batchesBySchool.get(schoolId) || []
    const studentDocs = studentsBySchool.get(schoolId) || []
    const teacherDocs = teachersBySchool.get(schoolId) || []

    // No Student Feedback anywhere in this school -> no classes -> nothing
    // to export. (Teacher Feedback alone, with no class to attach to, no
    // longer produces any rows — this export is CLASS + TOUR level, not a
    // standalone Teacher block.)
    if (studentDocs.length === 0) return

    const gradeProgress = computeGradeFeedbackProgressFromDocs(
      batchDocs,
      studentDocs.map((doc) => ({ grade: doc.grade })),
    )
    const status = getSchoolStatusFromProgress(teacherDocs.length, gradeProgress)
    const isCompleted = computeSchoolOverallStatus(status) === SCHOOL_STATUS.COMPLETED

    let completionDate = ''
    if (isCompleted) {
      const lastActivity = getSchoolLastActivityDate({ batchDocs, studentDocs, teacherDocs })
      completionDate = lastActivity ? formatIsoDate(lastActivity) : ''
    }
    const submissionDate = completionDate

    // Latest TeacherFeedback per tour represents that tour's current record
    // (a school can, in principle, have more than one TeacherFeedback per
    // tour across different months/financial years). This attaches onto
    // the school's FIRST class block only — see the `isFirstClassBlock`
    // flag below.
    const teacherByTour = new Map()
    teacherDocs.forEach((doc) => {
      const existing = teacherByTour.get(doc.tourId)
      if (!existing || new Date(doc.createdAt) > new Date(existing.createdAt)) {
        teacherByTour.set(doc.tourId, doc)
      }
    })

    const batchByGrade = new Map(batchDocs.map((batch) => [batch.grade, batch]))
    const studentsByGrade = new Map()
    studentDocs.forEach((doc) => {
      if (!studentsByGrade.has(doc.grade)) studentsByGrade.set(doc.grade, [])
      studentsByGrade.get(doc.grade).push(doc)
    })

    const gradesWithData = REQUIRED_GRADES.filter((grade) => (studentsByGrade.get(grade)?.length ?? 0) > 0)

    // session_id's final XXX is a CLASS-level identifier: every tour row of
    // the same class shares the exact same XXX, it increments once per
    // class (never per tour row), and restarts at 001 for each new school.
    let classSequence = 0
    let isFirstClassBlock = true

    gradesWithData.forEach((grade) => {
      const gradeStudents = studentsByGrade.get(grade)
      const batch = batchByGrade.get(grade)
      const studentCount = batch ? batch.studentCount : ''
      const requiredTarget = batch ? computeRequiredFeedbackCount(batch.studentCount) : null
      classSequence += 1
      const classSequenceStr = String(classSequence).padStart(3, '0')

      // session_id's date and month_name keep their original source — the
      // student submissions' own createdAt/month — rather than switching to
      // a different record (the batch), even though a row now aggregates
      // many students: the LATEST submission in the class stands in for
      // "the" date/month, same as it would for the last individual student
      // row under the old per-student layout.
      const latestGradeSubmission = gradeStudents.reduce((latest, doc) => {
        const createdAt = new Date(doc.createdAt)
        return !latest || createdAt > new Date(latest.createdAt) ? doc : latest
      }, null)
      const sessionDate = latestGradeSubmission?.createdAt
        ? formatYYYYMMDD(new Date(latestGradeSubmission.createdAt))
        : ''
      const monthNumber = latestGradeSubmission ? getMonthNumber(latestGradeSubmission.month) : ''

      AFE_TOUR_SEQUENCE.forEach((tourId) => {
        const tourMeta = getAfeTourMeta(tourId)
        const matchingAnswers = gradeStudents
          .map((doc) => doc.tours.find((tour) => tour.tourId === tourId))
          .filter(Boolean)

        const teacherDoc = isFirstClassBlock ? teacherByTour.get(tourId) : null
        const hasStudentData = matchingAnswers.length > 0
        const hasTeacherData = Boolean(teacherDoc)
        // Additive per the client spec: Student(1) + Teacher(2) = Both(3).
        // A class already known to have Student Feedback always represents
        // at least the student side, even on the rare tour with zero
        // matching answers within it — unit_type must never be 0.
        const unitType =
          (hasStudentData ? AFE_UNIT_TYPE_STUDENT : 0) + (hasTeacherData ? AFE_UNIT_TYPE_TEACHER : 0) ||
          AFE_UNIT_TYPE_STUDENT

        const row = buildSharedRowFields({
          school,
          tourMeta,
          unitType,
          completionDate,
          submissionDate,
          meta: { grade, tourCode: tourMeta.code, unitType, classSequence },
        })
        row.grade_of_students = grade
        row.student_csat = average(matchingAnswers.map((answer) => answer.enjoyment))
        row.itp_avg = average(matchingAnswers.map((answer) => answer.interestInFutureCareer))
        row.response_rate_percentage = requiredTarget
          ? Math.round((matchingAnswers.length / requiredTarget) * 100)
          : ''
        row.educator_nps = teacherDoc ? teacherDoc.recommendScore : ''
        row.month_name = monthNumber
        row.student_count = studentCount
        // Class-level identifier: identical for all 3 tour rows of the same
        // class (same school + same class -> same XXX), increments once per
        // class, restarts at 001 for every new school.
        row.session_id = sessionDate ? `CT_IN_${sessionDate}_${school.udise}_${grade}_CLASS_${classSequenceStr}` : ''
        // Distinct per row (unlike session_id) — deterministic and stable,
        // built from UDISE + class + class-sequence + tour, so it never
        // collides with another row and never repeats across regenerations
        // of the same underlying data.
        row.Id = `AFE-${school.udise}-${grade}-${classSequenceStr}-${tourMeta.code}`
        rows.push(row)
      })

      isFirstClassBlock = false
    })

    const staleGrades = [...studentsByGrade.keys()].filter((grade) => !REQUIRED_GRADES.includes(grade))
    if (staleGrades.length > 0) {
      // Should never happen — the Teacher Portal only ever offers grades
      // 6-12 (REQUIRED_GRADES) when starting a Student Feedback batch. Not
      // fatal to export generation, but worth surfacing loudly if it ever
      // does, since those rows are silently excluded from the file above.
      console.warn(
        `AFE Official export: school ${school.udise} has StudentFeedback for unexpected grade(s) ${staleGrades.join(', ')} — excluded from export.`,
      )
    }
  })

  return rows
}

function fixedValueIssue(issues, index, column, actual, expected) {
  if (actual !== expected) {
    issues.push(`Row ${index}: "${column}" must be ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`)
  }
}

// Structural + business-rule validation, run on every generated dataset
// before it's ever turned into a file or sent to the browser — see client
// spec section 49. Throws ApiError(500) with the full issue list in
// `details` (also logged) rather than silently shipping a malformed export.
export function validateAfeOfficialRows(rows) {
  const issues = []

  rows.forEach((row, index) => {
    const keys = Object.keys(row)
    const schemaMatches =
      keys.length === AFE_OFFICIAL_COLUMNS.length && AFE_OFFICIAL_COLUMNS.every((column, i) => keys[i] === column)
    if (!schemaMatches) {
      issues.push(`Row ${index}: column set/order does not match the locked 73-column AFE schema.`)
    }

    AFE_ALWAYS_EMPTY_COLUMNS.forEach((column) => {
      if (row[column] !== '') {
        issues.push(`Row ${index}: "${column}" must be empty, got ${JSON.stringify(row[column])}.`)
      }
    })

    fixedValueIssue(issues, index, 'DeviceId', row.DeviceId, AFE_DEVICE_ID)
    fixedValueIssue(issues, index, 'cc', row.cc, AFE_COUNTRY_CODE)
    fixedValueIssue(issues, index, 'state', row.state, AFE_STATE)
    fixedValueIssue(issues, index, 'school_year', row.school_year, AFE_SCHOOL_YEAR)
    fixedValueIssue(issues, index, 'school_type', row.school_type, AFE_SCHOOL_TYPE)
    fixedValueIssue(issues, index, 'data_collection_method', row.data_collection_method, AFE_DATA_COLLECTION_METHOD)
    fixedValueIssue(issues, index, 'partner_name', row.partner_name, AFE_PARTNER_NAME)
    fixedValueIssue(issues, index, 'language', row.language, AFE_LANGUAGE)
    fixedValueIssue(issues, index, 'underserved_reach', row.underserved_reach, AFE_UNDERSERVED_REACH)
    fixedValueIssue(issues, index, 'distribution_channel_host', row.distribution_channel_host, AFE_DISTRIBUTION_CHANNEL_HOST)
    fixedValueIssue(issues, index, 'completion_rate', row.completion_rate, AFE_COMPLETION_RATE)
    fixedValueIssue(issues, index, 'video_completion_rate', row.video_completion_rate, AFE_VIDEO_COMPLETION_RATE)
    fixedValueIssue(issues, index, 'academic_year', row.academic_year, AFE_ACADEMIC_YEAR_ID)

    if (![1, 2, 3].includes(row.product_name) || row.product_name !== row.tour_id) {
      issues.push(`Row ${index}: product_name/tour_id must both be 1 (AWS), 2 (Robotics), or 3 (Music) and match — got product_name=${row.product_name}, tour_id=${row.tour_id}.`)
    }
    if (![AFE_UNIT_TYPE_STUDENT, AFE_UNIT_TYPE_TEACHER, AFE_UNIT_TYPE_BOTH].includes(row.unit_type)) {
      issues.push(`Row ${index}: unit_type must be 1 (Student), 2 (Teacher), or 3 (Both), got ${JSON.stringify(row.unit_type)}.`)
    }
    if (row.completion_date !== row.submission_date) {
      issues.push(`Row ${index}: completion_date and submission_date must match (both are the school completion date).`)
    }
    if (!row.Id) {
      issues.push(`Row ${index}: Id must not be empty.`)
    }
  })

  // Id must be unique across the whole export (client spec: "must be
  // unique per exported row").
  const seenIds = new Set()
  rows.forEach((row, index) => {
    if (row.Id && seenIds.has(row.Id)) {
      issues.push(`Row ${index}: Id "${row.Id}" is not unique — it was already used by an earlier row.`)
    }
    seenIds.add(row.Id)
  })

  // Grouping/ordering invariants: schools never interleaved, exactly
  // AFE_ROWS_PER_CLASS (3) rows per class in AWS -> Robotics -> Music order,
  // class order ascending, teacher-attached unit_type (2 or 3) only within a
  // school's first class block, and session_id shared identically across
  // all 3 tour rows of the same class.
  let previousUdise = null
  const seenSchools = new Set()
  let positionInSchool = 0
  let lastGradeRank = -Infinity
  let firstSessionIdInClass = null

  rows.forEach((row, index) => {
    if (row.school_udise !== previousUdise) {
      if (seenSchools.has(row.school_udise)) {
        issues.push(`Row ${index}: schools are interleaved — "${row.school_udise}" reappeared after another school's block started.`)
      }
      seenSchools.add(row.school_udise)
      previousUdise = row.school_udise
      positionInSchool = 0
      lastGradeRank = -Infinity
    }

    const meta = row.__meta
    const positionInClass = positionInSchool % AFE_ROWS_PER_CLASS
    const expectedTourCode = positionInClass + 1
    if (row.tour_id !== expectedTourCode) {
      issues.push(`Row ${index}: tour order broken at position ${positionInClass} of a class for school "${row.school_udise}" — expected tour_id ${expectedTourCode}, got ${row.tour_id}.`)
    }

    const isFirstClassBlock = positionInSchool < AFE_ROWS_PER_CLASS
    if (!isFirstClassBlock && row.unit_type !== AFE_UNIT_TYPE_STUDENT) {
      issues.push(`Row ${index}: unit_type ${row.unit_type} outside school "${row.school_udise}"'s first class block — Teacher data must only attach to the first class.`)
    }

    if (positionInClass === 0) {
      firstSessionIdInClass = row.session_id
      if (meta) {
        const gradeRank = Number(meta.grade)
        if (gradeRank < lastGradeRank) {
          issues.push(`Row ${index}: class order regressed to Grade ${meta.grade} for school "${row.school_udise}".`)
        }
        lastGradeRank = gradeRank
      }
    } else if (row.session_id !== firstSessionIdInClass) {
      issues.push(`Row ${index}: session_id "${row.session_id}" must be identical across all 3 tour rows of the same class (expected "${firstSessionIdInClass}").`)
    }

    positionInSchool += 1
  })

  if (issues.length > 0) {
    console.error('AFE CSV (Official) export failed validation:', issues)
    throw new ApiError(500, 'AFE CSV (Official) export failed validation. See server logs for details.', { issues })
  }
}

// Column-ordered value array for CSV serialization (see utils/csv.js).
export function toAfeCsvRow(row) {
  return AFE_OFFICIAL_COLUMNS.map((column) => row[column])
}

// Plain JSON-safe object (drops the internal, non-enumerable `__meta`) for
// the preview tab / workbook embedding — `{ ...row }` alone already excludes
// `__meta` since it's non-enumerable, this just documents that intent.
export function stripAfeRowMeta(row) {
  return { ...row }
}
