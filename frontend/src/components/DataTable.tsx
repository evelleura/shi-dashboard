// Tabel data: search + sorting + paginasi bernomor + zebra row.
'use client';
import { useMemo, useState, type ReactNode } from 'react';

export interface Kolom<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render?: (row: T, index: number) => ReactNode;
  sortValue?: (row: T) => string | number;
  filterValue?: (row: T) => string;
  width?: string;
}

function IkonSearch() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IkonSort({ aktif, desc }: { aktif: boolean; desc: boolean }) {
  if (!aktif) {
    return (
      <svg className="h-3 w-3 text-slate-300" fill="currentColor" viewBox="0 0 12 16">
        <path d="M3 5l3-3 3 3H3zm0 6l3 3 3-3H3z" />
      </svg>
    );
  }
  return (
    <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 12 16">
      {desc ? <path d="M3 11l3 3 3-3H3z" /> : <path d="M3 5l3-3 3 3H3z" />}
    </svg>
  );
}

function nomorHalaman(current: number, total: number): (number | '…')[] {
  // Hasilkan deretan: 1 … 4 5 [6] 7 8 … N (maks 7 elemen).
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages: (number | '…')[] = [];
  const last = total - 1;
  pages.push(0);
  if (current > 3) pages.push('…');
  for (let i = Math.max(1, current - 1); i <= Math.min(last - 1, current + 1); i++) pages.push(i);
  if (current < last - 3) pages.push('…');
  pages.push(last);
  return pages;
}

export function DataTable<T>({
  kolom,
  data,
  rowKey,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 10,
  emptyMessage = 'Belum ada data.',
  onRowClick,
  searchable = true,
  searchPlaceholder = 'Cari…',
  defaultSortKey,
  defaultSortDesc = true,
  toolbar,
}: {
  kolom: Kolom<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  defaultSortKey?: string;
  defaultSortDesc?: boolean;
  toolbar?: ReactNode;
}) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDesc, setSortDesc] = useState(defaultSortDesc);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim()) return data;
    const needle = q.trim().toLowerCase();
    return data.filter((row) =>
      kolom.some((c) => {
        const v = c.filterValue
          ? c.filterValue(row)
          : (row as Record<string, unknown>)[c.key];
        return v != null && String(v).toLowerCase().includes(needle);
      }),
    );
  }, [data, kolom, q]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = kolom.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : (a as Record<string, unknown>)[col.key];
      const bv = col.sortValue ? col.sortValue(b) : (b as Record<string, unknown>)[col.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return sortDesc ? bv - av : av - bv;
      const cmp = String(av).localeCompare(String(bv), 'id');
      return sortDesc ? -cmp : cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDesc, kolom]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * pageSize;
  const end = Math.min(start + pageSize, sorted.length);
  const halaman = sorted.slice(start, end);

  function ubahSort(key: string) {
    if (sortKey === key) setSortDesc((d) => !d);
    else { setSortKey(key); setSortDesc(true); }
    setPage(0);
  }

  const total = data.length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Toolbar atas — search + slot tambahan + jumlah baris */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-3">
        <div className="flex flex-1 items-center gap-3">
          {searchable && (
            <div className="relative w-full max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"><IkonSearch /></span>
              <input
                type="search"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0); }}
                placeholder={searchPlaceholder}
                className="input pl-9"
              />
            </div>
          )}
          {toolbar}
        </div>
        <div className="text-xs font-medium text-slate-500">
          {q ? (
            <>Menampilkan <span className="font-semibold text-slate-900">{sorted.length}</span> dari {total} baris</>
          ) : (
            <><span className="font-semibold text-slate-900">{total}</span> baris</>
          )}
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50">
              {kolom.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  style={{ width: c.width }}
                  className={
                    'sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 ' +
                    (c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left')
                  }
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => ubahSort(c.key)}
                      className={
                        'inline-flex items-center gap-1.5 transition-colors hover:text-slate-900 ' +
                        (c.align === 'right' ? 'flex-row-reverse' : '')
                      }
                    >
                      {c.label}
                      <IkonSort aktif={sortKey === c.key} desc={sortDesc} />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {halaman.length === 0 && (
              <tr>
                <td colSpan={kolom.length} className="px-4 py-16 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-slate-500">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-700">{q ? 'Tidak ada hasil pencarian' : emptyMessage}</p>
                    {q && <p className="text-xs text-slate-500">Coba kata kunci lain atau bersihkan filter.</p>}
                  </div>
                </td>
              </tr>
            )}
            {halaman.map((row, i) => {
              const idx = start + i;
              return (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={
                    'group transition-colors ' +
                    (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40') + ' ' +
                    (onRowClick ? 'cursor-pointer hover:!bg-blue-50/70' : 'hover:!bg-slate-100/60')
                  }
                >
                  {kolom.map((c, ci) => (
                    <td
                      key={c.key}
                      className={
                        'border-b border-slate-100 px-4 py-3.5 text-sm text-slate-700 group-hover:border-blue-100 ' +
                        (c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : '') + ' ' +
                        (ci === 0 ? 'font-medium text-slate-900' : '')
                      }
                    >
                      {c.render ? c.render(row, idx) : (row as Record<string, unknown>)[c.key] as ReactNode}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginasi */}
      {sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>per halaman</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <span>
              <span className="font-semibold text-slate-900">{start + 1}</span>
              –<span className="font-semibold text-slate-900">{end}</span> dari{' '}
              <span className="font-semibold text-slate-900">{sorted.length}</span>
            </span>
            <div className="flex items-center gap-1">
              <PagerBtn onClick={() => setPage(0)} disabled={safePage === 0} aria="Halaman pertama">«</PagerBtn>
              <PagerBtn onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} aria="Sebelumnya">‹</PagerBtn>
              {nomorHalaman(safePage, totalPages).map((p, i) =>
                p === '…' ? (
                  <span key={'el-' + i} className="px-2 text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={
                      'min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold transition-colors ' +
                      (p === safePage
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100')
                    }
                  >
                    {p + 1}
                  </button>
                )
              )}
              <PagerBtn onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} aria="Selanjutnya">›</PagerBtn>
              <PagerBtn onClick={() => setPage(totalPages - 1)} disabled={safePage >= totalPages - 1} aria="Halaman terakhir">»</PagerBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PagerBtn({
  onClick, disabled, aria, children,
}: { onClick: () => void; disabled?: boolean; aria: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
