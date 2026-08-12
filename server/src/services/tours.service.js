import { Tour } from '../models/tour.model.js'
import { setToursCatalog } from '../constants/tours.js'
import { ApiError } from '../utils/ApiError.js'

// Tour Management screen access passcode — a lightweight UI confirmation
// gate, NOT a substitute for real authentication, exactly the same
// convention as target.service.js's SET_TARGET_PASSCODE (kept as its own
// local constant here rather than importing that unrelated module). Every
// route in routes/tours.routes.js already requires a valid Super Admin JWT
// (middleware/authenticate.js) before a request ever reaches this service.
export const TOUR_MANAGEMENT_PASSCODE = 'fia@123'

// The 3 tours that exist today, seeded once (idempotently) so they become
// ordinary rows in the Tour collection — indistinguishable from a
// Super-Admin-created tour, which is what lets create/delete use one code
// path for every tour, existing or new. Durations match the values already
// live in production (see constants/afeExport.js's AFE_TOUR_META) — never
// change these here.
const SEED_TOURS = [
  { tourId: 'CT-L-AWS-01', tourName: 'AWS Data Center Tour: Uncovering Cloud Computing', code: 1, durationMinutes: 27 },
  { tourId: 'CT-L-FC-01', tourName: 'Robotics Fulfillment Center Tour', code: 2, durationMinutes: 48 },
  { tourId: 'CT-L-AM-01', tourName: 'Amazon Music Career Tour', code: 3, durationMinutes: 30 },
]

// Idempotent — upserts by tourId, so running this on every server boot is a
// no-op once the 3 tours already exist. Never touches tourName/durationMinutes
// on an existing row (only sets them on insert), so a Super Admin deleting
// and the app re-seeding on next boot is the only way one of these
// reappears — matches "never modify the existing durations of AWS/Robotics/Music".
export async function ensureSeedTours() {
  await Promise.all(
    SEED_TOURS.map((tour) =>
      Tour.findOneAndUpdate(
        { tourId: tour.tourId },
        { $setOnInsert: tour },
        { upsert: true, setDefaultsOnInsert: true },
      ),
    ),
  )
}

// Reloads the live Tour catalog from the DB and pushes it into
// constants/tours.js's mutable exports — call once at startup (after
// ensureSeedTours()) and again after every create/delete so every existing
// consumer of ENABLED_TOURS/TOUR_BY_ID/TOUR_IDS sees the change immediately.
export async function refreshTourCache() {
  const docs = await Tour.find({ deletedAt: null }).sort({ code: 1 })
  setToursCatalog(
    docs.map((doc) => ({
      tourId: doc.tourId,
      tourName: doc.tourName,
      code: doc.code,
      durationMinutes: doc.durationMinutes,
    })),
  )
}

export async function listTours() {
  const docs = await Tour.find({ deletedAt: null }).sort({ code: 1 })
  return docs.map((doc) => doc.toSafeJSON())
}

function assertPasscode(password) {
  if (!password || typeof password !== 'string') {
    throw new ApiError(400, 'Password is required.')
  }
  if (password !== TOUR_MANAGEMENT_PASSCODE) {
    throw new ApiError(403, 'Incorrect password.')
  }
}

// First created tour = code 4 (AWS/Robotics/Music are 1/2/3); every one
// after that takes the next unused number, forever increasing, never
// reusing a deleted tour's old code — deliberately NOT filtered by
// deletedAt, since a soft-deleted tour's row (and its code) still exists
// (see deleteTour()) and must never be handed to a different tour.
async function getNextTourCode() {
  const highest = await Tour.findOne().sort({ code: -1 }).select('code')
  return Math.max(3, highest?.code ?? 3) + 1
}

export async function createTour(superAdminId, { tourName, durationMinutes, password }) {
  assertPasscode(password)

  const trimmedName = String(tourName ?? '').trim()
  if (!trimmedName) {
    throw new ApiError(400, 'Tour Name is required.')
  }

  const duration = Number(durationMinutes)
  if (!Number.isInteger(duration) || duration <= 0) {
    throw new ApiError(400, 'Tour Duration must be a positive whole number of minutes.')
  }

  const code = await getNextTourCode()
  const tourId = `CT-L-CUSTOM-${code}`

  const created = await Tour.create({
    tourId,
    tourName: trimmedName,
    code,
    durationMinutes: duration,
    createdBy: superAdminId,
  })

  await refreshTourCache()
  return created.toSafeJSON()
}

// Soft delete — sets deletedAt rather than removing the row. Two reasons:
// 1) so its numeric `code` can never be reassigned to a different tour
//    later (getNextTourCode() looks at every row, deleted or not);
// 2) so deleting one of the 3 original tours (AWS/Robotics/Music) actually
//    stays deleted across a server restart — ensureSeedTours() only
//    inserts a tourId that's completely missing, so the row surviving
//    (merely flagged) is what prevents it from being silently re-seeded.
//
// Never touches StudentFeedback / StudentFeedbackBatch / TeacherFeedback —
// those documents store tourId/tourName denormalized directly, so historical
// feedback and exports for a deleted tour stay fully intact and readable.
// Deleting only removes the tour from the pool of tours offered/creatable
// going forward — there's no existing cascade-delete-on-tour-removal
// mechanism in the app to reuse, so the safe default is to leave feedback
// data completely alone.
export async function deleteTour(tourId, password) {
  assertPasscode(password)

  const deleted = await Tour.findOneAndUpdate(
    { tourId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
  )
  if (!deleted) {
    throw new ApiError(404, 'Tour not found.')
  }

  await refreshTourCache()
  return { tourId: deleted.tourId, tourName: deleted.tourName }
}
