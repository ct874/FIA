/**
 * Canonical per-school data shape. Everything the Admin dashboard and Teacher
 * dashboard render is derived from arrays of this shape — today from
 * `schoolRecords.data.js` (hardcoded), later from a single API response with
 * the same fields, so swapping the source requires no changes downstream.
 *
 * Field names/scales below are taken directly from the partner CSV exports
 * (Form 1 - Student Reach Data, Form 2 - Teacher Feedback, AFE Tour session
 * export) and the PARTNER_DATA_COLLECTION_GUIDE metric formulas:
 *
 * @typedef {Object} SchoolRecord
 * @property {string} udise - 10-11 digit school code. Used as the school's
 *   unique id and, once registered, as the teacher's login username AND
 *   default password.
 * @property {string} schoolName
 * @property {string} district
 * @property {string} state
 * @property {string} schoolType - e.g. "Government"
 * @property {{ name: string, phone: string, email?: string } | null} teacherContact
 *   Populated from the Admin-uploaded school list (Excel). Null until a school
 *   has been registered.
 * @property {ClassRecord[]} classes
 *
 * @typedef {Object} ClassRecord
 * @property {string} grade - e.g. "6"
 * @property {string} section
 * @property {TourEntry[]} tours
 *
 * @typedef {Object} TourEntry
 * @property {string} tourId
 * @property {string} tourName
 * @property {string} month
 * @property {string} language
 * @property {ReachData | null} reach - Form 1: student reach/unique count
 * @property {StudentFeedback | null} studentFeedback - Form 2 (student) + AFE aggregate
 * @property {TeacherFeedback | null} teacherFeedback - Form 2 (teacher)
 *
 * @typedef {Object} ReachData
 * @property {number} studentsReached - reach per video watched
 * @property {number} uniqueStudentCount - unique students across all videos in the tour
 *
 * @typedef {Object} StudentFeedback
 * @property {number} totalStudents
 * @property {number} respondedCount
 * @property {number} responseRatePercentage - (respondedCount / totalStudents) * 100
 * @property {number} csatAvg - 1-5 scale, PDF "CSAT Average" formula
 * @property {number} itpAvg - 1-5 scale, PDF "ITP Average" formula
 * @property {number} videoCompletionRate - % of videos watched >= 80% duration
 * @property {string} submittedAt - ISO date
 *
 * @typedef {Object} TeacherFeedback
 * @property {string} submittedBy - facilitator/teacher name
 * @property {number} enjoyment - 1-5
 * @property {number} overallExperience - 1-5
 * @property {number} itp - 1-5, teacher's own intent-to-explore rating
 * @property {boolean} wantExploreCareer
 * @property {boolean} wantMoreTours
 * @property {number} satisfactionResources - 1-5
 * @property {number} easeIntegration - 1-5
 * @property {string} biggestBenefit
 * @property {string} improvements
 * @property {number} nps - classroom-aggregate NPS %, PDF "% Promoters - % Detractors" formula
 * @property {string} submittedAt - ISO date
 */

export const TOURS = {
  AM: { id: 'CT-L-AM-01', name: 'Amazon Music Career Tour' },
  AWS: { id: 'CT-L-AWS-01', name: 'AWS Data Center Tour: Uncovering Cloud Computing' },
  FC: { id: 'CT-L-FC-01', name: 'Robotics Fulfillment Center Tour' },
}
