// Ported from server/src/services/school.service.js, with ONE deliberate
// change to how newly-registered schools get their default password:
//
// The original bcrypt-hashed (cost 12) the UDISE-as-default-password for
// EVERY inserted row at upload time. That's fine on a long-lived Node
// process but is a real Workers CPU-time cliff: bcrypt cost 12 is roughly
// 1-1.5s of CPU per hash, so a 300-school upload would need ~5-7 minutes
// of CPU in a single request — far past what a Worker invocation allows
// (even on the Paid plan's raised limits).
//
// Fix: leave `passwordHash` unset on bulk insert. The School model already
// has (and always had) a legacy fallback for exactly this case — a school
// with no stored hash logs in by typing its own UDISE as the password (see
// teacherAuth.service.ts), and that first successful login persists a real
// hash from then on (self-heal). So bulk upload now costs zero bcrypt CPU,
// and the hash gets created lazily, one at a time, spread across each
// school's actual first login — same observable behavior (UDISE is always
// the working default password), same eventual stored data shape, just
// computed later instead of all at once.
import * as XLSX from 'xlsx'
import type { Env } from '../env'
import { createSchool, findSchoolsByUdises } from '../repositories/schools.repository'
import { ApiError } from '../utils/ApiError'

const REQUIRED_COLUMNS = ['UDISE', 'School Name', 'District', 'State']

const FIELD_BY_NORMALIZED_HEADER: Record<string, string> = {
  udise: 'udise',
  'school name': 'schoolName',
  district: 'district',
  state: 'state',
}

function normalizeHeader(header: unknown): string {
  return String(header ?? '').trim().toLowerCase()
}

interface ParsedRow {
  rowNumber: number
  udise?: string
  schoolName?: string
  district?: string
  state?: string
}

function parseSchoolListBuffer(buffer: ArrayBuffer): ParsedRow[] {
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  } catch {
    throw new ApiError(400, 'Could not read that file. Please upload a valid .xlsx file.')
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) {
    throw new ApiError(400, 'The uploaded file has no worksheets.')
  }

  const headerRow = (XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][])[0] || []
  const normalizedHeaders = headerRow.map(normalizeHeader)

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !normalizedHeaders.includes(normalizeHeader(column)))
  if (missingColumns.length > 0) {
    throw new ApiError(400, 'Missing required columns', { missingColumns })
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }) as Array<Record<string, unknown>>
  if (rows.length === 0) {
    throw new ApiError(400, 'The uploaded file has no data rows.')
  }

  return rows.map((row, index) => {
    const mapped: ParsedRow = { rowNumber: index + 2 }
    Object.entries(row).forEach(([key, value]) => {
      const field = FIELD_BY_NORMALIZED_HEADER[normalizeHeader(key)]
      if (field) (mapped as unknown as Record<string, unknown>)[field] = String(value ?? '').trim()
    })
    return mapped
  })
}

function validateRow(row: ParsedRow): string[] {
  const missingFields: string[] = []
  if (!row.udise) missingFields.push('UDISE')
  if (!row.schoolName) missingFields.push('School Name')
  if (!row.district) missingFields.push('District')
  if (!row.state) missingFields.push('State')
  return missingFields
}

function missingFieldsMessage(missingFields: string[]): string {
  if (missingFields.length === 1) return `Missing ${missingFields[0]}`
  return `Missing required data (${missingFields.join(', ')})`
}

const UDISE_FORMAT_RULES: Array<{ isValid: (udise: string) => boolean; reason: string }> = [
  { isValid: (udise) => /^\d+$/.test(udise), reason: 'UDISE must contain only numeric digits.' },
  { isValid: (udise) => udise.length === 11, reason: 'UDISE must contain exactly 11 digits.' },
  { isValid: (udise) => udise.startsWith('0'), reason: 'UDISE must start with 0.' },
]

