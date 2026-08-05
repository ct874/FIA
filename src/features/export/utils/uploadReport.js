import * as XLSX from 'xlsx'

const STATUS_LABELS = {
  registered: 'Registered',
  duplicate: 'Already Registered',
  'invalid-udise': 'Invalid UDISE',
  invalid: 'Invalid Data',
}

export function downloadUploadReport(results) {
  const rows = results.map((row) => ({
    Status: STATUS_LABELS[row.status] || row.status,
    UDISE: row.udise,
    'School Name': row.schoolName,
    District: row.district,
    State: row.state,
    Reason: row.message,
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Upload Report')
  XLSX.writeFile(workbook, 'school-upload-report.xlsx')
}
