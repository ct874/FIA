import * as XLSX from 'xlsx'
import { flattenSchoolTours } from '../../../data/schoolRecords.derive'
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

function getEntryDate(tour) {
  const raw = tour.studentFeedback?.submittedAt || tour.teacherFeedback?.submittedAt
  return raw ? new Date(raw) : null
}

function entryInDateRange(tour, range) {
  if (!range?.start || !range?.end) return true
  const date = getEntryDate(tour)
  if (!date) return true // no date recorded yet — don't silently drop dummy rows
  return date >= range.start && date <= range.end
}

function makeId(prefix, school, tour, classRecord, suffix = '') {
  return `${prefix}-${school.udise}-${tour.tourId}-${classRecord.grade}${suffix}`
}

function filteredEntries(schools, range) {
  return flattenSchoolTours(schools).filter(({ tour }) => entryInDateRange(tour, range))
}

export function buildStudentReachRows(schools, setup, range) {
  const codes = getSchoolExportCodes()

  return filteredEntries(schools, range)
    .filter(({ tour }) => tour.reach)
    .map(({ school, classRecord, tour }) => {
      const code = codes[school.udise] || {}
      return {
        'Id*': makeId('reach', school, tour, classRecord),
        CreatedAt: '',
        UpdatedAt: '',
        'DeviceId*': setup.deviceId,
        MobileCreatedAt: '',
        MobileUpdatedAt: '',
        Location: '',
        TimeTaken: '',
        parentResponseId: '',
        'DistrictCode*': code.districtCode || '',
        'Financial year': setup.financialYear,
        Month: tour.month,
        'Institution Type': setup.institutionType,
        State: school.state,
        District: school.district,
        'What type of school is this?': setup.schoolType,
        'Specify other': '',
        'UDISE of School': school.udise,
        'School Name': school.schoolName,
        Grade: classRecord.grade,
        'Class Section': classRecord.section,
        'Unit (Student/Teacher)': 1,
        'Email ID (Optional)': '',
        'Which career tour did you attend?': TOUR_SEQUENCE[tour.tourId],
        'In which language did you watch the Career Tour?': tour.language,
        'No. of Students Reached': tour.reach.studentsReached,
        'Total Unique Student Count': tour.reach.uniqueStudentCount,
      }
    })
}

export function buildFeedbackRows(schools, setup, unit, range) {
  const codes = getSchoolExportCodes()
  const entries = filteredEntries(schools, range)

  if (unit === 'student') {
    return entries
      .filter(({ tour }) => tour.studentFeedback)
      .map(({ school, classRecord, tour }) => {
        const code = codes[school.udise] || {}
        const feedback = tour.studentFeedback
        return {
          'Id*': makeId('sf', school, tour, classRecord),
          CreatedAt: '',
          UpdatedAt: '',
          'DeviceId*': setup.deviceId,
          MobileCreatedAt: '',
          MobileUpdatedAt: '',
          Location: '',
          TimeTaken: '',
          parentResponseId: '',
          'DistrictCode*': code.districtCode || '',
          'Financial Year': setup.financialYear,
          Month: tour.month,
          'Institution Type': setup.institutionType,
          'UDISE of School': school.udise,
          'School Name': school.schoolName,
          State: school.state,
          District: school.district,
          Grade: classRecord.grade,
          'Unit (Student/Teacher)': 1,
          'Student Dummy Id or Teacher Email': '',
          'Which Career Tour are you giving feedback on?': TOUR_SEQUENCE[tour.tourId],
          'In which language did you watch the Career Tour?': tour.language,
          "How much did you enjoy this Career Tour? (1 =Didn't like it at all to 5 = Loved it)": feedback.csatAvg,
          'Please rate your overall experience of the tour (1 = Very Poor to 5 = Excellent)': feedback.csatAvg,
          'After watching the career tour how interested are you in learning more about careers of the future? (1 = Not at all interested to 5 = Very interested)': feedback.itpAvg,
          'Did the tour make you want to explore a career of the future for yourself?': '',
          'Would you like to see more tours like this?': '',
          'On a scale of 0-10 how likely are you to recommend to this Tour to other teachers/schools?  (0-Not at all likely 10-Extremely likely)': '',
          'How satisfied are you with the resources provided (Teacher Toolkit worksheets facilitation guide)?  (1 = Extremely dissatisfied to 5 = Extremely satisfied)': '',
          'How easy was it to integrate this tour into your classroom lesson plan? (1 = Extremely difficult to 5 = Extremely easy)': '',
          'What was the biggest benefit for your students from this tour?': '',
          'What improvements would you suggest for future tours?': '',
        }
      })
  }

  return entries
    .filter(({ tour }) => tour.teacherFeedback)
    .map(({ school, classRecord, tour }) => {
      const code = codes[school.udise] || {}
      const feedback = tour.teacherFeedback
      return {
        'Id*': makeId('tf', school, tour, classRecord),
        CreatedAt: '',
        UpdatedAt: '',
        'DeviceId*': setup.deviceId,
        MobileCreatedAt: '',
        MobileUpdatedAt: '',
        Location: '',
        TimeTaken: '',
        parentResponseId: '',
        'DistrictCode*': code.districtCode || '',
        'Financial Year': setup.financialYear,
        Month: tour.month,
        'Institution Type': setup.institutionType,
        'UDISE of School': school.udise,
        'School Name': school.schoolName,
        State: school.state,
        District: school.district,
        Grade: classRecord.grade,
        'Unit (Student/Teacher)': 2,
        'Student Dummy Id or Teacher Email': school.teacherContact?.email || '',
        'Which Career Tour are you giving feedback on?': TOUR_SEQUENCE[tour.tourId],
        'In which language did you watch the Career Tour?': tour.language,
        "How much did you enjoy this Career Tour? (1 =Didn't like it at all to 5 = Loved it)": feedback.enjoyment,
        'Please rate your overall experience of the tour (1 = Very Poor to 5 = Excellent)': feedback.overallExperience,
        'After watching the career tour how interested are you in learning more about careers of the future? (1 = Not at all interested to 5 = Very interested)': feedback.itp,
        'Did the tour make you want to explore a career of the future for yourself?': feedback.wantExploreCareer ? 'Yes' : 'No',
        'Would you like to see more tours like this?': feedback.wantMoreTours ? 'Yes' : 'No',
        'On a scale of 0-10 how likely are you to recommend to this Tour to other teachers/schools?  (0-Not at all likely 10-Extremely likely)': feedback.nps,
        'How satisfied are you with the resources provided (Teacher Toolkit worksheets facilitation guide)?  (1 = Extremely dissatisfied to 5 = Extremely satisfied)': feedback.satisfactionResources,
        'How easy was it to integrate this tour into your classroom lesson plan? (1 = Extremely difficult to 5 = Extremely easy)': feedback.easeIntegration,
        'What was the biggest benefit for your students from this tour?': feedback.biggestBenefit,
        'What improvements would you suggest for future tours?': feedback.improvements,
      }
    })
}

