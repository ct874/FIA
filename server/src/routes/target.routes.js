import { Router } from 'express'
import { getProgress, getDistricts, verifyAccess, saveTarget } from '../controllers/target.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { createActionRateLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// Super Admin only — every endpoint here requires a valid session, same as
// school.routes.js.
router.use(authenticate)

router.get('/progress', getProgress)
router.get('/districts', getDistricts)
// This endpoint re-checks a passcode too, so it deserves the same action
// rate-limit protection as /schools/reset (own limiter instance).
router.post('/verify-access', createActionRateLimiter(), verifyAccess)
router.post('/', saveTarget)

export default router
