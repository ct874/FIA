// Career Tour catalog for the Admin panel's filters/exports — mirrors
// server/src/constants/tours.js exactly (tourId/tourName/enabled), so the
// two stay in sync manually if a tour is ever added, renamed, or enabled.
//
// `enabled: false` tours are reserved here so their export codes
// (src/features/export/utils/exportMappings.js) stay stable, but every
// Admin UI list should filter to `.enabled` tours only until real data
// exists for them.
export const TOURS = {
  AWS: { id: 'CT-L-AWS-01', name: 'AWS Data Center Tour: Uncovering Cloud Computing', enabled: true },
  FC: { id: 'CT-L-FC-01', name: 'Robotics Fulfillment Center Tour', enabled: true },
  AI: { id: 'CT-L-AI-01', name: 'AI Career Tour', enabled: false },
  AM: { id: 'CT-L-AM-01', name: 'Amazon Music Career Tour', enabled: true },
  PRIME: { id: 'CT-L-PRIME-01', name: 'Amazon Prime (Streaming) Career Tour', enabled: false },
}

export const ENABLED_TOURS = Object.values(TOURS).filter((tour) => tour.enabled)

/**
 * Merges the live /api/tours catalog (see useTourCatalog(), shape
 * `{ tourId, tourName, code, durationMinutes }`) into this module's
 * `{ id, name, enabled }` shape, additive on top of ENABLED_TOURS — AWS/
 * Robotics/Music always come from the static list above (already present
 * in the live catalog too, so they're de-duplicated by id, never doubled),
 * with any Super-Admin-created tour appended after them. Falls back to
 * exactly ENABLED_TOURS when `liveTours` hasn't loaded yet.
 */
export function mergeLiveTours(liveTours = []) {
  const staticIds = new Set(ENABLED_TOURS.map((tour) => tour.id))
  const extra = liveTours
    .filter((tour) => !staticIds.has(tour.tourId))
    .map((tour) => ({ id: tour.tourId, name: tour.tourName, enabled: true }))
  return [...ENABLED_TOURS, ...extra]
}
