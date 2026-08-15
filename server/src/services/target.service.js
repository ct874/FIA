import { School } from '../models/school.model.js'
import { StudentFeedbackBatch } from '../models/studentFeedbackBatch.model.js'
import { TeacherFeedback } from '../models/teacherFeedback.model.js'
import { Target } from '../models/target.model.js'
import { getCurrentFinancialYear } from '../utils/academicPeriod.js'
import { countUniqueTeacherResponses } from '../utils/teacherResponseCount.js'
import { ApiError } from '../utils/ApiError.js'

// Set Target screen access passcode — a lightweight UI confirmation gate in
// front of the target-editing form, NOT a substitute for real authentication.
// Every route in routes/target.routes.js already requires a valid Super
// Admin JWT (middleware/authenticate.js) before a request ever reaches this
// service; this constant only exists to satisfy the product's "re-enter a
// passcode before editing targets" UX requirement.
export const SET_TARGET_PASSCODE = 'fia@123'

function assertRequiredString(value, label) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) {
    throw new ApiError(400, `${label} is required.`)
  }
  return trimmed
}

function assertPositiveInteger(value, label) {
  const num = Number(value)
  if (!Number.isInteger(num) || num <= 0) {
    throw new ApiError(400, `${label} must be a positive whole number.`)
  }
  return num
}

function buildStat(target, achieved) {
  const remaining = Math.max(0, target - achieved)
  const progressPercent = target > 0 ? Math.round((achieved / target) * 100) : 0
  return { target, achieved, remaining, progressPercent }
}

// Dynamic district catalog for the Set Target form's dropdown — derived from
// real School records (one representative `state` per district), never
// hardcoded, matching the convention already used by
// getOverviewFilterOptions() in src/data/schoolRecords.derive.js.
export async function getDistrictOptions() {
  const grouped = await School.aggregate([
    { $group: { _id: '$district', state: { $first: '$state' } } },
    { $project: { _id: 0, district: '$_id', state: 1 } },
  ])

  return grouped
    .filter((entry) => entry.district)
    .sort((a, b) => a.district.localeCompare(b.district, 'en', { sensitivity: 'base' }))
}

// Creates or updates the one Target row for a given Financial Year + Month +
// District — re-submitting the same combination edits it in place instead of
// creating a duplicate (enforced by the model's compound unique index too).
export async function upsertTarget(superAdminId, payload = {}) {
  const financialYear = assertRequiredString(payload.financialYear, 'Financial Year')
  const month = assertRequiredString(payload.month, 'Month')
  const district = assertRequiredString(payload.district, 'District')
  const state = assertRequiredString(payload.state, 'State')
  const teacherTarget = assertPositiveInteger(payload.teacherTarget, 'Teacher Target')
  const studentTarget = assertPositiveInteger(payload.studentTarget, 'Student Target')

  try {
    const target = await Target.findOneAndUpdate(
      { financialYear, month, district },
      { $set: { state, teacherTarget, studentTarget }, $setOnInsert: { createdBy: superAdminId } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true, context: 'query' },
    )
    return target.toSafeJSON()
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(
        409,
        'A target for this Financial Year, Month, and District was just saved by someone else — please retry.',
      )
    }
    throw error
  }
}

// Live "where we stand, today" snapshot for the CURRENT financial year,
// summed across every month set so far for it. The Target Management
// dashboard has no period filter/selector — it always reflects "this year,
// right now", per the product requirement. Every district with a registered
// school gets an entry, even with no target configured and/or zero activity
// yet (the module's Zero State), so district cards are never hardcoded.
export async function getTargetProgress() {
  const financialYear = getCurrentFinancialYear()

  const [schools, targets, batchDocs, teacherDocs] = await Promise.all([
    School.find().select('_id district state'),
    Target.find({ financialYear }),
    // "Students Achieved" is the total number of students actually REACHED
    // by the program — StudentFeedbackBatch.studentCount (the class size
    // declared when a grade's Student Feedback batch was started/merged) —
    // NOT a count of StudentFeedback submission documents. A class of 30
    // only needing 40% (12) feedback forms back still counts as 30 reached,
    // not 12.
    StudentFeedbackBatch.find({ financialYear }).select('school studentCount'),
    TeacherFeedback.find({ financialYear }).select('school email submittedBy'),
  ])

  const schoolIdToDistrict = new Map()
  const stateByDistrict = new Map()
  schools.forEach((school) => {
    schoolIdToDistrict.set(String(school._id), school.district)
    if (!stateByDistrict.has(school.district)) stateByDistrict.set(school.district, school.state)
  })

  const byDistrict = new Map()
  const getEntry = (district) => {
    if (!byDistrict.has(district)) {
      byDistrict.set(district, {
        district,
        state: stateByDistrict.get(district) || '',
        teacherTarget: 0,
        studentTarget: 0,
        teacherDocs: [],
        studentsReached: 0,
      })
    }
    return byDistrict.get(district)
  }

  // Seed every real district first, so one with a target but no schools left
  // (or vice versa) never silently disappears from the card list.
  stateByDistrict.forEach((_state, district) => getEntry(district))

  targets.forEach((target) => {
    const entry = getEntry(target.district)
    entry.teacherTarget += target.teacherTarget
    entry.studentTarget += target.studentTarget
  })

  batchDocs.forEach((doc) => {
    const district = schoolIdToDistrict.get(String(doc.school))
    if (district) getEntry(district).studentsReached += doc.studentCount
  })

  teacherDocs.forEach((doc) => {
    const district = schoolIdToDistrict.get(String(doc.school))
    if (district) getEntry(district).teacherDocs.push(doc)
  })

  const districts = Array.from(byDistrict.values())
    .map((entry) => ({
      district: entry.district,
      state: entry.state,
      // One teacher submitting feedback for N tours is N TeacherFeedback
      // docs but ONE person — reuse the platform's single counting rule
      // rather than re-deriving it here.
      teacher: buildStat(entry.teacherTarget, countUniqueTeacherResponses(entry.teacherDocs)),
      student: buildStat(entry.studentTarget, entry.studentsReached),
    }))
    .sort((a, b) => a.district.localeCompare(b.district, 'en', { sensitivity: 'base' }))

  const sumAcross = (unit, key) => districts.reduce((sum, entry) => sum + entry[unit][key], 0)

  return {
    financialYear,
    districtsCovered: districts.length,
    students: {
      ...buildStat(sumAcross('student', 'target'), sumAcross('student', 'achieved')),
      districts: districts.map((entry) => ({ district: entry.district, state: entry.state, ...entry.student })),
    },
    teachers: {
      ...buildStat(sumAcross('teacher', 'target'), sumAcross('teacher', 'achieved')),
      districts: districts.map((entry) => ({ district: entry.district, state: entry.state, ...entry.teacher })),
    },
  }
}
