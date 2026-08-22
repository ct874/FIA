import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { login, logout, getCurrentSuperAdmin } from '../controllers/auth.controller'
import { authenticate } from '../middleware/authenticate'
import { loginRateLimiter } from '../middleware/rateLimiter'

const router = new Hono<AppEnv>()

router.post('/login', loginRateLimiter('auth-login', 'loginId'), login)
router.post('/logout', logout)
router.get('/me', authenticate, getCurrentSuperAdmin)

export default router
