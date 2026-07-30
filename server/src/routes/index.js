import { Router } from 'express'
import authRoutes from './auth.routes.js'

const router = Router()

router.use('/auth', authRoutes)

// Future modules (Teacher Panel, School Management, District Management,
// Video Management, Reports, Analytics, Settings, etc.) will register
// their routers here, e.g. router.use('/schools', schoolRoutes)

export default router
