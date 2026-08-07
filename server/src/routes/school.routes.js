import { Router } from 'express'
import multer from 'multer'
import {
  uploadSchoolList,
  listSchools,
  lookupSchoolByUdise,
  deleteAllSchools,
  getSchoolsDashboard,
  getSchoolsSubmissions,
  deleteProgramData,
  resetDatabase,
} from '../controllers/school.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { loginRateLimiter } from '../middleware/rateLimiters.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

const router = Router()

router.get('/lookup/:udise', lookupSchoolByUdise)

router.use(authenticate)
router.get('/', listSchools)
router.get('/dashboard', getSchoolsDashboard)
router.get('/submissions', getSchoolsSubmissions)
router.post('/upload', upload.single('file'), uploadSchoolList)
router.delete('/data', deleteProgramData)
// Reuses the login rate limiter — this endpoint re-checks a password too,
// so it deserves the same brute-force protection.
router.post('/reset', loginRateLimiter, resetDatabase)
router.delete('/', deleteAllSchools)

export default router
