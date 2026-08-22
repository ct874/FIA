import { Router } from 'express'
import { teacherLogin, teacherLogout, getCurrentSchool } from '../controllers/teacherAuth.controller.js'
import { authenticateSchool } from '../middleware/authenticateSchool.js'
import { createLoginRateLimiters } from '../middleware/rateLimiters.js'

const router = Router()

router.post('/login', createLoginRateLimiters('udise'), teacherLogin)
router.post('/logout', teacherLogout)
router.get('/me', authenticateSchool, getCurrentSchool)

export default router
