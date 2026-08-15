import { School } from '../models/school.model.js'
import { ApiError } from '../utils/ApiError.js'

export async function authenticateSchoolLogin(udise, password) {
  const school = await School.findOne({ udise }).select('+password')
  if (!school) {
    throw new ApiError(401, 'Invalid UDISE or password')
  }

  const isPasswordValid = await school.comparePassword(password)
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid UDISE or password')
  }

  // Self-heal legacy schools (registered before password support existed) by
  // persisting a proper hash once they've proven they know the UDISE.
  if (!school.password) {
    school.password = password
    await school.save()
  }

  return school
}

export async function getSchoolById(schoolId) {
  const school = await School.findById(schoolId)
  if (!school) {
    throw new ApiError(401, 'Session is no longer valid')
  }
  return school
}
