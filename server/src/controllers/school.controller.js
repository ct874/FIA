import { School } from '../models/school.model.js'
import { processSchoolListUpload } from '../services/school.service.js'
import { getSchoolsOverview, getAdminSubmissions, deleteAllProgramData } from '../services/adminDashboard.service.js'
import { verifySuperAdminPassword } from '../services/auth.service.js'
import { buildAfeOfficialRows, validateAfeOfficialRows, toAfeCsvRow, stripAfeRowMeta } from '../services/afeExport.service.js'
import { AFE_OFFICIAL_COLUMNS } from '../constants/afeOfficialColumns.js'
import { streamCsv } from '../utils/csv.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { sortBySchoolName } from '../utils/feedbackSort.js'

export const uploadSchoolList = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please attach an Excel (.xlsx) file.')
  }

  const summary = await processSchoolListUpload(req.file.buffer)
  sendSuccess(res, { message: 'File processed', data: summary })
})

export const listSchools = asyncHandler(async (_req, res) => {
  const schools = sortBySchoolName(await School.find(), (school) => school.schoolName)
  sendSuccess(res, { message: 'Schools fetched', data: schools.map((school) => school.toSafeJSON()) })
})

// Public (unauthenticated) — used by the Teacher Portal login screen to
// confirm a UDISE is registered, without exposing the full school list.
export const lookupSchoolByUdise = asyncHandler(async (req, res) => {
  const school = await School.findOne({ udise: req.params.udise.trim() })
  if (!school) {
    throw new ApiError(404, 'UDISE not found')
  }
  sendSuccess(res, {
    message: 'School found',
    data: { udise: school.udise, schoolName: school.schoolName, district: school.district },
  })
})

// Destructive — requires the Super Admin password to be re-entered, same as
// resetDatabase below (see its comment for why a valid session token alone
// isn't treated as enough authorization for this).
export const deleteAllSchools = asyncHandler(async (req, res) => {
  await verifySuperAdminPassword(req.superAdminId, req.body?.password)

  await School.deleteMany({})
  sendSuccess(res, { message: 'All schools deleted' })
})

// Real, live data behind every Super Admin dashboard card, table, and export
// — computed from School/StudentFeedbackBatch/StudentFeedback/TeacherFeedback, the
// same collections the Teacher Portal writes to.
export const getSchoolsDashboard = asyncHandler(async (_req, res) => {
  const schools = await getSchoolsOverview()
  sendSuccess(res, { message: 'Dashboard data fetched', data: { schools } })
})

export const getSchoolsSubmissions = asyncHandler(async (_req, res) => {
  const data = await getAdminSubmissions()
  sendSuccess(res, { message: 'Submissions fetched', data })
})

// Destructive — requires the Super Admin password to be re-entered, same as
// resetDatabase below (see its comment for why a valid session token alone
// isn't treated as enough authorization for this).
export const deleteProgramData = asyncHandler(async (req, res) => {
  await verifySuperAdminPassword(req.superAdminId, req.body?.password)

  await deleteAllProgramData()
  sendSuccess(res, { message: 'All feedback data deleted' })
})

// Super Admin -> Export Data -> Per-School District Code & Postal Code.
// Password-confirmed (same re-entered-password requirement as every other
// hard-to-reverse Super Admin action here), and each field is a one-way
// door: it only ever accepts a new value while still blank — once a
// District Code or Postal Code has been saved for a school, this endpoint
// silently leaves it untouched even if a caller sends a different value,
// so a value can never be overwritten after being finalized (enforced here,
// not just by the frontend disabling the input).
export const updateSchoolExportCodes = asyncHandler(async (req, res) => {
  await verifySuperAdminPassword(req.superAdminId, req.body?.password)

  const school = await School.findOne({ udise: req.params.udise.trim() })
  if (!school) {
    throw new ApiError(404, 'School not found.')
  }

  const nextDistrictCode = String(req.body?.districtCode ?? '').trim()
  const nextPostalCode = String(req.body?.postalCode ?? '').trim()

  if (nextDistrictCode && !school.districtCode) {
    school.districtCode = nextDistrictCode
  }
  if (nextPostalCode && !school.postalCode) {
    school.postalCode = nextPostalCode
  }

  await school.save()
  sendSuccess(res, { message: 'District code / postal code updated', data: school.toSafeJSON() })
})

// Super Admin -> Export Data -> AFE CSV (Official). `?format=json` returns
// the generated rows as data (used by the export preview table and the
// "Download Export Workbook" AFE sheet); any other request streams the
// validated file straight to the browser as a CSV download — see
// server/src/services/afeExport.service.js for the full transformation and
// server/src/utils/csv.js for the streaming writer.
export const exportAfeOfficialCsv = asyncHandler(async (req, res) => {
  const rows = await buildAfeOfficialRows()
  validateAfeOfficialRows(rows)

  if (req.query.format === 'json') {
    sendSuccess(res, {
      message: 'AFE CSV (Official) export data fetched',
      data: { columns: AFE_OFFICIAL_COLUMNS, rows: rows.map(stripAfeRowMeta) },
    })
    return
  }

  const filename = `fia-afe-official-${new Date().toISOString().slice(0, 10)}.csv`
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  await streamCsv(res, AFE_OFFICIAL_COLUMNS, rows.map(toAfeCsvRow))
  res.end()
})

// "Delete Everything / Reset Database" — the most destructive Super Admin
// action, so it requires re-entering the Super Admin password even though
// the request already carries a valid session token. Never trust the
// frontend's own confirmation step alone for something this irreversible.
export const resetDatabase = asyncHandler(async (req, res) => {
  const { password } = req.body

  await verifySuperAdminPassword(req.superAdminId, password)

  await Promise.all([School.deleteMany({}), deleteAllProgramData()])
  sendSuccess(res, { message: 'Database reset successfully' })
})
