// Builds the live tour catalog fresh per request (see constants/tours.ts's
// doc comment for why this replaced the original's mutable module-level
// cache). Every service below that needs ENABLED_TOURS/TOUR_BY_ID/TOUR_IDS
// calls this once and threads the result through.
import type { Env } from '../env'
import { listActiveTours } from '../repositories/tours.repository'
import { buildTourCatalog, type TourCatalog, type TourRecord } from '../constants/tours'

export async function getTourCatalog(env: Env): Promise<TourCatalog> {
  const activeTours = await listActiveTours(env)
  const dbTours: TourRecord[] = activeTours.map((doc) => ({
    tourId: doc.data.tourId,
    tourName: doc.data.tourName,
    enabled: true,
    code: doc.data.code,
    durationMinutes: doc.data.durationMinutes,
  }))
  return buildTourCatalog(dbTours)
}
