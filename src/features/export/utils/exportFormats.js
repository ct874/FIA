import * as XLSX from 'xlsx'
import { TOURS } from '../../../data/schoolRecords.schema'
import { getSchoolExportCodes } from '../../../services/schoolExportCodes.service'

const TOUR_SEQUENCE = { [TOURS.AM.id]: 1, [TOURS.AWS.id]: 2, [TOURS.FC.id]: 3 }

const TOUR_HOST_ID = {
  [TOURS.AM.id]: 'AFE-IN-AM-YT-HI-2026',
  [TOURS.AWS.id]: 'AFE-IN-AWS-YT-HI-2026',
  [TOURS.FC.id]: 'AFE-IN-FC-YT-HI-2026',
}

export const STUDENT_REACH_COLUMNS = [
  'Id*', 'CreatedAt', 'UpdatedAt', 'DeviceId*', 'MobileCreatedAt', 'MobileUpdatedAt', 'Location',
  'TimeTaken', 'parentResponseId', 'DistrictCode*', 'Financial year', 'Month', 'Institution Type',
  'State', 'District', 'What type of school is this?', 'Specify other', 'UDISE of School',
  'School Name', 'Grade', 'Class Section', 'Unit (Student/Teacher)', 'Email ID (Optional)',
  'Which career tour did you attend?', 'In which language did you watch the Career Tour?',
  'No. of Students Reached', 'Total Unique Student Count',
]

