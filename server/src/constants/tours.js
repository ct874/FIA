// Fixed Career Tour catalog. IDs match the partner CSV `tour_id` column
// exactly (AFE-IN_CT_Form1 export) so records stay traceable back to source.
//
// `enabled: false` tours are fully defined (id, name, export code reserved
// in src/features/export/utils/exportMappings.js) but stay hidden from every
// teacher-portal checkbox/select until real content exists for them — flip
// the flag to true to launch a tour with no other code changes required.
export const TOURS = [
  { tourId: 'CT-L-AWS-01', tourName: 'AWS Data Center Tour: Uncovering Cloud Computing', enabled: true },
  { tourId: 'CT-L-FC-01', tourName: 'Robotics Fulfillment Center Tour', enabled: true },
  { tourId: 'CT-L-AI-01', tourName: 'AI Career Tour', enabled: false },
  { tourId: 'CT-L-AM-01', tourName: 'Amazon Music Career Tour', enabled: true },
  { tourId: 'CT-L-PRIME-01', tourName: 'Amazon Prime (Streaming) Career Tour', enabled: false },
]

// Tours currently offered to teachers/students — this is the list every
// teacher-portal page and submission-count check should use.
export const ENABLED_TOURS = TOURS.filter((tour) => tour.enabled)

export const TOUR_IDS = ENABLED_TOURS.map((tour) => tour.tourId)

// Keyed off every tour (enabled or not) so a lookup never fails even for a
// disabled tour referenced by old data.
export const TOUR_BY_ID = new Map(TOURS.map((tour) => [tour.tourId, tour]))
