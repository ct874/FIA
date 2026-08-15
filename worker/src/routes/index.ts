// Mirrors server/src/routes/index.js's mounting exactly — same paths,
// same nesting, mounted under /api in index.ts.
import { Hono } from 'hono'
import type { AppEnv } from '../types'
import authRoutes from './auth.routes'
import schoolRoutes from './school.routes'
import teacherAuthRoutes from './teacherAuth.routes'
import teacherRoutes from './teacher.routes'
import targetRoutes from './target.routes'
import toursRoutes from './tours.routes'
import districtFeedbackTargetRoutes from './districtFeedbackTarget.routes'

const router = new Hono<AppEnv>()

router.route('/auth', authRoutes)
router.route('/schools', schoolRoutes)
router.route('/teacher-auth', teacherAuthRoutes)
router.route('/teacher', teacherRoutes)
router.route('/targets', targetRoutes)
router.route('/tours', toursRoutes)
router.route('/district-feedback-targets', districtFeedbackTargetRoutes)

export default router
