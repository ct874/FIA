import * as XLSX from 'xlsx'

const TEMPLATE_HEADERS = ['UDISE', 'School Name', 'District', 'State']

export function downloadSchoolListTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ['08180701101', 'MAHATMA GANDHI GOVT. SCHOOL DHANSA BLOCK BHINMAL (213759)', 'JALOR', 'Rajasthan'],
  ])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Schools')
  XLSX.writeFile(workbook, 'fia-school-list-template.xlsx')
}
