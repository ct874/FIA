import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { authenticate } from '../middleware/authenticate'
import { rateLimiter } from '../middleware/rateLimiter'
import { getTours, postTour, removeTour } from '../controllers/tours.controller'

const router = new Hono<AppEnv>()

router.use('*', authenticate)

router.get('/', getTours)
router.post('/', rateLimiter('tours-create'), postTour)
router.delete('/:tourId', rateLimiter('tours-delete'), removeTour)

export default router
