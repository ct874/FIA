import { listTours, createTour, deleteTour } from '../services/tours.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'

export const getTours = asyncHandler(async (_req, res) => {
  const tours = await listTours()
  sendSuccess(res, { message: 'Tours fetched', data: tours })
})

export const postTour = asyncHandler(async (req, res) => {
  const tour = await createTour(req.superAdminId, req.body)
  sendSuccess(res, { statusCode: 201, message: 'Tour created', data: tour })
})

export const removeTour = asyncHandler(async (req, res) => {
  const { tourId } = req.params
  const { password } = req.body
  const tour = await deleteTour(tourId, password)
  sendSuccess(res, { message: 'Tour deleted', data: tour })
})
