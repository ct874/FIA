import { Router } from 'express'
import { getProgress, getDistricts, verifyAccess, saveTarget } from '../controllers/target.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { loginRateLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// Super Admin only — every endpoint here requires a valid session, same as
// school.routes.js.
router.use(authenticate)

router.get('/progress', getProgress)
router.get('/districts', getDistricts)
// Reuses the login rate limiter — this endpoint re-checks a passcode too,
// so it deserves the same brute-force protection as /schools/reset.
router.post('/verify-access', loginRateLimiter, verifyAccess)
router.post('/', saveTarget)

export default router
