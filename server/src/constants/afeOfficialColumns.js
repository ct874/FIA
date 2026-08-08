// The AFE CSV (Official) column schema — LOCKED by the client spec. Column
// names, spelling, capitalization, order, and count (73) must never change
// without an explicit new spec. Every row object built by
// afeExport.service.js must have exactly these keys, in exactly this order,
// and nothing else — validateAfeOfficialRows() below enforces that before
// any file is ever sent to a browser.
export const AFE_OFFICIAL_COLUMNS = [
  'Id', 'CreatedAt', 'UpdatedAt', 'DeviceId', 'MobileCreatedAt', 'MobileUpdatedAt', 'Location', 'TimeTaken',
  'parentResponseId', 'DistrictCode', 'distribution_channel_host_id', 'product_name', 'unique_student_id', 'cc',
  'zipcode_postal_code', 'completion_date', 'completion_rate', 'student_csat', 'underserved_reach',
  'grade_of_students', 'educator_id', 'educator_nps', 'distribution_channel_host', 'session_id',
  'session_start_date', 'session_end_date', 'session_start_time', 'session_stop_time', 'school_year', 'latitude',
  'longitude', 'state', 'city', 'district', 'tour_id', 'data_collection_method', 'partner_name', 'academic_year',
  'month_name', 'school_udise', 'school_name', 'school_type', 'class_section', 'language', 'unit_type',
  'student_count', 'itp_avg', 'session_duration_minutes', 'response_rate_percentage', 'video_completion_rate',
  'quiz_accuracy_percentage', 'avg_watch_time_seconds', 'videos_completed_count', 'quizzes_completed_count',
  'total_questions_answered', 'correct_answers_count', 'session_completed_flag', 'completion_percentage',
  'total_watch_time_seconds', 'avg_playback_speed', 'pause_count_total', 'seek_count_total', 'facilitator_name',
  'teacher_confidence_rating', 'teacher_feedback_text', 'implementation_challenges', 'device_type', 'platform_os',
  'platform_version', 'app_version', 'network_type', 'data_source', 'submission_date',
]

// Columns that MUST always be a physically empty cell — never 0, "NA",
// "null", "-", or any other placeholder. Some of these ARE conditionally
// populated by other business rules (none currently), so this set is the
// single source of truth both the row builder and the validator consult.
//
// NOTE: 'Id' is deliberately NOT in this set — per a later client
// correction, the first "Id" column must now carry a unique generated
// value per row (see afeExport.service.js), unlike the original spec which
// required it blank.
//
// NOTE: 'total_watch_time_seconds' is also deliberately NOT in this set —
// per a later client correction, it must carry the corresponding tour's
// configured duration in seconds (session_duration_minutes * 60), unlike
// the original spec which required it blank.
export const AFE_ALWAYS_EMPTY_COLUMNS = new Set([
  'CreatedAt', 'UpdatedAt', 'MobileCreatedAt', 'MobileUpdatedAt', 'Location', 'TimeTaken',
  'parentResponseId', 'unique_student_id', 'zipcode_postal_code', 'educator_id', 'session_start_date',
  'session_end_date', 'session_start_time', 'session_stop_time', 'latitude', 'longitude', 'city',
  'class_section', 'quiz_accuracy_percentage', 'avg_watch_time_seconds', 'videos_completed_count',
  'quizzes_completed_count', 'total_questions_answered', 'correct_answers_count', 'session_completed_flag',
  'completion_percentage', 'avg_playback_speed', 'pause_count_total',
  'seek_count_total', 'facilitator_name', 'teacher_confidence_rating', 'teacher_feedback_text',
  'implementation_challenges', 'device_type', 'platform_os', 'platform_version', 'app_version', 'network_type',
  'data_source',
])

if (AFE_OFFICIAL_COLUMNS.length !== 73) {
  // Fails loudly at import time (module load), not silently at export time —
  // the column count is the single most load-bearing invariant of this
  // whole feature.
  throw new Error(`AFE_OFFICIAL_COLUMNS must have exactly 73 columns, has ${AFE_OFFICIAL_COLUMNS.length}.`)
}
