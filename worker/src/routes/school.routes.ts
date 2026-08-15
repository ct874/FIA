import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { authenticate } from '../middleware/authenticate'
import { rateLimiter } from '../middleware/rateLimiter'
import {
  uploadSchoolList,
  listSchools,
  lookupSchoolByUdise,
  deleteAllSchools,
  getSchoolsDashboard,
  getSchoolsSubmissions,
  deleteProgramData,
  updateSchoolExportCodes,
  exportAfeOfficialCsv,
  resetDatabase,
} from '../controllers/school.controller'

const router = new Hono<AppEnv>()

// Public — used by the Teacher Portal login screen to confirm a UDISE is
// registered, without exposing the full school list. Must be registered
// BEFORE the router-wide `authenticate` below (Hono matches route
// registration order, same as Express).
router.get('/lookup/:udise', lookupSchoolByUdise)

router.use('*', authenticate)

router.get('/', listSchools)
router.get('/dashboard', getSchoolsDashboard)
router.get('/submissions', getSchoolsSubmissions)
router.get('/export/afe-official', exportAfeOfficialCsv)
router.post('/upload', uploadSchoolList)
router.patch('/:udise/export-codes', rateLimiter('schools-export-codes'), updateSchoolExportCodes)
router.delete('/data', rateLimiter('schools-delete-data'), deleteProgramData)
router.post('/reset', rateLimiter('schools-reset'), resetDatabase)
router.delete('/', rateLimiter('schools-delete-all'), deleteAllSchools)

export default router
