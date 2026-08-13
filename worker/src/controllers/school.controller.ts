// Ported from server/src/controllers/school.controller.js.
import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { processSchoolListUpload } from '../services/school.service'
import { getSchoolsOverview, getAdminSubmissions, deleteAllProgramData, deleteAllSchoolsData } from '../services/adminDashboard.service'
import { verifySuperAdminPassword } from '../services/auth.service'
import { buildAfeOfficialRows, validateAfeOfficialRows, toAfeCsvRow, stripAfeRowMeta } from '../services/afeExport.service'
import { getTourCatalog } from '../services/tourCatalog.service'
import { AFE_OFFICIAL_COLUMNS } from '../constants/afeOfficialColumns'
import { buildCsv } from '../utils/csv'
import { sendSuccess } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'
import { sortBySchoolName } from '../utils/feedbackSort'
import { listAllSchools, findSchoolByUdise, patchSchool } from '../repositories/schools.repository'

function schoolToSafeJSON(school: { id: string; data: { udise: string; schoolName: string; district: string; state: string; districtCode: string; postalCode: string; createdAt: string } }) {
  return {
    id: school.id,
    udise: school.data.udise,
    schoolName: school.data.schoolName,
    district: school.data.district,
    state: school.data.state,
    districtCode: school.data.districtCode || '',
    postalCode: school.data.postalCode || '',
    createdAt: school.data.createdAt,
  }
}

// Duck-typed rather than `instanceof File` — the ambient `File` global from
// @cloudflare/workers-types doesn't resolve cleanly under this tsconfig's
// DOM-less `lib`, but the Workers runtime's FormData File entries always
// have a real `.arrayBuffer()` method, which is all this needs.
interface UploadedFileLike {
  arrayBuffer(): Promise<ArrayBuffer>
}

function isUploadedFileLike(value: unknown): value is UploadedFileLike {
  return typeof value === 'object' && value !== null && typeof (value as UploadedFileLike).arrayBuffer === 'function'
}

export async function uploadSchoolList(c: Context<AppEnv>) {
  const formData = await c.req.formData()
  const file = formData.get('file')
  if (!isUploadedFileLike(file)) {
    throw new ApiError(400, 'Please attach an Excel (.xlsx) file.')
  }

  const buffer = await file.arrayBuffer()
  const summary = await processSchoolListUpload(c.env, buffer)
  return sendSuccess(c, { message: 'File processed', data: summary })
}

export async function listSchools(c: Context<AppEnv>) {
  const schools = sortBySchoolName(await listAllSchools(c.env), (school) => school.data.schoolName)
  return sendSuccess(c, { message: 'Schools fetched', data: schools.map(schoolToSafeJSON) })
}

// Public (unauthenticated) — used by the Teacher Portal login screen to
// confirm a UDISE is registered, without exposing the full school list.
export async function lookupSchoolByUdise(c: Context<AppEnv>) {
  const udise = (c.req.param('udise') ?? '').trim()
  const school = await findSchoolByUdise(c.env, udise)
  if (!school) {
    throw new ApiError(404, 'UDISE not found')
  }
  return sendSuccess(c, {
    message: 'School found',
    data: { udise: school.data.udise, schoolName: school.data.schoolName, district: school.data.district },
  })
}

export async function deleteAllSchools(c: Context<AppEnv>) {
  const superAdminId = c.get('superAdminId') as string
  const body = await c.req.json().catch(() => ({}))
  await verifySuperAdminPassword(c.env, superAdminId, body?.password)

  await deleteAllSchoolsData(c.env)
  return sendSuccess(c, { message: 'All schools deleted' })
}

export async function getSchoolsDashboard(c: Context<AppEnv>) {
  const tourCatalog = await getTourCatalog(c.env)
  const schools = await getSchoolsOverview(c.env, tourCatalog)
  return sendSuccess(c, { message: 'Dashboard data fetched', data: { schools } })
}

export async function getSchoolsSubmissions(c: Context<AppEnv>) {
  const data = await getAdminSubmissions(c.env)
  return sendSuccess(c, { message: 'Submissions fetched', data })
}

export async function deleteProgramData(c: Context<AppEnv>) {
  const superAdminId = c.get('superAdminId') as string
  const body = await c.req.json().catch(() => ({}))
  await verifySuperAdminPassword(c.env, superAdminId, body?.password)

  await deleteAllProgramData(c.env)
  return sendSuccess(c, { message: 'All feedback data deleted' })
}

// Password-confirmed, one-way-door per field: only ever accepts a new
// value while still blank — a District Code/Postal Code can never be
// overwritten after being finalized (enforced here, not just the frontend).
export async function updateSchoolExportCodes(c: Context<AppEnv>) {
  const superAdminId = c.get('superAdminId') as string
  const body = await c.req.json()
  await verifySuperAdminPassword(c.env, superAdminId, body?.password)

  const udise = (c.req.param('udise') ?? '').trim()
  const school = await findSchoolByUdise(c.env, udise)
  if (!school) {
    throw new ApiError(404, 'School not found.')
  }

  const nextDistrictCode = String(body?.districtCode ?? '').trim()
  const nextPostalCode = String(body?.postalCode ?? '').trim()

  const updates: Record<string, string> = {}
  const updateMask: string[] = []
  if (nextDistrictCode && !school.data.districtCode) {
    updates.districtCode = nextDistrictCode
    updateMask.push('districtCode')
  }
  if (nextPostalCode && !school.data.postalCode) {
    updates.postalCode = nextPostalCode
    updateMask.push('postalCode')
  }

  if (updateMask.length > 0) {
    await patchSchool(c.env, udise, updates, updateMask)
  }
  // Merged locally rather than trusting patchSchool's return type (typed
  // Partial<SchoolRecord> since a patch only ever touches the given
  // fields) — this is always the complete, current record either way.
  const finalRecord = { ...school.data, ...updates }
  return sendSuccess(c, { message: 'District code / postal code updated', data: schoolToSafeJSON({ id: school.id, data: finalRecord }) })
}

// `?format=json` returns the generated rows as data (export preview table);
// any other request returns the validated file as a CSV download. See
// services/afeExport.service.ts for the transformation and utils/csv.ts's
// doc comment for why this is an in-memory build rather than a true stream.
export async function exportAfeOfficialCsv(c: Context<AppEnv>) {
  const tourCatalog = await getTourCatalog(c.env)
  const rows = await buildAfeOfficialRows(c.env, tourCatalog)
  validateAfeOfficialRows(rows, tourCatalog)

  if (c.req.query('format') === 'json') {
    return sendSuccess(c, {
      message: 'AFE CSV (Official) export data fetched',
      data: { columns: AFE_OFFICIAL_COLUMNS, rows: rows.map(stripAfeRowMeta) },
    })
  }

  const csv = buildCsv(AFE_OFFICIAL_COLUMNS, rows.map(toAfeCsvRow))
  const filename = `fia-afe-official-${new Date().toISOString().slice(0, 10)}.csv`
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

// "Delete Everything / Reset Database" — requires re-entering the Super
// Admin password even though the request already carries a valid session
// token, since this is the most destructive action in the app.
export async function resetDatabase(c: Context<AppEnv>) {
  const superAdminId = c.get('superAdminId') as string
  const body = await c.req.json()
  await verifySuperAdminPassword(c.env, superAdminId, body?.password)

  await Promise.all([deleteAllSchoolsData(c.env), deleteAllProgramData(c.env)])
  return sendSuccess(c, { message: 'Database reset successfully' })
}
