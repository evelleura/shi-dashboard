import { useState, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { BudgetItem } from '../../types';
import { useCreateBudgetItem, useDeleteBudgetItem } from '../../hooks/useBudget';

interface Props {
  projectId: number;
  budgetItems: BudgetItem[];
  canEdit: boolean;
}

type SortKey = 'category' | 'description' | 'type' | 'amount' | 'created_at';
type RowAge = 'new' | 'recent' | 'normal';

function getBudgetAge(b: BudgetItem): RowAge {
  if (!b.created_at) return 'normal';
  const hoursAgo = (Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60);
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

export default function BudgetTable({ projectId, budgetItems, canEdit }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: '', description: '', amount: '', is_actual: false });
  const createMutation = useCreateBudgetItem();
  const deleteMutation = useDeleteBudgetItem();

  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

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

  const sorted = useMemo(() => {
    const copy = [...budgetItems];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'category': cmp = a.category.localeCompare(b.category); break;
        case 'description': cmp = (a.description ?? '').localeCompare(b.description ?? ''); break;
        case 'type': cmp = Number(a.is_actual) - Number(b.is_actual); break;
        case 'amount': cmp = Number(a.amount) - Number(b.amount); break;
        case 'created_at': cmp = (a.created_at ?? '').localeCompare(b.created_at ?? ''); break;
      }
      return sortDesc ? -cmp : cmp;
    });
    return copy;
  }, [budgetItems, sortKey, sortDesc]);

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
    const rows = sorted.map((b) => ({
      'Category': b.category,
      'Description': b.description ?? '',
      'Type': b.is_actual ? 'Actual' : 'Planned',
      'Amount': Number(b.amount),
    }));
    // Add summary row
    rows.push(
      { Category: '', Description: '', Type: 'Total Planned', Amount: totalPlanned },
      { Category: '', Description: '', Type: 'Total Actual', Amount: totalActual },
      { Category: '', Description: '', Type: 'Variance', Amount: variance },
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Budget');
    XLSX.writeFile(wb, 'budget.xlsx');
  }, [sorted, totalPlanned, totalActual, variance]);

  const SortHeader = ({ label, field, className = '' }: { label: string; field: SortKey; className?: string }) => (
    <th
      className={`py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none ${className}`}
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
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Budget (RAB)</h3>
        <div className="flex items-center gap-2">
          {budgetItems.length > 0 && (
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
              {showAdd ? 'Cancel' : '+ Add Item'}
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Planned</p>
          <p className="text-sm font-bold text-blue-600">Rp {totalPlanned.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Actual</p>
          <p className="text-sm font-bold text-green-600">Rp {totalActual.toLocaleString('id-ID')}</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${variance >= 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
          <p className="text-xs text-gray-500 dark:text-gray-400">Variance</p>
          <p className={`text-sm font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {variance >= 0 ? '+' : ''}Rp {variance.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {showAdd && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3 space-y-2">
          <input
            type="text"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            placeholder="Category (e.g. Material, Labor, Transport)"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description (optional)"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder="Amount (Rp)"
              min={0}
              className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 shrink-0">
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
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No budget items recorded</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <SortHeader label="Category" field="category" className="text-left" />
                  <SortHeader label="Description" field="description" className="text-left" />
                  <SortHeader label="Type" field="type" className="text-left" />
                  <SortHeader label="Amount" field="amount" className="text-right" />
                  {canEdit && <th className="py-2 px-2 w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {paginated.map((b) => {
                  const age = getBudgetAge(b);
                  return (
                    <tr key={b.id} className={`border-b border-gray-100 dark:border-gray-700 ${AGE_BORDER[age]}`}>
                      <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{b.category}</td>
                      <td className="py-2 px-2 text-gray-500 dark:text-gray-400 text-xs">{b.description ?? '--'}</td>
                      <td className="py-2 px-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          b.is_actual ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {b.is_actual ? 'Actual' : 'Planned'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-900 dark:text-gray-100 font-medium text-right">
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {sorted.length > PAGE_SIZES[0] && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded px-1.5 py-1 text-xs"
                >
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(0)} disabled={safePage === 0} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-40">&laquo;</button>
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-40">&lsaquo;</button>
                <span className="px-2 py-1 font-medium">{safePage + 1} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-40">&rsaquo;</button>
                <button onClick={() => setPage(totalPages - 1)} disabled={safePage >= totalPages - 1} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-40">&raquo;</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
