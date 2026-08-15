import { Router } from 'express'
import { authenticateSchool } from '../middleware/authenticateSchool.js'
import { getMeta, getStatus, getDashboard } from '../controllers/teacherDashboard.controller.js'
import { getTeacherFeedback, postTeacherFeedback } from '../controllers/teacherFeedback.controller.js'
import { postStudentFeedbackBatch } from '../controllers/studentFeedbackBatch.controller.js'
import {
  getStudentFeedbackSummaryHandler,
  postStudentFeedback,
} from '../controllers/studentFeedback.controller.js'
import { getResponses } from '../controllers/teacherResponses.controller.js'

const router = Router()

router.use(authenticateSchool)

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
