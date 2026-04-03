import { useState } from 'react';
import type { BudgetItem } from '../../types';
import { useCreateBudgetItem, useDeleteBudgetItem } from '../../hooks/useBudget';

interface Props {
  projectId: number;
  budgetItems: BudgetItem[];
  canEdit: boolean;
}

export default function BudgetTable({ projectId, budgetItems, canEdit }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: '', description: '', amount: '', is_actual: false });
  const createMutation = useCreateBudgetItem();
  const deleteMutation = useDeleteBudgetItem();

  const handleAdd = async () => {
    if (!form.category.trim() || !form.amount) return;
    await createMutation.mutateAsync({
      project_id: projectId,
      category: form.category.trim(),
      description: form.description.trim() || undefined,
      amount: parseFloat(form.amount),
      is_actual: form.is_actual,
    });
    setForm({ category: '', description: '', amount: '', is_actual: false });
    setShowAdd(false);
  };

  const planned = budgetItems.filter((b) => !b.is_actual);
  const actual = budgetItems.filter((b) => b.is_actual);
  const totalPlanned = planned.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalActual = actual.reduce((sum, b) => sum + Number(b.amount), 0);
  const variance = totalPlanned - totalActual;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Budget (RAB)</h3>
        {canEdit && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAdd ? 'Cancel' : '+ Add Item'}
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Planned</p>
          <p className="text-sm font-bold text-blue-600">Rp {totalPlanned.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Actual</p>
          <p className="text-sm font-bold text-green-600">Rp {totalActual.toLocaleString('id-ID')}</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${variance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-xs text-gray-500">Variance</p>
          <p className={`text-sm font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {variance >= 0 ? '+' : ''}Rp {variance.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {showAdd && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
          <input
            type="text"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            placeholder="Category (e.g. Material, Labor, Transport)"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description (optional)"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder="Amount (Rp)"
              min={0}
              className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center gap-1.5 text-sm text-gray-700 shrink-0">
              <input
                type="checkbox"
                checked={form.is_actual}
                onChange={(e) => setForm((p) => ({ ...p, is_actual: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Actual
            </label>
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

      {budgetItems.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No budget items recorded</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Category</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Description</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Type</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Amount</th>
                {canEdit && <th className="py-2 px-2 w-8"></th>}
              </tr>
            </thead>
            <tbody>
              {budgetItems.map((b) => (
                <tr key={b.id} className="border-b border-gray-100">
                  <td className="py-2 px-2 text-gray-700">{b.category}</td>
                  <td className="py-2 px-2 text-gray-500 text-xs">{b.description ?? '--'}</td>
                  <td className="py-2 px-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      b.is_actual ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {b.is_actual ? 'Actual' : 'Planned'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-gray-900 font-medium text-right">
                    Rp {Number(b.amount).toLocaleString('id-ID')}
                  </td>
                  {canEdit && (
                    <td className="py-2 px-2">
                      <button
                        onClick={() => deleteMutation.mutate({ id: b.id, projectId })}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        aria-label={`Delete ${b.category}`}
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
          </table>
        </div>
      )}
    </div>
  );
}