export const FEEDBACK_COLUMNS = [
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

export const AFE_COLUMNS = [
  'distribution_channel_host_id', 'product_name', 'unique_student_id', 'cc', 'zipcode_postal_code',
  'completion_date', 'completion_rate', 'student_csat', 'underserved_reach', 'grade_of_students',
  'educator_id', 'educator_nps', 'distribution_channel_host', 'session_id', 'session_start_date',
  'session_end_date', 'session_start_time', 'session_stop_time', 'school_year', 'latitude',
  'longitude', 'state', 'city', 'district', 'tour_id', 'data_collection_method', 'partner_name',
  'academic_year', 'month_name', 'school_udise', 'school_name', 'school_type', 'class_section',
  'language', 'unit_type', 'student_count', 'itp_avg', 'session_duration_minutes',
  'response_rate_percentage', 'video_completion_rate', 'quiz_accuracy_percentage',
  'avg_watch_time_seconds', 'videos_completed_count', 'quizzes_completed_count',
  'total_questions_answered', 'correct_answers_count', 'session_completed_flag',
  'completion_percentage', 'total_watch_time_seconds', 'avg_playback_speed', 'pause_count_total',
  'seek_count_total', 'facilitator_name', 'teacher_confidence_rating', 'teacher_feedback_text',
  'implementation_challenges', 'device_type', 'platform_os', 'platform_version', 'app_version',
  'network_type', 'data_source', 'submission_date',
]

const REQUIRED_COLUMNS = new Set(['Id*', 'DeviceId*', 'DistrictCode*', 'zipcode_postal_code'])

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

export function buildStudentReachRows(schools, setup, range) {
  const codes = getSchoolExportCodes()
  const rows = []

  schools.forEach((school) => {
    const code = codes[school.udise] || {}
    school.reach
      .filter((reach) => inDateRange(reach.createdAt, range))
      .forEach((reach) => {
        reach.tours.forEach((tour) => {
          rows.push({
            'Id*': makeId('reach', school.udise, tour.tourId, `-${reach.grade}`),
            CreatedAt: '',
            UpdatedAt: '',
            'DeviceId*': setup.deviceId,
            MobileCreatedAt: '',
            MobileUpdatedAt: '',
            Location: '',
            TimeTaken: '',
            parentResponseId: '',
            'DistrictCode*': code.districtCode || '',
            'Financial year': reach.financialYear || setup.financialYear,
            Month: reach.month || '',
            'Institution Type': setup.institutionType,
            State: school.state,
            District: school.district,
            'What type of school is this?': setup.schoolType,
            'Specify other': '',
            'UDISE of School': school.udise,
            'School Name': school.schoolName,
            Grade: reach.grade,
            'Class Section': '',
            'Unit (Student/Teacher)': 1,
            'Email ID (Optional)': '',
            'Which career tour did you attend?': TOUR_SEQUENCE[tour.tourId],
            'In which language did you watch the Career Tour?': reach.language || '',
            'No. of Students Reached': reach.studentsReached,
            'Total Unique Student Count': reach.uniqueStudentCount,
          })
        })
      })
  })

  return rows
}

export function buildFeedbackRows(schools, setup, unit, range) {
  const codes = getSchoolExportCodes()
  const rows = []

  if (unit === 'student') {
    schools.forEach((school) => {
      const code = codes[school.udise] || {}
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
            'DistrictCode*': code.districtCode || '',
            'Financial Year': row.financialYear || setup.financialYear,
            Month: row.month || '',
            'Institution Type': setup.institutionType,
            'UDISE of School': school.udise,
            'School Name': school.schoolName,
            State: school.state,
            District: school.district,
            Grade: row.grade,
            'Unit (Student/Teacher)': 1,
            'Student Dummy Id or Teacher Email': row.studentDummyId || '',
            'Which Career Tour are you giving feedback on?': TOUR_SEQUENCE[row.tourId],
            'In which language did you watch the Career Tour?': row.language || '',
            "How much did you enjoy this Career Tour? (1 =Didn't like it at all to 5 = Loved it)": row.enjoyment,
            'Please rate your overall experience of the tour (1 = Very Poor to 5 = Excellent)': row.overallExperience,
            'After watching the career tour how interested are you in learning more about careers of the future? (1 = Not at all interested to 5 = Very interested)': row.interestInFutureCareer,
            'Did the tour make you want to explore a career of the future for yourself?': row.wantExploreCareer ? 'Yes' : 'No',
            'Would you like to see more tours like this?': row.wantMoreTours ? 'Yes' : 'No',
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

  schools.forEach((school) => {
    const code = codes[school.udise] || {}
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
          'DistrictCode*': code.districtCode || '',
          'Financial Year': row.financialYear || setup.financialYear,
          Month: row.month || '',
          'Institution Type': setup.institutionType,
          'UDISE of School': school.udise,
          'School Name': school.schoolName,
          State: school.state,
          District: school.district,
          Grade: '',
          'Unit (Student/Teacher)': 2,
          'Student Dummy Id or Teacher Email': row.contactNumber || '',
          'Which Career Tour are you giving feedback on?': TOUR_SEQUENCE[row.tourId],
          'In which language did you watch the Career Tour?': row.language || '',
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

export function buildAfeRows(schools, setup, range) {
  const codes = getSchoolExportCodes()
  const rows = []

  schools.forEach((school) => {
    const code = codes[school.udise] || {}

    const shared = (tourId, month) => ({
      distribution_channel_host_id: TOUR_HOST_ID[tourId],
      cc: setup.countryCode,
      zipcode_postal_code: code.postalCode || '',
      completion_date: '',
      completion_rate: 100,
      distribution_channel_host: 'AFE Website (YouTube)',
      session_start_date: 'NA',
      session_end_date: 'NA',
      session_start_time: 'NA',
      session_stop_time: 'NA',
      school_year: setup.financialYear,
      latitude: 'NA',
      longitude: 'NA',
      state: school.state,
      city: 'NA',
      district: school.district,
      tour_id: tourId,
      data_collection_method: setup.dataCollectionMethod,
      partner_name: setup.partnerName,
      academic_year: setup.financialYear,
      month_name: month || '',
      school_udise: school.udise,
      school_name: school.schoolName,
      school_type: setup.schoolType,
      session_duration_minutes: setup.tourDurations?.[tourId] ?? 'NA',
      quiz_accuracy_percentage: 'NA',
      avg_watch_time_seconds: 'NA',
      videos_completed_count: 'NA',
      quizzes_completed_count: 'NA',
      total_questions_answered: 'NA',
      correct_answers_count: 'NA',
      session_completed_flag: 'NA',
      total_watch_time_seconds: 'NA',
      avg_playback_speed: 'NA',
      pause_count_total: 'NA',
      seek_count_total: 'NA',
      teacher_confidence_rating: 'NA',
      device_type: 'NA',
      platform_os: 'NA',
      platform_version: 'NA',
      app_version: 'NA',
      network_type: 'NA',
      data_source: 'NA',
      submission_date: '',
    })

    school.studentFeedback
      .filter((row) => inDateRange(row.createdAt, range))
      .forEach((row) => {
        const reach = school.reach.find((r) => r.grade === row.grade)
        rows.push({
          ...shared(row.tourId, row.month),
          product_name: row.tourName,
          unique_student_id: row.studentDummyId || 'NA',
          student_csat: row.enjoyment,
          underserved_reach: setup.underservedReach,
          grade_of_students: row.grade,
          educator_id: 'NA',
          educator_nps: 'NA',
          session_id: makeId('CT_IN', school.udise, row.tourId, `_${row.grade}_CLASS`),
          class_section: 'NA',
          language: row.language || '',
          unit_type: 'Student',
          student_count: reach?.uniqueStudentCount ?? 'NA',
          itp_avg: row.interestInFutureCareer,
          response_rate_percentage: reach ? Math.round((reach.submittedCount / reach.target) * 100) : 'NA',
          video_completion_rate: 'NA',
          completion_percentage: reach ? Math.round((reach.submittedCount / reach.target) * 100) : 'NA',
          facilitator_name: 'NA',
          teacher_feedback_text: 'NA',
          implementation_challenges: 'NA',
        })
      })

    school.teacherFeedback
      .filter((row) => inDateRange(row.createdAt, range))
      .forEach((row) => {
        rows.push({
          ...shared(row.tourId, row.month),
          product_name: row.tourName,
          unique_student_id: 'NA',
          student_csat: 'NA',
          underserved_reach: setup.underservedReach,
          grade_of_students: 'NA',
          educator_id: 'NA',
          educator_nps: row.recommendScore,
          session_id: makeId('CT_IN', school.udise, row.tourId, `_${row.month}_TEACHER`),
          class_section: 'NA',
          language: row.language || '',
          unit_type: 'Teacher',
          student_count: 'NA',
          itp_avg: 'NA',
          response_rate_percentage: 'NA',
          video_completion_rate: 'NA',
          completion_percentage: 'NA',
          facilitator_name: row.submittedBy,
          teacher_feedback_text: row.biggestBenefit || 'NA',
          implementation_challenges: row.improvements || 'NA',
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
