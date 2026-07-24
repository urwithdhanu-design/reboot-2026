import { type ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useTableState, type SortDir, type SortValue, type UseTableStateOptions } from '../../lib/tableState';
import { Button } from './index';

export type DataTableColumn = {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
};

type PaginatedTableProps<T> = {
  columns: DataTableColumn[];
  rows: T[];
  rowKey: (row: T) => string;
  renderRow: (row: T) => ReactNode;
  emptyMessage?: string;
  pageSizeOptions?: number[];
} & UseTableStateOptions<T>;

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" aria-hidden />;
  return dir === 'asc' ? (
    <ChevronUp className="w-3.5 h-3.5" aria-hidden />
  ) : (
    <ChevronDown className="w-3.5 h-3.5" aria-hidden />
  );
}

export function TablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-lbg-gray-100 bg-lbg-gray-50/50">
      <p className="text-xs text-lbg-gray-500">
        Showing <span className="font-semibold text-lbg-gray-700">{start}</span>–
        <span className="font-semibold text-lbg-gray-700">{end}</span> of{' '}
        <span className="font-semibold text-lbg-gray-700">{totalItems}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-lbg-gray-500">
          Rows
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-lbg-gray-200 bg-white px-2 py-1 text-xs font-medium text-lbg-gray-700"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className="text-xs font-medium text-lbg-gray-600 min-w-[4.5rem] text-center">
          {page} / {totalPages}
        </span>
        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function PaginatedTable<T>({
  columns,
  rows,
  rowKey,
  renderRow,
  emptyMessage = 'No records to display.',
  pageSizeOptions,
  ...tableOptions
}: PaginatedTableProps<T>) {
  const table = useTableState(rows, tableOptions);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-lbg-gray-100 bg-lbg-green-light/40">
              {columns.map((col) => {
                const active = table.sortKey === col.key;
                const sortable = col.sortable === true;
                return (
                  <th
                    key={col.key || col.label}
                    scope="col"
                    className={`text-left py-3 px-4 text-[11px] font-bold text-lbg-green-dark uppercase tracking-wide whitespace-nowrap ${col.className ?? ''}`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => table.toggleSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-lbg-gray-700 transition-colors"
                      >
                        {col.label}
                        <SortIcon active={active} dir={table.sortDir} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-lbg-gray-100">
            {table.pageItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-sm text-lbg-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.pageItems.map((row) => renderRow(row))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={table.page}
        pageSize={table.pageSize}
        totalItems={table.totalItems}
        totalPages={table.totalPages}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        pageSizeOptions={pageSizeOptions}
      />
    </>
  );
}

export function usePaginatedList<T>(rows: T[], options: UseTableStateOptions<T> = {}) {
  const table = useTableState(rows, options);
  return table;
}

export type { SortValue };
