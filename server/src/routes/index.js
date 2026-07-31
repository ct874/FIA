import { Router } from 'express'
import authRoutes from './auth.routes.js'
import schoolRoutes from './school.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/schools', schoolRoutes)

// Future modules (Teacher Panel, District Management, Video Management,
// Reports, Analytics, Settings, etc.) will register their routers here.

export default router
