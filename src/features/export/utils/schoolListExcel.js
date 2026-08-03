import * as XLSX from 'xlsx'

const TEMPLATE_HEADERS = ['UDISE', 'School Name', 'District', 'State']

export function downloadSchoolListTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ['00000000000', 'Example Government Senior Secondary School', 'Example District', 'Example State'],
  ])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Schools')
  XLSX.writeFile(workbook, 'fia-school-list-template.xlsx')
}
