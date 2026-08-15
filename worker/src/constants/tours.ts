// Adapted from server/src/constants/tours.js. The ONE deliberate structural
// change from the original: that file kept TOURS/ENABLED_TOURS/TOUR_IDS/
// TOUR_BY_ID as mutable module-level state, populated once at server boot
// and mutated in place after every tour create/delete — a pattern that
// does not carry over to Cloudflare Workers, where an isolate is not
// guaranteed to survive across requests (a "cache" like that would go
// silently stale or inconsistent between isolates). Here, the equivalent
// catalog is built FRESH per request from a live Firestore read (see
// repositories/tours.repository.ts) and passed down explicitly — same
// resulting shape and ordering, just request-scoped instead of process-
// lifetime-scoped.
export interface TourRecord {
  tourId: string
  tourName: string
  enabled: boolean
  code?: number
  durationMinutes?: number
}

// `enabled: false` tours (AI/Prime) are dormant placeholders — fully
// defined (id, name, export code reserved in afeExport.ts) but hidden from
// every teacher-portal checkbox/select and excluded from ENABLED_TOURS.
// They are NOT part of the Firestore-backed Tour collection and are
// unaffected by Tour Management — flip `enabled` here to launch one with no
// other code changes required (identical to the original).
export const STATIC_TOURS: TourRecord[] = [
  { tourId: 'CT-L-AWS-01', tourName: 'AWS Data Center Tour: Uncovering Cloud Computing', enabled: true },
  { tourId: 'CT-L-FC-01', tourName: 'Robotics Fulfillment Center Tour', enabled: true },
  { tourId: 'CT-L-AI-01', tourName: 'AI Career Tour', enabled: false },
  { tourId: 'CT-L-AM-01', tourName: 'Amazon Music Career Tour', enabled: true },
  { tourId: 'CT-L-PRIME-01', tourName: 'Amazon Prime (Streaming) Career Tour', enabled: false },
]

export const STATIC_DISABLED_TOURS: TourRecord[] = STATIC_TOURS.filter((tour) => !tour.enabled)

export interface TourCatalog {
  tours: TourRecord[]
  enabledTours: TourRecord[]
  tourIds: string[]
  tourById: Map<string, TourRecord>
}

// `dbTours` = live, non-deleted rows from the Firestore `tours` collection,
// already sorted by `code` (see repositories/tours.repository.ts), each
// with `enabled: true` (only currently-offered DB tours are ever enabled).
// The dormant AI/Prime placeholders are appended after — same order/shape
// as the original constants/tours.js's setToursCatalog().
export function buildTourCatalog(dbTours: TourRecord[]): TourCatalog {
  const tours = [...dbTours, ...STATIC_DISABLED_TOURS]
  const enabledTours = tours.filter((tour) => tour.enabled)
  const tourIds = enabledTours.map((tour) => tour.tourId)
  const tourById = new Map(tours.map((tour) => [tour.tourId, tour]))
  return { tours, enabledTours, tourIds, tourById }
}
