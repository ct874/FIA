import { School } from '../models/school.model.js'
import { processSchoolListUpload } from '../services/school.service.js'
import { getSchoolsOverview, getAdminSubmissions, deleteAllProgramData } from '../services/adminDashboard.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'

export const uploadSchoolList = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please attach an Excel (.xlsx) file.')
  }

  const summary = await processSchoolListUpload(req.file.buffer)
  sendSuccess(res, { message: 'File processed', data: summary })
})

export const listSchools = asyncHandler(async (_req, res) => {
  const schools = await School.find().sort({ createdAt: -1 })
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

export const deleteAllSchools = asyncHandler(async (_req, res) => {
  await School.deleteMany({})
  sendSuccess(res, { message: 'All schools deleted' })
})

// Real, live data behind every Super Admin dashboard card, table, and export
// — computed from School/StudentReach/StudentFeedback/TeacherFeedback, the
// same collections the Teacher Portal writes to.
export const getSchoolsDashboard = asyncHandler(async (_req, res) => {
  const schools = await getSchoolsOverview()
  sendSuccess(res, { message: 'Dashboard data fetched', data: { schools } })
})

export const getSchoolsSubmissions = asyncHandler(async (_req, res) => {
  const data = await getAdminSubmissions()
  sendSuccess(res, { message: 'Submissions fetched', data })
})

export const deleteProgramData = asyncHandler(async (_req, res) => {
  await deleteAllProgramData()
  sendSuccess(res, { message: 'All feedback and reach data deleted' })
})
