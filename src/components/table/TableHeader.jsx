function SortIcon({ direction }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M7 10l5-5 5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-colors duration-150 ${direction === 'asc' ? 'text-slate-900' : 'text-slate-300'}`}
      />
      <path
        d="M7 14l5 5 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-colors duration-150 ${direction === 'desc' ? 'text-slate-900' : 'text-slate-300'}`}
      />
    </svg>
  )
}

export default function TableHeader({ columns, sortKey, sortDirection, onSort }) {
  return (
    <thead className="sticky top-0 z-10 bg-slate-50">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            scope="col"
            onClick={column.sortable ? () => onSort(column.key) : undefined}
            className={`border-b border-slate-200 px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase whitespace-nowrap
              ${column.sortable ? 'cursor-pointer select-none hover:text-slate-800' : ''}
              ${column.wrap ? column.wrapWidthClassName || 'w-56' : ''}`}
          >
            <span className="inline-flex items-center gap-1">
              {column.label}
              {column.sortable && (
                <SortIcon direction={sortKey === column.key ? sortDirection : null} />
              )}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  )
}
