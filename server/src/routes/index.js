import { Router } from 'express'
import authRoutes from './auth.routes.js'
import schoolRoutes from './school.routes.js'
import teacherAuthRoutes from './teacherAuth.routes.js'
import teacherRoutes from './teacher.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/schools', schoolRoutes)
router.use('/teacher-auth', teacherAuthRoutes)
router.use('/teacher', teacherRoutes)

// Future modules (District Management, Video Management, Reports,
// Analytics, Settings, etc.) will register their routers here.

export default router
