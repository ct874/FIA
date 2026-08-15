import { Router } from 'express'
import { getDistrictTargets, postDistrictTarget } from '../controllers/districtFeedbackTarget.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { loginRateLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// Super Admin only — every endpoint here requires a valid session, same as
// target.routes.js.
router.use(authenticate)

router.get('/', getDistrictTargets)
// Re-checks a passcode (inside setDistrictTarget()), so it deserves the same
// brute-force protection as /schools/reset and /targets/verify-access.
router.post('/', loginRateLimiter, postDistrictTarget)

export default router
