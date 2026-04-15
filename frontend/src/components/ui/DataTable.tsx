import { useState, useMemo, useCallback, type ReactNode } from 'react';
import * as XLSX from 'xlsx';

// ── Types ────────────────────────────────────────────────────────────────────

export type RowAge = 'new' | 'recent' | 'normal' | 'stale';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  /** Custom render for cell. Falls back to row[key] */
  render?: (row: T, index: number) => ReactNode;
  /** Value used for sorting (defaults to row[key]) */
  sortValue?: (row: T) => string | number;
  /** Value used for export (defaults to row[key]) */
  exportValue?: (row: T) => string | number;
  /** Text align */
  align?: 'left' | 'right' | 'center';
  /** Extra header class */
  headerClass?: string;
  /** Extra cell class */
  cellClass?: string;
  /** If true, column is hidden in table but included in export */
  exportOnly?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Unique key extractor */
  rowKey: (row: T) => string | number;
  /** Determine row age for color coding */
  rowAge?: (row: T) => RowAge;
  /** Custom row click handler */
  onRowClick?: (row: T) => void;
  /** Extra row classes */
  rowClass?: (row: T) => string;
  /** Default sort key */
  defaultSortKey?: string;
  /** Default sort direction */
  defaultSortDesc?: boolean;
  /** Rows per page options */
  pageSizeOptions?: number[];
  /** Default page size */
  defaultPageSize?: number;
  /** File name for export (without extension) */
  exportFileName?: string;
  /** Show export button */
  showExport?: boolean;
  /** Footer row(s) rendered below tbody */
  footer?: ReactNode;
  /** Slot for action column at the end (e.g. delete button) */
  actionColumn?: {
    label?: string;
    width?: string;
    render: (row: T) => ReactNode;
  };
  /** Empty state message */
  emptyMessage?: string;
  /** Extra class for the wrapper */
  className?: string;
}

// ── Row age colors ───────────────────────────────────────────────────────────

const AGE_COLORS: Record<RowAge, string> = {
  new:    'bg-blue-50/60 border-l-4 border-l-blue-400',
  recent: 'bg-emerald-50/40 border-l-4 border-l-emerald-300',
  normal: '',
  stale:  'bg-gray-50/60 border-l-4 border-l-gray-300 text-gray-400',
};

const AGE_LEGEND: { key: RowAge; label: string; dot: string }[] = [
  { key: 'new',    label: 'New (< 24h)',   dot: 'bg-blue-400' },
  { key: 'recent', label: 'Recent (< 7d)', dot: 'bg-emerald-300' },
  { key: 'normal', label: 'Normal',        dot: 'bg-gray-400' },
  { key: 'stale',  label: 'Stale (no progress)', dot: 'bg-gray-300' },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  rowAge,
  onRowClick,
  rowClass,
  defaultSortKey,
  defaultSortDesc = true,
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  exportFileName = 'export',
  showExport = true,
  footer,
  actionColumn,
  emptyMessage = 'No data found.',
  className = '',
}: DataTableProps<T>) {

  // ── Sorting state ──────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDesc, setSortDesc] = useState(defaultSortDesc);

  // ── Pagination state ───────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // ── Visible columns (exclude exportOnly) ───────────────────────────────────
  const visibleColumns = useMemo(() => columns.filter((c) => !c.exportOnly), [columns]);

  // ── Sorted data ────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;

    const copy = [...data];
    copy.sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : (a as Record<string, unknown>)[col.key];
      const bv = col.sortValue ? col.sortValue(b) : (b as Record<string, unknown>)[col.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return sortDesc ? bv - av : av - bv;
      const cmp = String(av).localeCompare(String(bv));
      return sortDesc ? -cmp : cmp;
    });
    return copy;
  }, [data, sortKey, sortDesc, columns]);

  // ── Paginated slice ────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = useMemo(
    () => sorted.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [sorted, safePage, pageSize],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
    setPage(0);
  }, [sortKey]);

  const handlePageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(0);
  }, []);

  // ── Export to Excel ────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const rows = sorted.map((row) => {
      const obj: Record<string, unknown> = {};
      for (const col of columns) {
        obj[col.label] = col.exportValue
          ? col.exportValue(row)
          : (row as Record<string, unknown>)[col.key] ?? '';
      }
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${exportFileName}.xlsx`);
  }, [sorted, columns, exportFileName]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const colSpan = visibleColumns.length + (actionColumn ? 1 : 0);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{sorted.length} row{sorted.length !== 1 ? 's' : ''}</span>
          {rowAge && (
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-gray-300">|</span>
              {AGE_LEGEND.map((l) => (
                <span key={l.key} className="flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${l.dot}`} />
                  {l.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showExport && sorted.length > 0 && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" role="table">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map((col) => {
                const isSortable = col.sortable !== false;
                const isActive = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${isSortable ? 'cursor-pointer hover:text-gray-700 select-none' : ''} ${col.headerClass ?? ''}`}
                    onClick={isSortable ? () => handleSort(col.key) : undefined}
                    role="columnheader"
                    aria-sort={isActive ? (sortDesc ? 'descending' : 'ascending') : 'none'}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {isSortable && isActive && (
                        <span className="text-blue-500">{sortDesc ? '\u2193' : '\u2191'}</span>
                      )}
                    </span>
                  </th>
                );
              })}
              {actionColumn && (
                <th className={`px-4 py-3 ${actionColumn.width ?? 'w-12'}`}>
                  {actionColumn.label ?? ''}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => {
                const age = rowAge?.(row) ?? 'normal';
                const ageClass = AGE_COLORS[age];
                const extra = rowClass?.(row) ?? '';
                return (
                  <tr
                    key={rowKey(row)}
                    className={`${ageClass} ${extra} ${onRowClick ? 'cursor-pointer' : ''} hover:bg-gray-50/80 transition-colors`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-sm ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        } ${col.cellClass ?? ''}`}
                      >
                        {col.render
                          ? col.render(row, safePage * pageSize + idx)
                          : String((row as Record<string, unknown>)[col.key] ?? '--')}
                      </td>
                    ))}
                    {actionColumn && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {actionColumn.render(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
          {footer}
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > pageSizeOptions[0] && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSize(Number(e.target.value))}
              className="border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>per page</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={safePage === 0}
              className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="First page"
            >
              &laquo;
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              &lsaquo;
            </button>
            <span className="px-2 py-1 font-medium">
              {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={safePage >= totalPages - 1}
              className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Last page"
            >
              &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
