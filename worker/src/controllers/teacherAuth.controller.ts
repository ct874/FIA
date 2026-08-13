// Ported from server/src/controllers/teacherAuth.controller.js. `sub` is
// now the school's UDISE instead of a Mongo ObjectId.
import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { authenticateSchoolLogin, getSchoolById } from '../services/teacherAuth.service'
import { generateAuthToken } from '../auth/jwt'
import { sendSuccess } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'

function schoolToSafeJSON(school: Awaited<ReturnType<typeof getSchoolById>>) {
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

export async function teacherLogin(c: Context<AppEnv>) {
  const body = await c.req.json()
  const { udise, password, rememberMe } = body

  if (!udise || !String(udise).trim()) {
    throw new ApiError(400, 'UDISE is required')
  }
  if (!password) {
    throw new ApiError(400, 'Password is required')
  }

  const school = await authenticateSchoolLogin(c.env, String(udise).trim(), password)

  const { token } = await generateAuthToken(c.env, { sub: school.id, role: 'school' }, { rememberMe: Boolean(rememberMe) })

  return sendSuccess(c, { message: 'Login successful', data: { token, school: schoolToSafeJSON(school) } })
}

export async function teacherLogout(c: Context<AppEnv>) {
  return sendSuccess(c, { message: 'Logged out successfully' })
}

export async function getCurrentSchool(c: Context<AppEnv>) {
  const schoolId = c.get('schoolId') as string
  const school = await getSchoolById(c.env, schoolId)
  return sendSuccess(c, { message: 'Session valid', data: schoolToSafeJSON(school) })
}
