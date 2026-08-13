// Ported verbatim (including the fail-fast 73-column check) from
// server/src/constants/afeOfficialColumns.js — LOCKED by client spec.
// Column names, spelling, capitalization, order, and count must never
// change without an explicit new spec.
export const AFE_OFFICIAL_COLUMNS: string[] = [
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
// "null", "-", or any other placeholder. 'Id' and 'total_watch_time_seconds'
// are deliberately NOT in this set per later client corrections (see
// services/afeExport.service.ts).
export const AFE_ALWAYS_EMPTY_COLUMNS: Set<string> = new Set([
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
  throw new Error(`AFE_OFFICIAL_COLUMNS must have exactly 73 columns, has ${AFE_OFFICIAL_COLUMNS.length}.`)
}
