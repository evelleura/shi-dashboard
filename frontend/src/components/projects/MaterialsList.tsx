import { useState, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { Material } from '../../types';
import { useCreateMaterial, useDeleteMaterial } from '../../hooks/useMaterials';

interface Props {
  projectId: number;
  materials: Material[];
  canEdit: boolean;
}

type SortKey = 'name' | 'quantity' | 'unit_price' | 'total_price' | 'created_at';
type RowAge = 'new' | 'recent' | 'normal';

function getMaterialAge(m: Material): RowAge {
  if (!m.created_at) return 'normal';
  const hoursAgo = (Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 24) return 'new';
  if (hoursAgo < 24 * 7) return 'recent';
  return 'normal';
}

const AGE_BORDER: Record<RowAge, string> = {
  new:    'border-l-4 border-l-blue-400',
  recent: 'border-l-4 border-l-emerald-300',
  normal: '',
};

const PAGE_SIZES = [10, 25, 50];

export default function MaterialsList({ projectId, materials, canEdit }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: '1', unit: 'pcs', unit_price: '' });
  const createMutation = useCreateMaterial();
  const deleteMutation = useDeleteMaterial();

  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.unit_price) return;
    await createMutation.mutateAsync({
      project_id: projectId,
      name: form.name.trim(),
      quantity: parseFloat(form.quantity) || 1,
      unit: form.unit || 'pcs',
      unit_price: parseFloat(form.unit_price),
    });
    setForm({ name: '', quantity: '1', unit: 'pcs', unit_price: '' });
    setShowAdd(false);
  };

  const totalValue = materials.reduce((sum, m) => sum + Number(m.total_price), 0);

  const sorted = useMemo(() => {
    const copy = [...materials];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'quantity': cmp = Number(a.quantity) - Number(b.quantity); break;
        case 'unit_price': cmp = Number(a.unit_price) - Number(b.unit_price); break;
        case 'total_price': cmp = Number(a.total_price) - Number(b.total_price); break;
        case 'created_at': cmp = (a.created_at ?? '').localeCompare(b.created_at ?? ''); break;
      }
      return sortDesc ? -cmp : cmp;
    });
    return copy;
  }, [materials, sortKey, sortDesc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = useMemo(
    () => sorted.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [sorted, safePage, pageSize],
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(!sortDesc);
    else { setSortKey(key); setSortDesc(true); }
    setPage(0);
  };

  const handleExport = useCallback(() => {
    const rows = sorted.map((m) => ({
      'Name': m.name,
      'Qty': Number(m.quantity),
      'Unit': m.unit,
      'Unit Price': Number(m.unit_price),
      'Total': Number(m.total_price),
    }));
    rows.push({ Name: 'TOTAL', Qty: 0, Unit: '', 'Unit Price': 0, Total: totalValue });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Materials');
    XLSX.writeFile(wb, 'materials.xlsx');
  }, [sorted, totalValue]);

  const SortHeader = ({ label, field, className = '' }: { label: string; field: SortKey; className?: string }) => (
    <th
      className={`py-2 px-2 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === field && <span className="text-blue-500">{sortDesc ? '\u2193' : '\u2191'}</span>}
      </span>
    </th>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Materials ({materials.length})
        </h3>
        <div className="flex items-center gap-2">
          {materials.length > 0 && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAdd ? 'Cancel' : '+ Add Material'}
            </button>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Material name"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              placeholder="Qty"
              min={0}
              step={0.1}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
              placeholder="Unit"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={form.unit_price}
              onChange={(e) => setForm((p) => ({ ...p, unit_price: e.target.value }))}
              placeholder="Unit price"
              min={0}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={createMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm py-1.5 rounded-md transition-colors"
          >
            {createMutation.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
      )}

      {materials.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No materials recorded</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-gray-200">
                  <SortHeader label="Name" field="name" className="text-left" />
                  <SortHeader label="Qty" field="quantity" className="text-right" />
                  <th className="py-2 px-2 text-left text-xs font-medium text-gray-500">Unit</th>
                  <SortHeader label="Unit Price" field="unit_price" className="text-right" />
                  <SortHeader label="Total" field="total_price" className="text-right" />
                  {canEdit && <th className="py-2 px-2 w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {paginated.map((m) => {
                  const age = getMaterialAge(m);
                  return (
                    <tr key={m.id} className={`border-b border-gray-100 ${AGE_BORDER[age]}`}>
                      <td className="py-2 px-2 text-gray-700">{m.name}</td>
                      <td className="py-2 px-2 text-gray-600 text-right">{Number(m.quantity)}</td>
                      <td className="py-2 px-2 text-gray-600">{m.unit}</td>
                      <td className="py-2 px-2 text-gray-600 text-right">Rp {Number(m.unit_price).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-2 text-gray-900 font-medium text-right">Rp {Number(m.total_price).toLocaleString('id-ID')}</td>
                      {canEdit && (
                        <td className="py-2 px-2">
                          <button
                            onClick={() => deleteMutation.mutate({ id: m.id, projectId })}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            aria-label={`Delete ${m.name}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={4} className="py-2 px-2 text-right font-semibold text-gray-700">Total</td>
                  <td className="py-2 px-2 text-right font-bold text-gray-900">
                    Rp {totalValue.toLocaleString('id-ID')}
                  </td>
                  {canEdit && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          {sorted.length > PAGE_SIZES[0] && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                  className="border border-gray-300 rounded px-1.5 py-1 text-xs"
                >
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(0)} disabled={safePage === 0} className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40">&laquo;</button>
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40">&lsaquo;</button>
                <span className="px-2 py-1 font-medium">{safePage + 1} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40">&rsaquo;</button>
                <button onClick={() => setPage(totalPages - 1)} disabled={safePage >= totalPages - 1} className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40">&raquo;</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
