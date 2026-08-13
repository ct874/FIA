import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { authenticate } from '../middleware/authenticate'
import { rateLimiter } from '../middleware/rateLimiter'
import { getProgress, getDistricts, verifyAccess, saveTarget } from '../controllers/target.controller'

const router = new Hono<AppEnv>()

router.use('*', authenticate)

router.get('/progress', getProgress)
router.get('/districts', getDistricts)
router.post('/verify-access', rateLimiter('targets-verify-access'), verifyAccess)
router.post('/', saveTarget)

export default router
