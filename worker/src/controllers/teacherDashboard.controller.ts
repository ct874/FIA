import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { GRADES, LANGUAGES } from '../constants/grades'
import { getSchoolStatus, getDashboardOverview } from '../services/teacherStatus.service'
import { getSchoolById } from '../services/teacherAuth.service'
import { getTourCatalog } from '../services/tourCatalog.service'
import { sendSuccess } from '../utils/ApiResponse'

export async function getMeta(c: Context<AppEnv>) {
  const tourCatalog = await getTourCatalog(c.env)
  return sendSuccess(c, {
    message: 'Meta fetched',
    data: { tours: tourCatalog.enabledTours, grades: GRADES, languages: LANGUAGES },
  })
}

export async function getStatus(c: Context<AppEnv>) {
  const schoolId = c.get('schoolId') as string
  const tourCatalog = await getTourCatalog(c.env)
  const status = await getSchoolStatus(c.env, schoolId, tourCatalog.tourIds.length)
  return sendSuccess(c, { message: 'Status fetched', data: status })
}

export async function getDashboard(c: Context<AppEnv>) {
  const schoolId = c.get('schoolId') as string
  const [school, overview] = await Promise.all([getSchoolById(c.env, schoolId), getDashboardOverview(c.env, schoolId)])
  return sendSuccess(c, {
    message: 'Dashboard fetched',
    data: {
      school: {
        id: school.id,
        udise: school.data.udise,
        schoolName: school.data.schoolName,
        district: school.data.district,
        state: school.data.state,
        districtCode: school.data.districtCode || '',
        postalCode: school.data.postalCode || '',
        createdAt: school.data.createdAt,
      },
      ...overview,
    },
  })
}
