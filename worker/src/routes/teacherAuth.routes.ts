import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { teacherLogin, teacherLogout, getCurrentSchool } from '../controllers/teacherAuth.controller'
import { authenticateSchool } from '../middleware/authenticateSchool'
import { rateLimiter } from '../middleware/rateLimiter'

const router = new Hono<AppEnv>()

router.post('/login', rateLimiter('teacher-auth-login'), teacherLogin)
router.post('/logout', teacherLogout)
router.get('/me', authenticateSchool, getCurrentSchool)

export default router
