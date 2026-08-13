import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { listTours, createTour, deleteTour } from '../services/tours.service'
import { sendSuccess } from '../utils/ApiResponse'

export async function getTours(c: Context<AppEnv>) {
  const tours = await listTours(c.env)
  return sendSuccess(c, { message: 'Tours fetched', data: tours })
}

export async function postTour(c: Context<AppEnv>) {
  const superAdminId = c.get('superAdminId') as string
  const body = await c.req.json()
  const tour = await createTour(c.env, superAdminId, body)
  return sendSuccess(c, { statusCode: 201, message: 'Tour created', data: tour })
}

export async function removeTour(c: Context<AppEnv>) {
  const tourId = c.req.param('tourId') ?? ''
  const body = await c.req.json()
  const tour = await deleteTour(c.env, tourId, body?.password)
  return sendSuccess(c, { message: 'Tour deleted', data: tour })
}
