// Placeholder ketika tabel/list kosong.
export function EmptyState({
  judul, deskripsi, aksi,
}: {
  judul: string;
  deskripsi?: string;
  aksi?: { label: string; onClick: () => void };
}) {
  return (
    <div className="px-4 py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="mb-1 text-sm font-semibold text-slate-900">{judul}</h3>
      {deskripsi && <p className="mb-4 text-sm text-slate-500">{deskripsi}</p>}
      {aksi && (
        <button
          type="button"
          onClick={aksi.onClick}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {aksi.label}
        </button>
      )}
    </div>
  );
}
