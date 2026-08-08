import * as XLSX from 'xlsx'
import {
  getCareerTourExportCode,
  getResponseExportCode,
  getMonthExportCode,
  FIXED_FEEDBACK_FINANCIAL_YEAR,
} from './exportMappings'

// "In which language did you watch the Career Tour?" is always exported as
// 1, regardless of whether Hindi or English was picked — a deliberate
// client requirement, not a lookup (getLanguageExportCode/LANGUAGE_EXPORT_CODE
// in exportMappings.js still exist but are no longer used for this column).
const FIXED_FEEDBACK_LANGUAGE_CODE = 1
import { sortByFeedbackHierarchy, sortBySchoolName } from '../../../utils/feedbackSort'

// NOTE: the AFE CSV (Official) format previously built here has moved
// entirely server-side — see server/src/services/afeExport.service.js and
// src/features/export/utils/afeOfficialExport.js. This file now only
// builds the (non-official) Student/Teacher Feedback CSV format below.

export const STUDENT_FEEDBACK_COLUMNS = [
  'Id*', 'CreatedAt', 'UpdatedAt', 'DeviceId*', 'MobileCreatedAt', 'MobileUpdatedAt', 'Location',
  'TimeTaken', 'parentResponseId', 'DistrictCode*', 'Financial Year', 'Month', 'Institution Type',
  'UDISE of School', 'School Name', 'State', 'District', 'Grade', 'Unit (Student/Teacher)',
  'Student Dummy Id or Teacher Email', 'Which Career Tour are you giving feedback on?',
  'In which language did you watch the Career Tour?',
  "How much did you enjoy this Career Tour? (1 =Didn't like it at all to 5 = Loved it)",
  'Please rate your overall experience of the tour (1 = Very Poor to 5 = Excellent)',
  'After watching the career tour how interested are you in learning more about careers of the future? (1 = Not at all interested to 5 = Very interested)',
  'Did the tour make you want to explore a career of the future for yourself?',
  'Would you like to see more tours like this?',
  'On a scale of 0-10 how likely are you to recommend to this Tour to other teachers/schools?  (0-Not at all likely 10-Extremely likely)',
  'How satisfied are you with the resources provided (Teacher Toolkit worksheets facilitation guide)?  (1 = Extremely dissatisfied to 5 = Extremely satisfied)',
  'How easy was it to integrate this tour into your classroom lesson plan? (1 = Extremely difficult to 5 = Extremely easy)',
  'What was the biggest benefit for your students from this tour?',
  'What improvements would you suggest for future tours?',
]

// Same column name as STUDENT_FEEDBACK_COLUMNS' "Student Dummy Id or
// Teacher Email" (both forms use the identical header) and no separate
// "Email" column — Teacher Feedback has no student dummy ID, so that column
// exclusively carries the teacher's actual email address here.
export const TEACHER_FEEDBACK_COLUMNS = [
  'Id*', 'CreatedAt', 'UpdatedAt', 'DeviceId*', 'MobileCreatedAt', 'MobileUpdatedAt', 'Location',
  'TimeTaken', 'parentResponseId', 'DistrictCode*', 'Financial Year', 'Month', 'Institution Type',
  'UDISE of School', 'School Name', 'State', 'District', 'Grade', 'Unit (Student/Teacher)',
  'Student Dummy Id or Teacher Email', 'Which Career Tour are you giving feedback on?',
  'In which language did you watch the Career Tour?',
  "How much did you enjoy this Career Tour? (1 =Didn't like it at all to 5 = Loved it)",
  'Please rate your overall experience of the tour (1 = Very Poor to 5 = Excellent)',
  'After watching the career tour how interested are you in learning more about careers of the future? (1 = Not at all interested to 5 = Very interested)',
  'Did the tour make you want to explore a career of the future for yourself?',
  'Would you like to see more tours like this?',
  'On a scale of 0-10 how likely are you to recommend to this Tour to other teachers/schools?  (0-Not at all likely 10-Extremely likely)',
  'How satisfied are you with the resources provided (Teacher Toolkit worksheets facilitation guide)?  (1 = Extremely dissatisfied to 5 = Extremely satisfied)',
  'How easy was it to integrate this tour into your classroom lesson plan? (1 = Extremely difficult to 5 = Extremely easy)',
  'What was the biggest benefit for your students from this tour?',
  'What improvements would you suggest for future tours?',
]

const REQUIRED_COLUMNS = new Set(['Id*', 'DeviceId*', 'DistrictCode*'])

export function isColumnRequired(column) {
  return REQUIRED_COLUMNS.has(column)
}

export function isCellMissing(column, value) {
  return isColumnRequired(column) && (value === '' || value === null || value === undefined)
}

function inDateRange(createdAt, range) {
  if (!range?.start || !range?.end) return true
  if (!createdAt) return true // no date recorded yet — don't silently drop rows
  const date = new Date(createdAt)
  return date >= range.start && date <= range.end
}

function makeId(prefix, udise, tourId, suffix = '') {
  return `${prefix}-${udise}-${tourId}${suffix}`
}

// Applies the required School -> Grade -> Student/Teacher -> Career Tour
// ordering (see src/utils/feedbackSort.js) before any export rows are
// built — downloaded Excel/CSV/AFE files must come out in exactly the same
// order the dashboard tables display, per the client's export requirement.
function sortSchoolsForExport(schools) {
  return sortBySchoolName(schools, (school) => school.schoolName).map((school) => ({
    ...school,
    studentFeedback: sortByFeedbackHierarchy(school.studentFeedback, (row) => ({
      schoolName: school.schoolName,
      grade: row.grade,
      type: 'Student',
      identifier: row.studentDummyId,
      tourId: row.tourId,
    })),
    teacherFeedback: sortByFeedbackHierarchy(school.teacherFeedback, (row) => ({
      schoolName: school.schoolName,
      grade: null,
      type: 'Teacher',
      identifier: row.email || row.submittedBy,
      tourId: row.tourId,
    })),
  }))
}