function validateUdiseFormat(udise: string): string | null {
  const failedRule = UDISE_FORMAT_RULES.find((rule) => !rule.isValid(udise))
  return failedRule ? failedRule.reason : null
}

function rowSummary(row: ParsedRow) {
  return {
    rowNumber: row.rowNumber,
    udise: row.udise || '',
    schoolName: row.schoolName || '',
    district: row.district || '',
    state: row.state || '',
  }
}

export interface UploadResultRow {
  udise: string
  schoolName: string
  district: string
  state: string
  status: 'registered' | 'duplicate' | 'invalid-udise' | 'invalid'
  message: string
}

export interface UploadSummary {
  total: number
  success: number
  duplicates: number
  invalidUdise: number
  invalid: number
  results: UploadResultRow[]
}

export async function processSchoolListUpload(env: Env, buffer: ArrayBuffer, maxSizeBytes = 10 * 1024 * 1024): Promise<UploadSummary> {
  if (buffer.byteLength > maxSizeBytes) {
    throw new ApiError(400, 'File is too large. Maximum size is 10 MB.')
  }

  const parsedRows = parseSchoolListBuffer(buffer)

  const results: Array<UploadResultRow & { rowNumber: number }> = []
  const seenUdises = new Set<string>()
  const candidates: ParsedRow[] = []

  parsedRows.forEach((row) => {
    const missingFields = validateRow(row)
    if (missingFields.length > 0) {
      results.push({ ...rowSummary(row), status: 'invalid', message: missingFieldsMessage(missingFields) })
      return
    }

    const udiseFormatError = validateUdiseFormat(row.udise as string)
    if (udiseFormatError) {
      results.push({ ...rowSummary(row), status: 'invalid-udise', message: udiseFormatError })
      return
    }

    if (seenUdises.has(row.udise as string)) {
      results.push({ ...rowSummary(row), status: 'duplicate', message: 'Duplicate UDISE within this file' })
      return
    }
    seenUdises.add(row.udise as string)
    candidates.push(row)
  })

  const existingSchools = candidates.length
    ? await findSchoolsByUdises(env, candidates.map((row) => row.udise as string))
    : new Map()

  const toInsert = candidates.filter((row) => !existingSchools.has(row.udise as string))
  const alreadyExisting = candidates.filter((row) => existingSchools.has(row.udise as string))

  alreadyExisting.forEach((row) => {
    results.push({ ...rowSummary(row), status: 'duplicate', message: 'UDISE already registered' })
  })

  // Sequential, not Promise.all — Workers caps concurrent subrequests, and
  // a large upload (hundreds of schools) issuing one Firestore write each
  // is exactly the kind of burst that limit exists for. No bcrypt hashing
  // happens here (see file-level comment), so each write is cheap; the
  // sequential loop trades a little wall-clock time for staying safely
  // under the subrequest ceiling.
  for (const row of toInsert) {
    try {
      await createSchool(env, {
        udise: row.udise as string,
        schoolName: row.schoolName as string,
        district: row.district as string,
        state: row.state as string,
        districtCode: '',
        postalCode: '',
      })
      results.push({ ...rowSummary(row), status: 'registered', message: 'Registered successfully' })
    } catch {
      // Another request registered this UDISE in the tiny window between
      // our dedupe check and this write (createDoc fails on conflict).
      results.push({ ...rowSummary(row), status: 'duplicate', message: 'UDISE already registered' })
    }
  }

  results.sort((a, b) => a.rowNumber - b.rowNumber)
  const finalResults: UploadResultRow[] = results.map(({ rowNumber: _rowNumber, ...rest }) => rest)

  return {
    total: parsedRows.length,
    success: finalResults.filter((result) => result.status === 'registered').length,
    duplicates: finalResults.filter((result) => result.status === 'duplicate').length,
    invalidUdise: finalResults.filter((result) => result.status === 'invalid-udise').length,
    invalid: finalResults.filter((result) => result.status === 'invalid').length,
    results: finalResults,
  }
}
