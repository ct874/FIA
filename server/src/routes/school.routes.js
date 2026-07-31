import { Router } from 'express'
import multer from 'multer'
import {
  uploadSchoolList,
  listSchools,
  lookupSchoolByUdise,
  deleteAllSchools,
} from '../controllers/school.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

const router = Router()

router.get('/lookup/:udise', lookupSchoolByUdise)

router.use(authenticate)
router.get('/', listSchools)
router.post('/upload', upload.single('file'), uploadSchoolList)
router.delete('/', deleteAllSchools)

export default router
