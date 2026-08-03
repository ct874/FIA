// Fixed Career Tour catalog. IDs match the partner CSV `tour_id` column
// exactly (AFE-IN_CT_Form1 export) so records stay traceable back to source.
export const TOURS = [
  { tourId: 'CT-L-AWS-01', tourName: 'AWS Data Center Tour: Uncovering Cloud Computing' },
  { tourId: 'CT-L-AM-01', tourName: 'Amazon Music Career Tour' },
  { tourId: 'CT-L-FC-01', tourName: 'Robotics Fulfillment Center Tour' },
]

export const TOUR_IDS = TOURS.map((tour) => tour.tourId)

export const TOUR_BY_ID = new Map(TOURS.map((tour) => [tour.tourId, tour]))
