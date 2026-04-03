import { useState } from 'react';
import type { Material } from '../../types';
import { useCreateMaterial, useDeleteMaterial } from '../../hooks/useMaterials';

interface Props {
  projectId: number;
  materials: Material[];
  canEdit: boolean;
}

export default function MaterialsList({ projectId, materials, canEdit }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: '1', unit: 'pcs', unit_price: '' });
  const createMutation = useCreateMaterial();
  const deleteMutation = useDeleteMaterial();

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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Materials ({materials.length})
        </h3>
        {canEdit && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAdd ? 'Cancel' : '+ Add Material'}
          </button>
        )}
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
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Name</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Qty</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Unit</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Unit Price</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Total</th>
                {canEdit && <th className="py-2 px-2 w-8"></th>}
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id} className="border-b border-gray-100">
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
              ))}
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
      )}
    </div>
  );
}
