import { useMemo, useState } from 'react'
import SearchInput from '../ui/SearchInput'
import TableHeader from './TableHeader'
import TablePagination from './TablePagination'
import TableFillerRows from './TableFillerRows'
import { getFillerRowCount } from './tableRowFiller'
import { useLanguage } from '../../hooks/useLanguage'

export default function DashboardTable({
  columns,
  data,
  searchKeys = [],
  searchPlaceholder,
  emptyMessage,
  pageSize = 10,
  fluid = false,
}) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [page, setPage] = useState(1)

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query || searchKeys.length === 0) return data

    return data.filter((row) =>
      searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(query)),
    )
  }, [data, search, searchKeys])

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData

    const sorted = [...filteredData].sort((a, b) => {
      const valueA = a[sortKey]
      const valueB = b[sortKey]

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return valueA - valueB
      }
      return String(valueA).localeCompare(String(valueB))
    })

    return sortDirection === 'desc' ? sorted.reverse() : sorted
  }, [filteredData, sortKey, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setPage(1)
  }

  const handleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDirection('asc')
    } else {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    }
  }

  return (
    <div>
      {searchKeys.length > 0 && (
        <div className="mb-4 flex justify-end">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="w-full sm:w-72"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-brand-100">
        <table
          className={`w-full border-collapse text-left text-sm ${fluid ? '' : 'min-w-225'}`}
        >
          <TableHeader
            columns={columns}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <tbody>
            {paginatedData.map((row, index) => (
              <tr
                key={row.id ?? index}
                className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 transition-colors duration-150 last:border-b-0 hover:bg-brand-50/50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-slate-700 ${
                      column.wrap
                        ? `align-top wrap-break-word whitespace-normal ${column.wrapWidthClassName || 'w-56'}`
                        : 'whitespace-nowrap'
                    }`}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}

            {paginatedData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  {emptyMessage || t('table.noRecords')}
                </td>
              </tr>
            )}

            <TableFillerRows count={getFillerRowCount(paginatedData.length, pageSize)} colSpan={columns.length} />
          </tbody>
        </table>
      </div>

      <TablePagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={sortedData.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  )
}
