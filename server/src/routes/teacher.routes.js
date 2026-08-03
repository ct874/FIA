import { Router } from 'express'
import { authenticateSchool } from '../middleware/authenticateSchool.js'
import { getMeta, getStatus, getDashboard } from '../controllers/teacherDashboard.controller.js'
import { getTeacherFeedback, postTeacherFeedback } from '../controllers/teacherFeedback.controller.js'
import { getStudentReach, postStudentReach } from '../controllers/studentReach.controller.js'
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

router.get('/reach', getStudentReach)
router.post('/reach', postStudentReach)

router.get('/student-feedback/summary', getStudentFeedbackSummaryHandler)
router.post('/student-feedback', postStudentFeedback)

router.get('/responses', getResponses)

export default router