// District Code comes straight from the school's own backend-saved value
// (school.districtCode, from Export Data -> Programme Setup -> Per-School
// District Code & Postal Code) — never a browser-only/fake value, and never
// shared across schools.
export function buildFeedbackRows(schools, setup, unit, range) {
  const rows = []
  const sortedSchools = sortSchoolsForExport(schools)

  if (unit === 'student') {
    sortedSchools.forEach((school) => {
      school.studentFeedback
        .filter((row) => inDateRange(row.createdAt, range))
        .forEach((row) => {
          rows.push({
            'Id*': makeId('sf', school.udise, row.tourId, `-${row.grade}-${row.studentDummyId}`),
            CreatedAt: '',
            UpdatedAt: '',
            'DeviceId*': setup.deviceId,
            MobileCreatedAt: '',
            MobileUpdatedAt: '',
            Location: '',
            TimeTaken: '',
            parentResponseId: '',
            'DistrictCode*': school.districtCode || '',
            'Financial Year': FIXED_FEEDBACK_FINANCIAL_YEAR,
            Month: getMonthExportCode(row.month),
            'Institution Type': setup.institutionType,
            'UDISE of School': school.udise,
            'School Name': school.schoolName,
            State: school.state,
            District: school.district,
            Grade: row.grade,
            'Unit (Student/Teacher)': 1,
            'Student Dummy Id or Teacher Email': row.studentDummyId || '',
            'Which Career Tour are you giving feedback on?': getCareerTourExportCode(row.tourId),
            'In which language did you watch the Career Tour?': FIXED_FEEDBACK_LANGUAGE_CODE,
            "How much did you enjoy this Career Tour? (1 =Didn't like it at all to 5 = Loved it)": row.enjoyment,
            'Please rate your overall experience of the tour (1 = Very Poor to 5 = Excellent)': row.overallExperience,
            'After watching the career tour how interested are you in learning more about careers of the future? (1 = Not at all interested to 5 = Very interested)': row.interestInFutureCareer,
            'Did the tour make you want to explore a career of the future for yourself?': getResponseExportCode(row.wantExploreCareer),
            'Would you like to see more tours like this?': getResponseExportCode(row.wantMoreTours),
            'On a scale of 0-10 how likely are you to recommend to this Tour to other teachers/schools?  (0-Not at all likely 10-Extremely likely)': '',
            'How satisfied are you with the resources provided (Teacher Toolkit worksheets facilitation guide)?  (1 = Extremely dissatisfied to 5 = Extremely satisfied)': '',
            'How easy was it to integrate this tour into your classroom lesson plan? (1 = Extremely difficult to 5 = Extremely easy)': '',
            'What was the biggest benefit for your students from this tour?': '',
            'What improvements would you suggest for future tours?': '',
          })
        })
    })
    return rows
  }

  sortedSchools.forEach((school) => {
    school.teacherFeedback
      .filter((row) => inDateRange(row.createdAt, range))
      .forEach((row) => {
        rows.push({
          'Id*': makeId('tf', school.udise, row.tourId, `-${row.month}`),
          CreatedAt: '',
          UpdatedAt: '',
          'DeviceId*': setup.deviceId,
          MobileCreatedAt: '',
          MobileUpdatedAt: '',
          Location: '',
          TimeTaken: '',
          parentResponseId: '',
          'DistrictCode*': school.districtCode || '',
          'Financial Year': FIXED_FEEDBACK_FINANCIAL_YEAR,
          Month: getMonthExportCode(row.month),
          'Institution Type': setup.institutionType,
          'UDISE of School': school.udise,
          'School Name': school.schoolName,
          State: school.state,
          District: school.district,
          Grade: '',
          'Unit (Student/Teacher)': 2,
          'Student Dummy Id or Teacher Email': row.email || '',
          'Which Career Tour are you giving feedback on?': getCareerTourExportCode(row.tourId),
          'In which language did you watch the Career Tour?': FIXED_FEEDBACK_LANGUAGE_CODE,
          "How much did you enjoy this Career Tour? (1 =Didn't like it at all to 5 = Loved it)": '',
          'Please rate your overall experience of the tour (1 = Very Poor to 5 = Excellent)': '',
          'After watching the career tour how interested are you in learning more about careers of the future? (1 = Not at all interested to 5 = Very interested)': '',
          'Did the tour make you want to explore a career of the future for yourself?': '',
          'Would you like to see more tours like this?': '',
          'On a scale of 0-10 how likely are you to recommend to this Tour to other teachers/schools?  (0-Not at all likely 10-Extremely likely)': row.recommendScore,
          'How satisfied are you with the resources provided (Teacher Toolkit worksheets facilitation guide)?  (1 = Extremely dissatisfied to 5 = Extremely satisfied)': row.satisfactionResources,
          'How easy was it to integrate this tour into your classroom lesson plan? (1 = Extremely difficult to 5 = Extremely easy)': row.easeIntegration,
          'What was the biggest benefit for your students from this tour?': row.biggestBenefit || '',
          'What improvements would you suggest for future tours?': row.improvements || '',
        })
      })
  })

  return rows
}

export function downloadCsv(filename, columns, rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: columns })
  const csv = XLSX.utils.sheet_to_csv(worksheet)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
