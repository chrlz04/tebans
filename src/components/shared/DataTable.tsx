import clsx from 'clsx'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  keyExtractor: (row: T) => string
  totalCount?: number
  itemName?: string
  summary?: React.ReactNode
}

export default function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found.',
  keyExtractor,
  totalCount,
  itemName,
  summary,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading...
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm min-w-max">
        {/* Header */}
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((col, index) => (
              <th
                key={String(col.key)}
                className={clsx(
                  'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap',
                  index === 0 ? 'sticky left-0 z-10 bg-gray-50 shadow-[1px_0_0_0_#e5e7eb]' : '',
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        {/* Body */}
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-gray-50 transition-colors group"
              >
                {columns.map((col, index) => (
                  <td
                    key={String(col.key)}
                    className={clsx(
                      'px-4 py-3 text-gray-700 min-h-[44px] whitespace-nowrap',
                      index === 0 ? 'sticky left-0 z-10 bg-white group-hover:bg-gray-50 shadow-[1px_0_0_0_#e5e7eb]' : '',
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Footer / Count Info */}
      {!isLoading && totalCount !== undefined && itemName && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
          <div>
            Showing {data.length} of {totalCount} {itemName}
          </div>
          {summary && <div>{summary}</div>}
        </div>
      )}
    </div>
  )
}