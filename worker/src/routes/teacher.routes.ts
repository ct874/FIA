import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { authenticateSchool } from '../middleware/authenticateSchool'
import { getMeta, getStatus, getDashboard } from '../controllers/teacherDashboard.controller'
import { getTeacherFeedback, postTeacherFeedback } from '../controllers/teacherFeedback.controller'
import { getStudentFeedbackSummaryHandler, postStudentFeedback } from '../controllers/studentFeedback.controller'
import { postStudentFeedbackBatch } from '../controllers/studentFeedbackBatch.controller'
import { getResponses } from '../controllers/teacherResponses.controller'

const router = new Hono<AppEnv>()

router.use('*', authenticateSchool)

router.get('/meta', getMeta)
router.get('/status', getStatus)
router.get('/dashboard', getDashboard)
router.get('/feedback', getTeacherFeedback)
router.post('/feedback', postTeacherFeedback)
router.get('/student-feedback/summary', getStudentFeedbackSummaryHandler)
router.post('/student-feedback/batches', postStudentFeedbackBatch)
router.post('/student-feedback', postStudentFeedback)
router.get('/responses', getResponses)

export default router
