import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { authenticate } from '../middleware/authenticate'
import { rateLimiter } from '../middleware/rateLimiter'
import { getDistrictTargets, postDistrictTarget } from '../controllers/districtFeedbackTarget.controller'

const router = new Hono<AppEnv>()

router.use('*', authenticate)

router.get('/', getDistrictTargets)
router.post('/', rateLimiter('district-feedback-targets'), postDistrictTarget)

export default router
