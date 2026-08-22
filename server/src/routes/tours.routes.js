import { Router } from 'express'
import { getTours, postTour, removeTour } from '../controllers/tours.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { createActionRateLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// Super Admin only — every endpoint here requires a valid session, same as
// target.routes.js.
router.use(authenticate)

router.get('/', getTours)
// Both re-check a passcode before doing anything, so both deserve the same
// brute-force protection as /schools/reset and /targets/verify-access. Each
// gets its own limiter instance — see rateLimiters.js's comment on why a
// shared singleton was a bug.
router.post('/', createActionRateLimiter(), postTour)
router.delete('/:tourId', createActionRateLimiter(), removeTour)

export default router