export function buildAfeRows(schools, setup, range) {
  const codes = getSchoolExportCodes()
  const entries = filteredEntries(schools, range)
  const rows = []

  entries.forEach(({ school, classRecord, tour }) => {
    const code = codes[school.udise] || {}
    const duration = setup.tourDurations?.[tour.tourId] ?? 'NA'
    const shared = {
      distribution_channel_host_id: TOUR_HOST_ID[tour.tourId],
      product_name: tour.tourName,
      unique_student_id: 'NA',
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
      tour_id: tour.tourId,
      data_collection_method: setup.dataCollectionMethod,
      partner_name: setup.partnerName,
      academic_year: setup.financialYear,
      month_name: tour.month,
      school_udise: school.udise,
      school_name: school.schoolName,
      school_type: setup.schoolType,
      language: tour.language,
      session_duration_minutes: duration,
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
    }

    if (tour.studentFeedback) {
      rows.push({
        ...shared,
        student_csat: tour.studentFeedback.csatAvg,
        underserved_reach: setup.underservedReach,
        grade_of_students: classRecord.grade,
        educator_id: 'NA',
        educator_nps: 'NA',
        session_id: makeId('CT_IN', school, tour, classRecord, '_CLASS'),
        class_section: classRecord.section || 'NA',
        unit_type: 'Student',
        student_count: tour.reach?.uniqueStudentCount ?? 'NA',
        itp_avg: tour.studentFeedback.itpAvg,
        response_rate_percentage: tour.studentFeedback.responseRatePercentage,
        video_completion_rate: tour.studentFeedback.videoCompletionRate,
        completion_percentage: tour.studentFeedback.responseRatePercentage,
        facilitator_name: tour.teacherFeedback?.submittedBy || 'NA',
        teacher_feedback_text: 'NA',
        implementation_challenges: 'NA',
      })
    }

    if (tour.teacherFeedback) {
      rows.push({
        ...shared,
        student_csat: 'NA',
        underserved_reach: setup.underservedReach,
        grade_of_students: 'NA',
        educator_id: 'NA',
        educator_nps: tour.teacherFeedback.nps,
        session_id: makeId('CT_IN', school, tour, classRecord, '_TEACHER'),
        class_section: 'NA',
        unit_type: 'Teacher',
        student_count: 'NA',
        itp_avg: 'NA',
        response_rate_percentage: 'NA',
        video_completion_rate: 'NA',
        completion_percentage: 'NA',
        facilitator_name: tour.teacherFeedback.submittedBy,
        teacher_feedback_text: tour.teacherFeedback.biggestBenefit || 'NA',
        implementation_challenges: tour.teacherFeedback.improvements || 'NA',
      })
    }
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
