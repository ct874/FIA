import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { teacherLogin, teacherLogout, getCurrentSchool } from '../controllers/teacherAuth.controller'
import { authenticateSchool } from '../middleware/authenticateSchool'
import { loginRateLimiter } from '../middleware/rateLimiter'

const router = new Hono<AppEnv>()

router.post('/login', loginRateLimiter('teacher-auth-login', 'udise'), teacherLogin)
router.post('/logout', teacherLogout)
router.get('/me', authenticateSchool, getCurrentSchool)

export default router
