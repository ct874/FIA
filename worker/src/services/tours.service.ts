// Ported from server/src/services/tours.service.js. THE critical piece of
// the tour-ID migration requirement: AWS=1/Robotics=2/Music=3 stay fixed
// forever, and every new tour gets the next unused number (never reused,
// even across a soft delete) — see repositories/tours.repository.ts for
// the actual atomic-counter mechanics this delegates to.
import type { Env } from '../env'
import {
  claimNextTourCode,
  createCustomTour,
  listActiveTours,
  softDeleteTour,
} from '../repositories/tours.repository'
import { ApiError } from '../utils/ApiError'

// Tour Management screen access passcode — a lightweight UI confirmation
// gate, NOT a substitute for real authentication (every route already
// requires a valid Super Admin JWT — see middleware/authenticate.ts).
export const TOUR_MANAGEMENT_PASSCODE = 'fia@123'

function assertPasscode(password: unknown): void {
  if (!password || typeof password !== 'string') {
    throw new ApiError(400, 'Password is required.')
  }
  if (password !== TOUR_MANAGEMENT_PASSCODE) {
    throw new ApiError(403, 'Incorrect password.')
  }
}

export interface TourSafeJSON {
  tourId: string
  tourName: string
  code: number
  durationMinutes: number
  createdAt: string
}

export async function listTours(env: Env): Promise<TourSafeJSON[]> {
  const docs = await listActiveTours(env)
  return docs.map((doc) => ({
    tourId: doc.data.tourId,
    tourName: doc.data.tourName,
    code: doc.data.code,
    durationMinutes: doc.data.durationMinutes,
    createdAt: doc.data.createdAt,
  }))
}

export async function createTour(
  env: Env,
  superAdminId: string,
  input: { tourName: unknown; durationMinutes: unknown; password: unknown },
): Promise<TourSafeJSON> {
  assertPasscode(input.password)

  const trimmedName = String(input.tourName ?? '').trim()
  if (!trimmedName) {
    throw new ApiError(400, 'Tour Name is required.')
  }

  const duration = Number(input.durationMinutes)
  if (!Number.isInteger(duration) || duration <= 0) {
    throw new ApiError(400, 'Tour Duration must be a positive whole number of minutes.')
  }

  const code = await claimNextTourCode(env)
  const tourId = `CT-L-CUSTOM-${code}`

  const created = await createCustomTour(env, { tourId, tourName: trimmedName, code, durationMinutes: duration, createdBy: superAdminId })
  return {
    tourId: created.data.tourId,
    tourName: created.data.tourName,
    code: created.data.code,
    durationMinutes: created.data.durationMinutes,
    createdAt: created.data.createdAt,
  }
}

// Never cascades into feedback documents — those store tourId/tourName
// denormalized directly, so historical feedback and exports for a deleted
// tour stay fully intact and readable.
export async function deleteTour(env: Env, tourId: string, password: unknown): Promise<{ tourId: string; tourName: string }> {
  assertPasscode(password)

  const activeTours = await listActiveTours(env)
  const tour = activeTours.find((doc) => doc.data.tourId === tourId)
  if (!tour) {
    throw new ApiError(404, 'Tour not found.')
  }

  await softDeleteTour(env, tourId)
  return { tourId: tour.data.tourId, tourName: tour.data.tourName }
}
