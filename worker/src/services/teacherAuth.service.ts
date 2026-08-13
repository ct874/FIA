// Ported from server/src/services/teacherAuth.service.js — School/Teacher
// Portal authentication. `schoolId` throughout is the school's UDISE (the
// Firestore doc ID) instead of a Mongo ObjectId.
import type { Env } from '../env'
import { findSchoolByUdise, patchSchool, type SchoolRecord } from '../repositories/schools.repository'
import { comparePassword, hashPassword } from '../auth/password'
import { ApiError } from '../utils/ApiError'
import type { DecodedDocument } from '../firestore/codec'

export async function authenticateSchoolLogin(env: Env, udise: string, password: string): Promise<DecodedDocument<SchoolRecord>> {
  const school = await findSchoolByUdise(env, udise)
  if (!school) {
    throw new ApiError(401, 'Invalid UDISE or password')
  }

  const isPasswordValid = school.data.passwordHash
    ? await comparePassword(password, school.data.passwordHash)
    : password === school.data.udise // legacy school, never given an explicit password

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid UDISE or password')
  }

  // Self-heal legacy schools (registered before password support existed,
  // or bulk-uploaded without an inline hash — see school.service.ts's
  // processSchoolListUpload) by persisting a proper hash once they've
  // proven they know the UDISE. This is also what keeps the bulk-upload
  // endpoint cheap: it deliberately never bcrypt-hashes at insert time,
  // relying entirely on this self-heal happening on each school's first
  // login instead of hashing every row up front.
  if (!school.data.passwordHash) {
    const passwordHash = await hashPassword(password)
    await patchSchool(env, udise, { passwordHash }, ['passwordHash'])
  }

  return school
}

export async function getSchoolById(env: Env, udise: string): Promise<DecodedDocument<SchoolRecord>> {
  const school = await findSchoolByUdise(env, udise)
  if (!school) {
    throw new ApiError(401, 'Session is no longer valid')
  }
  return school
}
