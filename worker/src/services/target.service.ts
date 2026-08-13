// Ported from server/src/services/target.service.js — district-level
// teacher/student count targets (Target Management module). Distinct from
// utils/studentFeedbackTarget.ts's unrelated 40%-of-class quota.
import type { Env } from '../env'
import { getDistrictOptions as repoGetDistrictOptions, listAllSchools } from '../repositories/schools.repository'
import { upsertTarget as repoUpsertTarget, listTargetsForFinancialYear } from '../repositories/targets.repository'
import { listBatchesForFinancialYear } from '../repositories/studentFeedbackBatches.repository'
import { listAllTeacherFeedback } from '../repositories/teacherFeedbacks.repository'
import { getCurrentFinancialYear } from '../utils/academicPeriod'
import { countUniqueTeacherResponses } from '../utils/teacherResponseCount'
import { ApiError } from '../utils/ApiError'

// Same lightweight-passcode convention as tours.service.ts's
// TOUR_MANAGEMENT_PASSCODE — a UI confirmation gate, not a substitute for
// the Super Admin session already required by every route.
export const SET_TARGET_PASSCODE = 'fia@123'

function assertRequiredString(value: unknown, label: string): string {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) throw new ApiError(400, `${label} is required.`)
  return trimmed
}

function assertPositiveInteger(value: unknown, label: string): number {
  const num = Number(value)
  if (!Number.isInteger(num) || num <= 0) {
    throw new ApiError(400, `${label} must be a positive whole number.`)
  }
  return num
}

interface Stat {
  target: number
  achieved: number
  remaining: number
  progressPercent: number
}

function buildStat(target: number, achieved: number): Stat {
  const remaining = Math.max(0, target - achieved)
  const progressPercent = target > 0 ? Math.round((achieved / target) * 100) : 0
  return { target, achieved, remaining, progressPercent }
}

export async function getDistrictOptions(env: Env) {
  return repoGetDistrictOptions(env)
}

export async function upsertTarget(
  env: Env,
  superAdminId: string,
  payload: { financialYear?: unknown; month?: unknown; district?: unknown; state?: unknown; teacherTarget?: unknown; studentTarget?: unknown },
) {
  const financialYear = assertRequiredString(payload.financialYear, 'Financial Year')
  const month = assertRequiredString(payload.month, 'Month')
  const district = assertRequiredString(payload.district, 'District')
  const state = assertRequiredString(payload.state, 'State')
  const teacherTarget = assertPositiveInteger(payload.teacherTarget, 'Teacher Target')
  const studentTarget = assertPositiveInteger(payload.studentTarget, 'Student Target')

  const target = await repoUpsertTarget(env, { financialYear, month, district, state, teacherTarget, studentTarget, createdBy: superAdminId })
  return {
    financialYear: target.data.financialYear,
    month: target.data.month,
    state: target.data.state,
    district: target.data.district,
    teacherTarget: target.data.teacherTarget,
    studentTarget: target.data.studentTarget,
    createdAt: target.data.createdAt,
    updatedAt: target.data.updatedAt,
  }
}

// Live "where we stand, today" snapshot for the CURRENT financial year,
// summed across every month set so far for it — no period filter/selector,
// matches the original's always-this-year behavior.
export async function getTargetProgress(env: Env) {
  const financialYear = getCurrentFinancialYear()

  const [schools, targets, batchDocs, teacherDocs] = await Promise.all([
    listAllSchools(env),
    listTargetsForFinancialYear(env, financialYear),
    listBatchesForFinancialYear(env, financialYear),
    listAllTeacherFeedback(env), // filtered by financialYear below (no composite index needed for a Worker-side filter on an already-small dataset)
  ])

  const stateByDistrict = new Map<string, string>()
  const districtByUdise = new Map<string, string>()
  schools.forEach((school) => {
    districtByUdise.set(school.data.udise, school.data.district)
    if (!stateByDistrict.has(school.data.district)) stateByDistrict.set(school.data.district, school.data.state)
  })

  interface DistrictEntry {
    district: string
    state: string
    teacherTarget: number
    studentTarget: number
    teacherDocs: Array<{ udise?: string; email?: string; submittedBy?: string }>
    studentsReached: number
  }

  const byDistrict = new Map<string, DistrictEntry>()
  const getEntry = (district: string): DistrictEntry => {
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
    return byDistrict.get(district) as DistrictEntry
  }

  stateByDistrict.forEach((_state, district) => getEntry(district))

  targets.forEach((target) => {
    const entry = getEntry(target.data.district)
    entry.teacherTarget += target.data.teacherTarget
    entry.studentTarget += target.data.studentTarget
  })

  batchDocs.forEach((doc) => {
    const district = districtByUdise.get(doc.data.udise)
    if (district) getEntry(district).studentsReached += doc.data.studentCount
  })

  teacherDocs
    .filter((doc) => doc.data.financialYear === financialYear)
    .forEach((doc) => {
      const district = districtByUdise.get(doc.data.udise)
      if (district) getEntry(district).teacherDocs.push(doc.data)
    })

  const districts = Array.from(byDistrict.values())
    .map((entry) => ({
      district: entry.district,
      state: entry.state,
      teacher: buildStat(entry.teacherTarget, countUniqueTeacherResponses(entry.teacherDocs)),
      student: buildStat(entry.studentTarget, entry.studentsReached),
    }))
    .sort((a, b) => a.district.localeCompare(b.district, 'en', { sensitivity: 'base' }))

  const sumAcross = (unit: 'student' | 'teacher', key: keyof Stat) => districts.reduce((sum, entry) => sum + entry[unit][key], 0)

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
