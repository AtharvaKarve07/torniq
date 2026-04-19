import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends object> {
  data: T[];
  columns: Column<T>[];
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  rowKey?: string;
  className?: string;
}

export function DataTable<T extends object>({ data, columns, sortKey, sortDir, onSort, isLoading, emptyMessage = 'No data available', rowKey, className }: DataTableProps<T>) {
  const getVal = (row: T, key: string): unknown => (row as Record<string, unknown>)[key];

  return (
    <div className={cn('rounded-xl border border-zinc-800 overflow-hidden', className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800">
              {columns.map((col) => (
                <th key={col.key} className={cn('px-4 py-3 font-syne font-semibold text-xs uppercase tracking-wider text-zinc-400 whitespace-nowrap', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center', !col.align && 'text-left', col.sortable && 'cursor-pointer hover:text-zinc-100 select-none', col.className)} onClick={() => col.sortable && onSort?.(col.key)}>
                  <div className={cn('flex items-center gap-1', col.align === 'right' && 'justify-end', col.align === 'center' && 'justify-center')}>
                    {col.header}
                    {col.sortable && (
                      <span className="text-zinc-600">
                        {sortKey === col.key ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-amber-400" /> : <ChevronDown className="w-3 h-3 text-amber-400" />) : <ChevronsUpDown className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-800/60">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-zinc-800 rounded animate-pulse" style={{ width: `${50 + (i * 7 % 40)}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-500">{emptyMessage}</td></tr>
            ) : (
              data.map((row, idx) => (
                <tr key={rowKey ? String(getVal(row, rowKey)) : idx} className="data-row">
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-zinc-200', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center', col.className)}>
                      {col.render ? col.render(getVal(row, col.key), row) : String(getVal(row, col.key) ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
