import { Router } from 'express'
import { login, logout, getCurrentSuperAdmin } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { createLoginRateLimiters } from '../middleware/rateLimiters.js'

const router = Router()

router.post('/login', createLoginRateLimiters('loginId'), login)
router.post('/logout', logout)
router.get('/me', authenticate, getCurrentSuperAdmin)

export default router
