import { ENABLED_TOURS } from '../constants/tours.js'
import { GRADES, LANGUAGES } from '../constants/grades.js'
import { getSchoolStatus, getDashboardOverview } from '../services/teacherStatus.service.js'
import { getSchoolById } from '../services/teacherAuth.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'

export const getMeta = asyncHandler(async (_req, res) => {
  sendSuccess(res, {
    message: 'Meta fetched',
    data: { tours: ENABLED_TOURS, grades: GRADES, languages: LANGUAGES },
  })
})

export const getStatus = asyncHandler(async (req, res) => {
  const status = await getSchoolStatus(req.schoolId)
  sendSuccess(res, { message: 'Status fetched', data: status })
})

export const getDashboard = asyncHandler(async (req, res) => {
  const [school, overview] = await Promise.all([
    getSchoolById(req.schoolId),
    getDashboardOverview(req.schoolId),
  ])
  sendSuccess(res, {
    message: 'Dashboard fetched',
    data: { school: school.toSafeJSON(), ...overview },
  })
})
