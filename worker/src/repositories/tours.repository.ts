// Firestore collection: tours/{tourId} — plus a single counter document at
// meta/tourCounter tracking the highest numeric code ever issued. THIS IS
// THE MOST CRITICAL PIECE OF THE MIGRATION: AWS=1/Robotics=2/Music=3 must
// stay permanently fixed, and every new tour must get the next unused
// number, forever increasing, NEVER reusing a deleted tour's old code.
//
// The counter is bumped via Firestore's atomic `increment` field transform
// (see firestore/client.ts's incrementField) — a single round trip, no
// read-modify-write race, strictly more correct under concurrency than the
// original Mongo version (which just re-queried MAX(code) non-atomically).
// `deletedAt` is ALWAYS written explicitly (never omitted) on every tour,
// including the 3 seeded ones — Firestore's `deletedAt == null` query does
// NOT match documents where the field is simply absent, so omitting it
// would silently make the active-tours list empty.
import type { Env } from '../env'
import { createDoc, getDoc, incrementField, patchDoc, runQueryAll } from '../firestore/client'

const TOURS_COLLECTION = 'tours'
const META_COLLECTION = 'meta'
const TOUR_COUNTER_DOC_ID = 'tourCounter'

export interface TourDocRecord {
  tourId: string
  tourName: string
  code: number
  durationMinutes: number
  createdBy: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

const SEED_TOURS: Array<{ tourId: string; tourName: string; code: number; durationMinutes: number }> = [
  { tourId: 'CT-L-AWS-01', tourName: 'AWS Data Center Tour: Uncovering Cloud Computing', code: 1, durationMinutes: 27 },
  { tourId: 'CT-L-FC-01', tourName: 'Robotics Fulfillment Center Tour', code: 2, durationMinutes: 48 },
  { tourId: 'CT-L-AM-01', tourName: 'Amazon Music Career Tour', code: 3, durationMinutes: 30 },
]

// Idempotent — safe to call on every cold start. Never touches
// tourName/durationMinutes on an existing row (only sets them on insert),
// matching the original's "never modify the existing durations of
// AWS/Robotics/Music" guarantee. Also seeds meta/tourCounter to 3 the first
// time this runs, since `increment` errors on a field that doesn't exist
// yet on a brand-new document with no prior value to increment from.
export async function ensureSeedTours(env: Env): Promise<void> {
  await Promise.all(
    SEED_TOURS.map(async (tour) => {
      const existing = await getDoc<TourDocRecord>(env, TOURS_COLLECTION, tour.tourId)
      if (existing) return
      const now = new Date().toISOString()
      await createDoc<TourDocRecord>(env, TOURS_COLLECTION, tour.tourId, {
        ...tour,
        createdBy: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      })
    }),
  )

  const counter = await getDoc<{ highestCode: number }>(env, META_COLLECTION, TOUR_COUNTER_DOC_ID)
  if (!counter) {
    await patchDoc<{ highestCode: number }>(env, META_COLLECTION, TOUR_COUNTER_DOC_ID, { highestCode: 3 }, {
      updateMask: ['highestCode'],
    })
  }
}

// Every active (non-deleted) tour, sorted by code ascending — AWS(1) ->
// Robotics(2) -> Music(3) -> any Super-Admin-created tours, in creation
// order. Requires a composite index on (deletedAt ASC, code ASC) — see
// firestore.indexes.json.
export async function listActiveTours(env: Env) {
  return runQueryAll<TourDocRecord>(env, {
    from: TOURS_COLLECTION,
    where: [{ field: 'deletedAt', op: 'EQUAL', value: null }],
    orderBy: [{ field: 'code', direction: 'ASCENDING' }],
  })
}

export async function findTourByTourId(env: Env, tourId: string) {
  return getDoc<TourDocRecord>(env, TOURS_COLLECTION, tourId)
}

// Atomically claims the next numeric Tour ID. AWS/Robotics/Music occupy
// 1-3 and the counter is seeded to exactly 3 (see ensureSeedTours), so the
// first-ever increment yields 4, then 5, 6, ... — never reused, even across
// a soft-deleted tour, since the counter only ever goes up.
export async function claimNextTourCode(env: Env): Promise<number> {
  return incrementField(env, META_COLLECTION, TOUR_COUNTER_DOC_ID, 'highestCode', 1)
}

export async function createCustomTour(
  env: Env,
  input: { tourId: string; tourName: string; code: number; durationMinutes: number; createdBy: string },
) {
  const now = new Date().toISOString()
  return createDoc<TourDocRecord>(env, TOURS_COLLECTION, input.tourId, {
    ...input,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  })
}

// Soft delete — never removes the row, so its numeric `code` can never be
// reassigned (the counter only ever increases) and a deleted ORIGINAL tour
// (AWS/Robotics/Music) stays deleted across a restart instead of being
// silently re-seeded by ensureSeedTours (which only inserts a tourId that's
// entirely missing).
export async function softDeleteTour(env: Env, tourId: string) {
  return patchDoc<Partial<TourDocRecord>>(
    env,
    TOURS_COLLECTION,
    tourId,
    { deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { updateMask: ['deletedAt', 'updatedAt'] },
  )
}
