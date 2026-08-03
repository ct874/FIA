import * as XLSX from 'xlsx'
import bcrypt from 'bcryptjs'
import { School } from '../models/school.model.js'
import { ApiError } from '../utils/ApiError.js'

const SALT_ROUNDS = 12

const REQUIRED_COLUMNS = ['UDISE', 'School Name', 'District', 'State']

const FIELD_BY_NORMALIZED_HEADER = {
  udise: 'udise',
  'school name': 'schoolName',
  district: 'district',
  state: 'state',
}

function normalizeHeader(header) {
  return String(header ?? '').trim().toLowerCase()
}

function parseSchoolListBuffer(buffer) {
  let workbook
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' })
  } catch {
    throw new ApiError(400, 'Could not read that file. Please upload a valid .xlsx file.')
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) {
    throw new ApiError(400, 'The uploaded file has no worksheets.')
  }

  const headerRow = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] || []
  const normalizedHeaders = headerRow.map(normalizeHeader)

  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !normalizedHeaders.includes(normalizeHeader(column)),
  )
  if (missingColumns.length > 0) {
    throw new ApiError(400, 'Missing required columns', { missingColumns })
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
  if (rows.length === 0) {
    throw new ApiError(400, 'The uploaded file has no data rows.')
  }

  return rows.map((row, index) => {
    const mapped = { rowNumber: index + 2 }
    Object.entries(row).forEach(([key, value]) => {
      const field = FIELD_BY_NORMALIZED_HEADER[normalizeHeader(key)]
      if (field) mapped[field] = String(value ?? '').trim()
    })
    return mapped
  })
}

function validateRow(row) {
  const missingFields = []
  if (!row.udise) missingFields.push('UDISE')
  if (!row.schoolName) missingFields.push('School Name')
  if (!row.district) missingFields.push('District')
  if (!row.state) missingFields.push('State')
  return missingFields
}

function missingFieldsMessage(missingFields) {
  if (missingFields.length === 1) return `Missing ${missingFields[0]}`
  return `Missing required data (${missingFields.join(', ')})`
}

function rowSummary(row) {
  return {
    rowNumber: row.rowNumber,
    udise: row.udise || '',
    schoolName: row.schoolName || '',
    district: row.district || '',
    state: row.state || '',
  }
}

export async function processSchoolListUpload(buffer) {
  const parsedRows = parseSchoolListBuffer(buffer)

  const results = []
  const seenUdises = new Set()
  const candidates = []

  parsedRows.forEach((row) => {
    const missingFields = validateRow(row)
    if (missingFields.length > 0) {
      results.push({ ...rowSummary(row), status: 'invalid', message: missingFieldsMessage(missingFields) })
      return
    }
    if (seenUdises.has(row.udise)) {
      results.push({ ...rowSummary(row), status: 'duplicate', message: 'Duplicate UDISE within this file' })
      return
    }
    seenUdises.add(row.udise)
    candidates.push(row)
  })

  const existingSchools = candidates.length
    ? await School.find({ udise: { $in: candidates.map((row) => row.udise) } }).select('udise')
    : []
  const existingUdiseSet = new Set(existingSchools.map((school) => school.udise))

  const toInsert = candidates.filter((row) => !existingUdiseSet.has(row.udise))
  const alreadyExisting = candidates.filter((row) => existingUdiseSet.has(row.udise))

  alreadyExisting.forEach((row) => {
    results.push({ ...rowSummary(row), status: 'duplicate', message: 'UDISE already registered' })
  })

  if (toInsert.length > 0) {
    // insertMany bypasses the School model's pre('save') hash hook, so the
    // default password (the UDISE itself) is hashed explicitly here — this
    // is what turns an uploaded school row into a working Teacher Portal login.
    const docs = await Promise.all(
      toInsert.map(async (row) => ({
        udise: row.udise,
        schoolName: row.schoolName,
        district: row.district,
        state: row.state,
        password: await bcrypt.hash(row.udise, SALT_ROUNDS),
      })),
    )

    try {
      await School.insertMany(docs, { ordered: false })
      toInsert.forEach((row) => {
        results.push({ ...rowSummary(row), status: 'registered', message: 'Registered successfully' })
      })
    } catch (error) {
      // ordered:false keeps going past a duplicate-key race; classify per-doc from the write errors.
      const failedUdises = new Set(
        (error.writeErrors || []).map((writeError) => writeError.err?.op?.udise).filter(Boolean),
      )
      toInsert.forEach((row) => {
        if (failedUdises.has(row.udise)) {
          results.push({ ...rowSummary(row), status: 'duplicate', message: 'UDISE already registered' })
        } else {
          results.push({ ...rowSummary(row), status: 'registered', message: 'Registered successfully' })
        }
      })
    }
  }

  results.sort((a, b) => a.rowNumber - b.rowNumber)
  results.forEach((result) => delete result.rowNumber)

  return {
    total: parsedRows.length,
    success: results.filter((result) => result.status === 'registered').length,
    duplicates: results.filter((result) => result.status === 'duplicate').length,
    invalid: results.filter((result) => result.status === 'invalid').length,
    results,
  }
}
