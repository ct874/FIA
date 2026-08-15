import { Router } from 'express'
import { getTours, postTour, removeTour } from '../controllers/tours.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { loginRateLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// Super Admin only — every endpoint here requires a valid session, same as
// target.routes.js.
router.use(authenticate)

router.get('/', getTours)
// Both re-check a passcode before doing anything, so both deserve the same
// brute-force protection as /schools/reset and /targets/verify-access.
router.post('/', loginRateLimiter, postTour)
router.delete('/:tourId', loginRateLimiter, removeTour)

export default router
