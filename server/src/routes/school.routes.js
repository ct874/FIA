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
  updateSchoolExportCodes,
  exportAfeOfficialCsv,
} from '../controllers/school.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { createActionRateLimiter } from '../middleware/rateLimiters.js'

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
router.get('/export/afe-official', exportAfeOfficialCsv)
router.post('/upload', upload.single('file'), uploadSchoolList)
// Every route below re-checks the Super Admin password on top of the
// session token, so they all get the same action rate-limit protection —
// each its own limiter instance (see rateLimiters.js).
router.patch('/:udise/export-codes', createActionRateLimiter(), updateSchoolExportCodes)
router.delete('/data', createActionRateLimiter(), deleteProgramData)
router.post('/reset', createActionRateLimiter(), resetDatabase)
router.delete('/', createActionRateLimiter(), deleteAllSchools)

export default router
